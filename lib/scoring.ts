// ============================================================
// 评分引擎 — AI 替代风险测评 v0.4
// ============================================================

import { Answers } from './questions';

export type Tier = 'safe' | 'watch' | 'alert' | 'danger' | 'critical';

export type AnxietyVsRisk =
  | 'aligned-high'       // 客观高风险 + 主观高焦虑
  | 'aligned-low'        // 客观低风险 + 主观低焦虑
  | 'anxious-overblown'  // 客观低风险 + 主观高焦虑
  | 'complacent-danger'; // 客观高风险 + 主观低焦虑

export interface ScoreResult {
  total: number;
  dimensions: {
    macro:   number;
    task:    number;
    org:     number;
    company: number;
    moat:    number;
    adapt:   number;
  };
  tier: Tier;
  anxietyLevel: number;
  anxietyVsRisk: AnxietyVsRisk;
}

const WEIGHTS = {
  macro:   0.20,
  task:    0.25,
  org:     0.15,
  company: 0.15,
  moat:    0.15,
  adapt:   0.10,
};

// ── 体制内判断 ────────────────────────────────────────────
// 中国公务员/事业编的替代风险逻辑与市场化岗位完全不同：
// ① 无营收指标，AI 无法证明其 ROI → 采购极慢
// ② 铁饭碗机制 → 降本增效≠裁员
// ③ 风险来源不是"被替代"，而是"长期边缘化"和"晋升天花板"
const ZHITINEI_JOBS = new Set([
  '公务员（党政机关）',
  '事业编制（教科文卫）',
  '事业编制（科研院所）',
  '军队/警察/消防',
  '城管/执法人员',
  '社区/街道/村镇干部',
  '其他体制内岗位',
]);

function isZhiTiNei(answers: Answers): boolean {
  const job = answers['Q0b'] as string | undefined;
  return answers['Q0a'] === '政府与公共事业' && !!job && ZHITINEI_JOBS.has(job);
}

// ── ① 宏观环境 ────────────────────────────────────────────
function scoreMacro(answers: Answers): number {
  const industry = answers['Q0a'] as string;
  const riskMap: Record<string, number> = {
    '互联网与科技':    80,
    '金融':           75,
    '媒体与内容':     78,
    '零售与消费':     65,
    '人力资源':       60,
    '法律与咨询':     55,
    '教育':           52,
    '医疗与健康':     48,
    '制造与工程':     50,
    '政府与公共事业':  22,  // 铁饭碗保护 + AI 采购极慢
    '房地产与建筑':   45,
    '交通与物流':     62,
    '农业与食品':     38,
    '能源与环保':     42,
    '文化与创意':     55,
    '体育与健身':     30,
    '自由职业与创业':  58,
    '学生':           50,
    '其他行业':       55,
  };
  return riskMap[industry] ?? 55;
}

// ── ② 工作任务结构 ────────────────────────────────────────
function scoreTask(answers: Answers): number {
  const scores: number[] = [];

  // Q1 allocation — JSON 字符串 {"repeat":30,"social":40,"creative":20,"judgment":10}
  const q1Raw = answers['Q1'] as string | undefined;
  if (q1Raw) {
    try {
      const alloc: Record<string, number> = JSON.parse(q1Raw);
      // 每类的 AI 可替代系数（0-1）
      const riskCoeff: Record<string, number> = {
        repeat:   0.90,
        social:   0.35,
        creative: 0.40,
        judgment: 0.20,
      };
      let weighted = 0;
      let totalPct = 0;
      for (const [key, pct] of Object.entries(alloc)) {
        weighted += pct * (riskCoeff[key] ?? 0.5);
        totalPct += pct;
      }
      if (totalPct > 0) scores.push(Math.round((weighted / totalPct) * 100));
    } catch { /* ignore */ }
  }

  // Q3 上手时间
  const q3Map: Record<string, number> = { '1m': 90, '3-6m': 60, '1y+': 30, rare: 10 };
  if (answers['Q3']) scores.push(q3Map[answers['Q3'] as string] ?? 55);

  // Q4 现场依赖
  const q4Map: Record<string, number> = { no: 80, partial: 50, must: 20 };
  if (answers['Q4']) scores.push(q4Map[answers['Q4'] as string] ?? 50);

  // Q5 AI 替代比例
  const q5Map: Record<string, number> = { none: 15, '30': 40, '50': 70, '80+': 90 };
  if (answers['Q5']) scores.push(q5Map[answers['Q5'] as string] ?? 50);

  // Q7 失联影响
  const q7Map: Record<string, number> = { no_impact: 80, messy: 55, blocked: 30, stop: 10 };
  if (answers['Q7']) scores.push(q7Map[answers['Q7'] as string] ?? 50);

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 55;
}

// ── ③ 组织位置 ────────────────────────────────────────────
function scoreOrg(answers: Answers): number {
  const scores: number[] = [];

  // Q6b 角色（新增 newbie）
  const q6bMap: Record<string, number> = {
    newbie:   70,  // 新人：可替代性高，但还不是主要目标
    executor: 80,
    expert:   45,
    manager:  30,
    founder:  15,
  };
  if (answers['Q6b']) scores.push(q6bMap[answers['Q6b'] as string] ?? 50);

  // Q8 团队位置
  const q8Map: Record<string, number> = { edge: 80, support: 50, core: 20 };
  if (answers['Q8']) scores.push(q8Map[answers['Q8'] as string] ?? 50);

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 50;
}

// ── ④ 公司 AI 动向 ────────────────────────────────────────
function scoreCompany(answers: Answers): number {
  // 体制内：AI 采购极慢，裁员几乎为零 → 公司动向风险极低
  if (isZhiTiNei(answers)) return 15;

  const scores: number[] = [];

  const q10Map: Record<string, number> = { nothing: 30, talk: 45, pilot: 65, scale: 90 };
  if (answers['Q10']) scores.push(q10Map[answers['Q10'] as string] ?? 50);

  const q11Map: Record<string, number> = { none: 20, occasional: 45, clear: 70, layoff: 90 };
  if (answers['Q11']) scores.push(q11Map[answers['Q11'] as string] ?? 50);

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 50;
}

// ── ⑤ 个人护城河 ─────────────────────────────────────────
function scoreMoat(answers: Answers): number {
  // 体制内：编制本身是强护城河（不可被 AI 取消），加成20分
  if (isZhiTiNei(answers)) {
    const q13Map: Record<string, number> = { none: 70, some: 45, key: 20, rare: 8 };
    return q13Map[answers['Q13'] as string] ?? 40;
  }
  const q13Map: Record<string, number> = { none: 90, some: 60, key: 30, rare: 10 };
  return q13Map[answers['Q13'] as string] ?? 55;
}

// ── ⑥ 个人适应能力 ───────────────────────────────────────
function scoreAdapt(answers: Answers): number {
  const scores: number[] = [];

  const q14Map: Record<string, number> = {
    never: 80, aware: 65, try: 45, daily: 25, rebuild: 5,
  };
  if (answers['Q14']) scores.push(q14Map[answers['Q14'] as string] ?? 55);

  if (answers['Q15'] !== undefined) {
    const sliderMap: Record<number, number> = { 1: 80, 2: 65, 3: 45, 4: 25, 5: 10 };
    scores.push(sliderMap[Number(answers['Q15'])] ?? 45);
  }

  return scores.length > 0
    ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
    : 55;
}

// ── 综合评分 ─────────────────────────────────────────────
export function calculateScore(answers: Answers): ScoreResult {
  const macro   = scoreMacro(answers);
  const task    = scoreTask(answers);
  const org     = scoreOrg(answers);
  const company = scoreCompany(answers);
  const moat    = scoreMoat(answers);
  const adapt   = scoreAdapt(answers);

  const total = Math.round(
    macro   * WEIGHTS.macro   +
    task    * WEIGHTS.task    +
    org     * WEIGHTS.org     +
    company * WEIGHTS.company +
    moat    * WEIGHTS.moat    +
    adapt   * WEIGHTS.adapt
  );

  let tier: Tier;
  if (total <= 30)      tier = 'safe';
  else if (total <= 50) tier = 'watch';
  else if (total <= 70) tier = 'alert';
  else if (total <= 85) tier = 'danger';
  else                  tier = 'critical';

  const anxietyLevel = answers['Q_anxiety'] ? Number(answers['Q_anxiety']) : 2;

  let anxietyVsRisk: AnxietyVsRisk;
  if      (total >= 51 && anxietyLevel >= 3) anxietyVsRisk = 'aligned-high';
  else if (total >= 51 && anxietyLevel <= 2) anxietyVsRisk = 'complacent-danger';
  else if (total <= 50 && anxietyLevel >= 3) anxietyVsRisk = 'anxious-overblown';
  else                                        anxietyVsRisk = 'aligned-low';

  return { total, dimensions: { macro, task, org, company, moat, adapt }, tier, anxietyLevel, anxietyVsRisk };
}

export const dimensionLabels: Record<string, string> = {
  macro:   '宏观环境',
  task:    '任务结构',
  org:     '组织位置',
  company: '公司动向',
  moat:    '个人护城河',
  adapt:   '适应能力',
};

// ── 维度打分依据解读 ──────────────────────────────────────
export function getDimensionInsight(
  key: keyof ScoreResult['dimensions'],
  value: number,
  answers: Answers,
): string {
  const zhiTiNei = isZhiTiNei(answers);

  if (key === 'macro') {
    const industry = answers['Q0a'] as string | undefined;
    if (zhiTiNei) {
      return `体制内宏观环境评分 ${value} 分，属于低风险区间。核心原因：① 政府/事业单位采购 AI 决策周期极长；② 编制保护使"替代"在机制上很难实现；③ 体制内AI推进多为"智慧政务"形式，主要增效而非减员。`;
    }
    const level = value >= 70 ? '高风险' : value >= 50 ? '中等风险' : '相对低风险';
    return `你所在的「${industry ?? '该行业'}」宏观环境评分为 ${value} 分，属于 ${level} 区间。行业 AI 渗透速度是这一分数的主要决定因素——渗透越快，基础风险越高。`;
  }
  if (key === 'task') {
    const q5 = answers['Q5'] as string | undefined;
    const q3 = answers['Q3'] as string | undefined;
    const q5Desc = q5 === '80+' ? 'AI 已能替代大部分工作' : q5 === '50' ? 'AI 已替代约一半工作' : q5 === '30' ? 'AI 替代了 20–30%' : '当前 AI 替代有限';
    const q3Desc = q3 === '1m' ? '接替者上手极快（<1个月）' : q3 === '3-6m' ? '接替者需 3–6 个月' : q3 === '1y+' ? '至少需要 1 年才能接替' : '几乎无法被替代';
    return `任务结构评分 ${value} 分，主要由两个因素决定：① ${q5Desc}；② ${q3Desc}。任务越标准化、上手越快，被自动化的风险就越高。`;
  }
  if (key === 'org') {
    const q6b = answers['Q6b'] as string | undefined;
    const q8 = answers['Q8'] as string | undefined;
    const roleMap: Record<string, string> = { newbie: '新人', executor: '执行者', expert: '骨干专家', manager: '管理者', founder: '创始人/核心决策层' };
    const teamMap: Record<string, string> = { edge: '边缘支持型', support: '重要支撑型', core: '核心业务型' };
    return `组织位置评分 ${value} 分。你的角色定位为「${roleMap[q6b ?? ''] ?? '未填写'}」，所在团队为「${teamMap[q8 ?? ''] ?? '未填写'}」。越靠近核心收入、角色越难替代，风险越低；反之越高。`;
  }
  if (key === 'company') {
    if (zhiTiNei) {
      return `体制内单位动向评分 ${value} 分（极低）。体制内单位对 AI 的实际态度几乎一致：极少主动采购，即使采购也是辅助工具而非替代人员。降本增效的压力机制与市场化企业完全不同——编制数量由上级部门核定，而非由效率决定。`;
    }
    const q10 = answers['Q10'] as string | undefined;
    const q11 = answers['Q11'] as string | undefined;
    const q10Map: Record<string, string> = { nothing: '几乎无 AI 动作', talk: '口头谈过但未落地', pilot: '已有试点项目', scale: '大规模推进中' };
    const q11Map: Record<string, string> = { none: '无降本压力', occasional: '偶有提及', clear: '明显感受到压力', layoff: '已发生裁员或缩编' };
    return `公司动向评分 ${value} 分。公司 AI 态度：「${q10Map[q10 ?? ''] ?? '未知'}」；降本增效压力：「${q11Map[q11 ?? ''] ?? '未知'}」。两者越激进，近端替代风险越高。`;
  }
  if (key === 'moat') {
    if (zhiTiNei) {
      return `体制内护城河评分 ${value} 分。编制本身是一道特殊的护城河——不是技能壁垒，而是制度性保障。真正的长期风险不是"被替代"，而是当 AI 显著提升行政效率时，你的职业成长空间可能收窄，晋升天花板会更快到来。`;
    }
    const q13 = answers['Q13'] as string | undefined;
    const moatMap: Record<string, string> = { none: '暂无明显护城河', some: '有一些但不稀缺', key: '有关键专业壁垒', rare: '行业级稀缺能力' };
    return `个人护城河评分 ${value} 分，对应你的自评：「${moatMap[q13 ?? ''] ?? '未填写'}」。护城河越薄弱，评分越高（风险越大）。深度专业知识、稀缺人脉和隐性经验是最难被 AI 复制的资产。`;
  }
  if (key === 'adapt') {
    const q14 = answers['Q14'] as string | undefined;
    const q15 = answers['Q15'];
    const usageMap: Record<string, string> = { never: '从未使用过 AI 工具', aware: '知道但未动手', try: '浅尝过几次', daily: 'AI 已进入日常工作', rebuild: '已用 AI 重构工作方式' };
    return `适应能力评分 ${value} 分。当前 AI 工具使用情况：「${usageMap[q14 ?? ''] ?? '未填写'}」；转型信心自评：${q15 ?? '未填写'}/5 分。主动使用 AI 并且信心越高，风险分越低。`;
  }
  return `${dimensionLabels[key]} 评分：${value} 分。`;
}
