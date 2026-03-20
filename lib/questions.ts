// ============================================================
// 题目数据结构 — AI 替代风险测评 v0.4
// ============================================================

export type QuestionType = 'single' | 'slider' | 'text' | 'dropdown' | 'allocation';

export interface Option {
  value: string;
  label: string;
  emoji?: string;
}

// allocation 类型：用户给几个类别分配百分比，总和必须 = 100
export interface AllocationItem {
  value: string;
  label: string;
  emoji?: string;
}

export interface Question {
  id: string;
  ariaMessage: string;
  type: QuestionType;
  options?: Option[];
  allocationItems?: AllocationItem[];
  sliderMin?: number;
  sliderMax?: number;
  sliderLabels?: [string, string];
  isOptional?: boolean;
  dependsOn?: string;
}

// ── 行业 → 岗位 映射（完整版 v0.4）────────────────────────
export const industryJobMap: Record<string, Option[]> = {
  '金融': [
    { value: '投研/分析师', label: '投研 / 分析师' },
    { value: '量化/算法工程师', label: '量化 / 算法工程师' },
    { value: '交易员', label: '交易员' },
    { value: '财务/会计', label: '财务 / 会计' },
    { value: '审计', label: '审计' },
    { value: '风控/合规', label: '风控 / 合规' },
    { value: '客户经理/理财顾问', label: '客户经理 / 理财顾问' },
    { value: '保险核保/精算', label: '保险核保 / 精算' },
    { value: '银行柜员/后台操作', label: '银行柜员 / 后台操作' },
    { value: '金融产品经理', label: '金融产品经理' },
    { value: '市场/品牌/公关', label: '市场 / 品牌 / 公关' },
    { value: '人力资源/行政', label: '人力资源 / 行政' },
    { value: '其他金融岗位', label: '其他金融岗位' },
  ],
  '互联网与科技': [
    { value: '软件工程师/开发', label: '软件工程师 / 开发' },
    { value: '前端工程师', label: '前端工程师' },
    { value: '后端/服务端工程师', label: '后端 / 服务端工程师' },
    { value: '算法/AI工程师', label: '算法 / AI 工程师' },
    { value: '数据分析/数据科学', label: '数据分析 / 数据科学' },
    { value: '产品经理', label: '产品经理' },
    { value: 'UI/UX设计师', label: 'UI / UX 设计师' },
    { value: '运营/增长', label: '运营 / 增长' },
    { value: '市场/品牌/公关', label: '市场 / 品牌 / 公关' },
    { value: '商务/销售/BD', label: '商务 / 销售 / BD' },
    { value: '战略/投融资', label: '战略 / 投融资' },
    { value: '人力资源/行政', label: '人力资源 / 行政' },
    { value: '财务/法务', label: '财务 / 法务' },
    { value: '测试/QA', label: '测试 / QA' },
    { value: '网络/运维/安全', label: '网络 / 运维 / 安全' },
    { value: '技术支持/售前', label: '技术支持 / 售前' },
    { value: '其他科技岗位', label: '其他科技岗位' },
  ],
  '制造与工程': [
    { value: '机械/结构工程师', label: '机械 / 结构工程师' },
    { value: '电气/电子工程师', label: '电气 / 电子工程师' },
    { value: '化工/材料工程师', label: '化工 / 材料工程师' },
    { value: '生产线操作员', label: '生产线操作员' },
    { value: '质检/质量工程师', label: '质检 / 质量工程师' },
    { value: '工业设计师', label: '工业设计师' },
    { value: '供应链/采购', label: '供应链 / 采购' },
    { value: '生产计划/PMC', label: '生产计划 / PMC' },
    { value: '设备维护/现场工程师', label: '设备维护 / 现场工程师' },
    { value: '研发工程师', label: '研发工程师' },
    { value: '销售/商务', label: '销售 / 商务' },
    { value: '市场/品牌', label: '市场 / 品牌' },
    { value: '财务/人力/行政', label: '财务 / 人力 / 行政' },
    { value: '其他制造岗位', label: '其他制造岗位' },
  ],
  '医疗与健康': [
    { value: '临床医生', label: '临床医生' },
    { value: '护士/护理', label: '护士 / 护理' },
    { value: '医学影像/检验', label: '医学影像 / 检验' },
    { value: '药物研发/药师', label: '药物研发 / 药师' },
    { value: '医院行政/管理', label: '医院行政 / 管理' },
    { value: '公共卫生/流行病学', label: '公共卫生 / 流行病学' },
    { value: '医疗器械/设备', label: '医疗器械 / 设备' },
    { value: '健康管理/营养师', label: '健康管理 / 营养师' },
    { value: '医疗市场/销售', label: '医疗市场 / 销售' },
    { value: '财务/法务/合规', label: '财务 / 法务 / 合规' },
    { value: '其他医疗岗位', label: '其他医疗岗位' },
  ],
  '心理与疗愈': [
    { value: '心理咨询师', label: '心理咨询师' },
    { value: '心理治疗师', label: '心理治疗师' },
    { value: '精神科医生', label: '精神科医生' },
    { value: '身心疗愈师', label: '身心疗愈师（冥想/正念/艺术疗愈等）' },
    { value: '创伤/EMDR治疗师', label: '创伤 / EMDR 治疗师' },
    { value: '催眠/NLP从业者', label: '催眠 / NLP 从业者' },
    { value: '社会工作者', label: '社会工作者' },
    { value: '心理健康教育教师', label: '心理健康教育教师' },
    { value: '督导/培训师', label: '督导 / 培训师' },
    { value: '心理内容创作者', label: '心理内容创作者 / 科普博主' },
    { value: '其他心理疗愈岗位', label: '其他心理疗愈相关岗位' },
  ],
  '教育': [
    { value: '中小学教师', label: '中小学教师' },
    { value: '高校教师/科研', label: '高校教师 / 科研' },
    { value: '培训师/讲师', label: '培训师 / 讲师' },
    { value: '在线教育/课程制作', label: '在线教育 / 课程制作' },
    { value: '教育产品/运营', label: '教育产品 / 运营' },
    { value: '教育行政/管理', label: '教育行政 / 管理' },
    { value: '市场/招生/BD', label: '市场 / 招生 / BD' },
    { value: '学生辅导/班主任', label: '学生辅导 / 班主任' },
    { value: '财务/人力/行政', label: '财务 / 人力 / 行政' },
    { value: '其他教育岗位', label: '其他教育岗位' },
  ],
  '零售与消费': [
    { value: '市场营销/品牌', label: '市场营销 / 品牌' },
    { value: '电商运营', label: '电商运营' },
    { value: '门店销售/导购', label: '门店销售 / 导购' },
    { value: '买手/商品企划', label: '买手 / 商品企划' },
    { value: '供应链/仓储物流', label: '供应链 / 仓储物流' },
    { value: '客服/售后', label: '客服 / 售后' },
    { value: '视觉陈列/店长', label: '视觉陈列 / 店长' },
    { value: '数据分析/选品', label: '数据分析 / 选品' },
    { value: '财务/人力/行政', label: '财务 / 人力 / 行政' },
    { value: '其他零售岗位', label: '其他零售岗位' },
  ],
  '政府与公共事业': [
    { value: '公务员（党政机关）', label: '公务员（党政机关）' },
    { value: '事业编制（教科文卫）', label: '事业编制（教科文卫）' },
    { value: '事业编制（科研院所）', label: '事业编制（科研院所）' },
    { value: '国有企业员工', label: '国有企业员工' },
    { value: '军队/警察/消防', label: '军队 / 警察 / 消防' },
    { value: '城管/执法人员', label: '城管 / 执法人员' },
    { value: '社区/街道/村镇干部', label: '社区 / 街道 / 村镇干部' },
    { value: '其他体制内岗位', label: '其他体制内岗位' },
  ],
  '媒体与内容': [
    { value: '记者/编辑', label: '记者 / 编辑' },
    { value: '视频创作者/导演', label: '视频创作者 / 导演' },
    { value: '文案/内容策划', label: '文案 / 内容策划' },
    { value: '平面设计师', label: '平面设计师' },
    { value: '摄影师/摄像师', label: '摄影师 / 摄像师' },
    { value: '社交媒体运营', label: '社交媒体运营' },
    { value: '广告创意/策划', label: '广告创意 / 策划' },
    { value: '主播/出镜记者', label: '主播 / 出镜记者' },
    { value: '商务/广告销售', label: '商务 / 广告销售' },
    { value: '产品/技术', label: '产品 / 技术' },
    { value: '财务/人力/行政', label: '财务 / 人力 / 行政' },
    { value: '其他媒体岗位', label: '其他媒体岗位' },
  ],
  '法律与咨询': [
    { value: '律师/法务', label: '律师 / 法务' },
    { value: '管理咨询顾问', label: '管理咨询顾问' },
    { value: '合规/审计', label: '合规 / 审计' },
    { value: '税务师/会计师', label: '税务师 / 会计师' },
    { value: '知识产权', label: '知识产权' },
    { value: '法院/检察院', label: '法院 / 检察院' },
    { value: '行政/市场/BD', label: '行政 / 市场 / BD' },
    { value: '其他法律咨询岗位', label: '其他法律咨询岗位' },
  ],
  '人力资源': [
    { value: '招聘/猎头', label: '招聘 / 猎头' },
    { value: '培训与发展', label: '培训与发展 (L&D)' },
    { value: 'HRBP/HR通才', label: 'HRBP / HR 通才' },
    { value: '薪酬绩效', label: '薪酬绩效 (C&B)' },
    { value: '员工关系/劳动法', label: '员工关系 / 劳动法' },
    { value: 'HR技术/数字化', label: 'HR 技术 / 数字化' },
    { value: '其他人力资源岗位', label: '其他人力资源岗位' },
  ],
  '房地产与建筑': [
    { value: '建筑师/规划师', label: '建筑师 / 规划师' },
    { value: '房产中介/经纪人', label: '房产中介 / 经纪人' },
    { value: '项目经理/施工管理', label: '项目经理 / 施工管理' },
    { value: '结构/暖通工程师', label: '结构 / 暖通工程师' },
    { value: '室内设计师', label: '室内设计师' },
    { value: '成本/造价工程师', label: '成本 / 造价工程师' },
    { value: '物业管理', label: '物业管理' },
    { value: '其他建筑岗位', label: '其他建筑岗位' },
  ],
  '交通与物流': [
    { value: '司机/快递员', label: '司机 / 快递员' },
    { value: '物流调度/运营', label: '物流调度 / 运营' },
    { value: '航空/航运人员', label: '航空 / 航运人员' },
    { value: '供应链管理', label: '供应链管理' },
    { value: '仓储管理', label: '仓储管理' },
    { value: '其他交通物流岗位', label: '其他交通物流岗位' },
  ],
  '农业与食品': [
    { value: '农业生产/农学', label: '农业生产 / 农学' },
    { value: '食品研发/工程师', label: '食品研发 / 工程师' },
    { value: '食品安全/质检', label: '食品安全 / 质检' },
    { value: '农业技术推广', label: '农业技术推广' },
    { value: '其他农业食品岗位', label: '其他农业食品岗位' },
  ],
  '能源与环保': [
    { value: '电力/新能源工程师', label: '电力 / 新能源工程师' },
    { value: '石油/天然气工程师', label: '石油 / 天然气工程师' },
    { value: '环保工程师/咨询', label: '环保工程师 / 咨询' },
    { value: '碳资产/绿色金融', label: '碳资产 / 绿色金融' },
    { value: '其他能源岗位', label: '其他能源岗位' },
  ],
  '文化与创意': [
    { value: '游戏设计/开发', label: '游戏设计 / 开发' },
    { value: '音乐/作曲', label: '音乐 / 作曲' },
    { value: '影视动画制作', label: '影视动画制作' },
    { value: '艺术家/插画师', label: '艺术家 / 插画师' },
    { value: '博物馆/文化机构', label: '博物馆 / 文化机构' },
    { value: '其他文化创意岗位', label: '其他文化创意岗位' },
  ],
  '体育与健身': [
    { value: '职业运动员/教练', label: '职业运动员 / 教练' },
    { value: '健身教练', label: '健身教练' },
    { value: '体育赛事运营', label: '体育赛事运营' },
    { value: '其他体育岗位', label: '其他体育岗位' },
  ],
  '自由职业与创业': [
    { value: '自由撰稿/翻译', label: '自由撰稿 / 翻译' },
    { value: '独立设计师', label: '独立设计师' },
    { value: '独立开发者', label: '独立开发者' },
    { value: '创业公司创始人', label: '创业公司创始人' },
    { value: '自媒体博主', label: '自媒体博主' },
    { value: '其他自由职业', label: '其他自由职业' },
  ],
  '学生': [
    { value: '本科生', label: '本科生' },
    { value: '研究生/博士', label: '研究生 / 博士' },
    { value: '职校/专科生', label: '职校 / 专科生' },
  ],
  // 其他行业 → 通用职能分类，不让用户陷入空选项
  '其他行业': [
    { value: '技术/工程类', label: '技术 / 工程类' },
    { value: '业务/销售类', label: '业务 / 销售类' },
    { value: '运营/执行类', label: '运营 / 执行类' },
    { value: '创意/设计类', label: '创意 / 设计类' },
    { value: '管理/领导类', label: '管理 / 领导类' },
    { value: '研究/分析类', label: '研究 / 分析类' },
    { value: '服务/客户类', label: '服务 / 客户类' },
    { value: '行政/支持类', label: '行政 / 支持类' },
  ],
};

// ── 题目列表 ──────────────────────────────────────────────
export const questions: Question[] = [

  // ── 0. 背景信息 ───────────────────────────────────────────
  {
    id: 'Q0a',
    ariaMessage: '先聊聊你的工作背景——你目前在哪个行业？',
    type: 'dropdown',
    options: [
      { value: '金融', label: '金融' },
      { value: '互联网与科技', label: '互联网与科技' },
      { value: '制造与工程', label: '制造与工程' },
      { value: '医疗与健康', label: '医疗与健康' },
      { value: '心理与疗愈', label: '心理与疗愈' },
      { value: '教育', label: '教育' },
      { value: '零售与消费', label: '零售与消费' },
      { value: '政府与公共事业', label: '政府与公共事业' },
      { value: '媒体与内容', label: '媒体与内容' },
      { value: '法律与咨询', label: '法律与咨询' },
      { value: '人力资源', label: '人力资源' },
      { value: '房地产与建筑', label: '房地产与建筑' },
      { value: '交通与物流', label: '交通与物流' },
      { value: '农业与食品', label: '农业与食品' },
      { value: '能源与环保', label: '能源与环保' },
      { value: '文化与创意', label: '文化与创意' },
      { value: '体育与健身', label: '体育与健身' },
      { value: '自由职业与创业', label: '自由职业与创业' },
      { value: '学生', label: '学生' },
      { value: '其他行业', label: '其他行业' },
    ],
  },
  {
    id: 'Q0b',
    ariaMessage: '好，在这个行业里，你的岗位更接近哪个方向？',
    type: 'dropdown',
    dependsOn: 'Q0a',
  },
  {
    id: 'Q0c',
    ariaMessage: '你进入职场多少年了？',
    type: 'single',
    options: [
      { value: '<1',  label: '不到 1 年',  emoji: '🌱' },
      { value: '1-3', label: '1 – 3 年',   emoji: '🌿' },
      { value: '3-8', label: '3 – 8 年',   emoji: '🌳' },
      { value: '8+',  label: '8 年以上',   emoji: '🏔️' },
    ],
  },
  {
    id: 'Q_open',
    ariaMessage: '不需要很正式，就像跟朋友说话一样。简单说说你平时主要做什么工作？（可以跳过）',
    type: 'text',
    isOptional: true,
  },

  // ── 1. 工作任务结构 ───────────────────────────────────────
  {
    id: 'Q1',
    ariaMessage: '把你的工作时间分配一下——这四种类型各占多少比例？加起来 100%，凭感觉估就好。',
    type: 'allocation',
    allocationItems: [
      { value: 'repeat',   label: '重复 / 流程', emoji: '📊' },
      { value: 'social',   label: '沟通 / 人际', emoji: '🤝' },
      { value: 'creative', label: '创意 / 原创', emoji: '🎨' },
      { value: 'judgment', label: '判断 / 决策', emoji: '🧠' },
    ],
  },
  {
    id: 'Q3',
    ariaMessage: '如果招人来接替你，大概需要多久上手？',
    type: 'single',
    options: [
      { value: '1m',   label: '一个月内就能顶上', emoji: '⚡' },
      { value: '3-6m', label: '培训 3 – 6 个月',  emoji: '📚' },
      { value: '1y+',  label: '至少需要 1 年以上', emoji: '🎓' },
      { value: 'rare', label: '几乎找不到替代者',  emoji: '💎' },
    ],
  },
  {
    id: 'Q4',
    ariaMessage: '你的工作需要到特定物理场所才能完成吗？',
    type: 'single',
    options: [
      { value: 'no',      label: '完全不需要，纯线上可完成', emoji: '🌐' },
      { value: 'partial', label: '部分需要，混合模式',       emoji: '🏢' },
      { value: 'must',    label: '必须到现场，线下强依赖',   emoji: '📍' },
    ],
  },
  {
    id: 'Q5',
    ariaMessage: '目前 AI 工具已经能替代你多少工作内容？凭直觉估一下。',
    type: 'single',
    options: [
      { value: 'none', label: '几乎替代不了',    emoji: '🛡️' },
      { value: '30',   label: '约 20 – 30%',    emoji: '📉' },
      { value: '50',   label: '大概一半',        emoji: '⚖️' },
      { value: '80+',  label: '大部分都能做了',  emoji: '🤖' },
    ],
  },
  {
    id: 'Q7',
    ariaMessage: '如果你突然消失两周、完全失联，你的团队会怎样？',
    type: 'single',
    options: [
      { value: 'no_impact', label: '没什么影响，别人能覆盖',   emoji: '😐' },
      { value: 'messy',     label: '有点乱，但能撑过去',       emoji: '😅' },
      { value: 'blocked',   label: '明显受阻，几个项目卡住',   emoji: '😬' },
      { value: 'stop',      label: '某些关键事情直接停摆',     emoji: '🚨' },
    ],
  },

  // ── 2. 组织位置 ───────────────────────────────────────────
  {
    id: 'Q6b',
    ariaMessage: '在团队里，你更接近哪个角色？',
    type: 'single',
    options: [
      { value: 'newbie',   label: '新人——刚开始，还在熟悉环境',  emoji: '🌱' },
      { value: 'executor', label: '执行者——按计划完成任务',       emoji: '⚙️' },
      { value: 'expert',   label: '骨干专家——有独到技能',         emoji: '🔬' },
      { value: 'manager',  label: '管理者——带团队、做决策',       emoji: '🧩' },
      { value: 'founder',  label: '创始人 / 核心合伙人',           emoji: '🚀' },
    ],
  },
  {
    id: 'Q8',
    ariaMessage: '你所在的部门 / 团队，在整个公司里处于什么位置？',
    type: 'single',
    options: [
      { value: 'edge',    label: '边缘支持——成本中心，非核心业务', emoji: '🏝️' },
      { value: 'support', label: '重要支撑——核心业务的保障方',     emoji: '🔧' },
      { value: 'core',    label: '绝对核心——直接产出主要收入',     emoji: '💰' },
    ],
  },

  // ── 3. 公司 AI 动向 ───────────────────────────────────────
  {
    id: 'Q10',
    ariaMessage: '你感受到的公司对 AI 的实际态度是？',
    type: 'single',
    options: [
      { value: 'nothing', label: '几乎没动静，没提上日程',     emoji: '😴' },
      { value: 'talk',    label: '口头谈过，还在观望',         emoji: '💬' },
      { value: 'pilot',   label: '已有试点项目在跑',           emoji: '🧪' },
      { value: 'scale',   label: '大规模落地，已影响工作流',   emoji: '⚡' },
    ],
  },
  {
    id: 'Q11',
    ariaMessage: '过去一年，你有没有明显感受到降本增效的压力？',
    type: 'single',
    options: [
      { value: 'none',       label: '没有，业务还在扩张',     emoji: '📈' },
      { value: 'occasional', label: '偶尔提到，没到裁员',     emoji: '🤷' },
      { value: 'clear',      label: '明显感受到压力',         emoji: '😟' },
      { value: 'layoff',     label: '已经有过裁员或缩编',     emoji: '📉' },
    ],
  },
  {
    id: 'Q12',
    ariaMessage: '你在哪家公司工作？（选填，帮我给出更精准的判断）',
    type: 'text',
    isOptional: true,
  },

  // ── 4. 个人护城河 ─────────────────────────────────────────
  {
    id: 'Q13',
    ariaMessage: '你有没有积累了一些独特的知识、人脉或资源，是短期内难以复制的？',
    type: 'single',
    options: [
      { value: 'none', label: '暂时没想到有什么特别的',     emoji: '🤔' },
      { value: 'some', label: '有一些，但不算稀缺',         emoji: '🌱' },
      { value: 'key',  label: '有关键资源或深度专业知识',   emoji: '🔑' },
      { value: 'rare', label: '行业稀缺，别人很难复制',     emoji: '💎' },
    ],
  },
  {
    id: 'Q14',
    ariaMessage: '你自己目前使用 AI 工具的程度？',
    type: 'single',
    options: [
      { value: 'never',   label: '没怎么用过',               emoji: '🚫' },
      { value: 'aware',   label: '知道但没怎么动手',         emoji: '👀' },
      { value: 'try',     label: '浅尝过几次',               emoji: '🌊' },
      { value: 'daily',   label: '日常工作中会用',           emoji: '⚡' },
      { value: 'rebuild', label: '已用 AI 重构了工作方式',   emoji: '🚀' },
    ],
  },

  // ── 5. 个人适应能力 ───────────────────────────────────────
  {
    id: 'Q15',
    ariaMessage: '给自己的 AI 时代转型信心打个分。1 = 毫无信心，5 = 已在积极准备。',
    type: 'slider',
    sliderMin: 1,
    sliderMax: 5,
    sliderLabels: ['毫无信心', '已在准备'],
  },
  {
    id: 'Q_anxiety',
    ariaMessage: '最后，诚实问自己一下——对 AI 替代这件事，你现在有多焦虑？',
    type: 'single',
    options: [
      { value: '1', label: '完全不焦虑，随遇而安',     emoji: '😴' },
      { value: '2', label: '偶尔想想，但不太担心',     emoji: '🤔' },
      { value: '3', label: '有些担心，时不时会想到',   emoji: '😟' },
      { value: '4', label: '很焦虑，经常在想这件事',   emoji: '😰' },
    ],
  },
];

export const questionIds = questions.map((q) => q.id);

export type Answers = Record<string, string | number>;
// allocation 答案格式：JSON 字符串，如 '{"repeat":30,"social":40,"creative":20,"judgment":10}'
