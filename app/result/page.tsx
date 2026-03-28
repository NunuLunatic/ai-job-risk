'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, RotateCcw, ChevronDown, ImageDown, X } from 'lucide-react';
import { calculateScore, ScoreResult, dimensionLabels, getDimensionInsight } from '@/lib/scoring';
import { getResultCopy, getAnxietyCopy } from '@/lib/resultCopy';
import { Answers } from '@/lib/questions';
import {
  submitAnonymousStats,
  getOrCreateSessionId,
  detectPlatform,
} from '@/lib/analytics';
import ShareCard from '@/components/ShareCard';

const TIER_COLOR: Record<string, string> = {
  safe:     '#4ade80',
  watch:    '#facc15',
  alert:    '#fb923c',
  danger:   '#f87171',
  critical: '#ef4444',
};

// ── 行业平均风险分（基于评分引擎基础值）────────────────────
// 用于"你比 X% 的同行业用户风险更低"的百分比对比
// 这里使用正态分布近似：行业均值 ±15 作为标准差估算
const INDUSTRY_AVG: Record<string, number> = {
  '互联网与科技':   65,
  '金融':          62,
  '媒体与内容':    63,
  '零售与消费':    56,
  '人力资源':      54,
  '法律与咨询':    52,
  '教育':          50,
  '医疗与健康':    48,
  '制造与工程':    50,
  '房地产与建筑':  48,
  '交通与物流':    55,
  '文化与创意':    52,
  '自由职业与创业': 54,
  '政府与公共事业': 32,
  '能源与环保':    46,
  '农业与食品':    42,
  '体育与健身':    38,
  '心理与疗愈':    40,
  '学生':          50,
  '其他行业':      52,
};

// 正态分布近似计算百分位（标准差取 15）
function getIndustryPercentile(score: number, industry: string): number {
  const avg = INDUSTRY_AVG[industry] ?? 52;
  const std = 15;
  const z = (avg - score) / std; // 你比多少人分数低（即风险低）
  // 近似正态CDF
  const cdf = 0.5 * (1 + Math.sign(z) * Math.sqrt(1 - Math.exp(-2 * z * z / Math.PI)));
  return Math.round(Math.min(99, Math.max(1, cdf * 100)));
}

// ── Q14 值 → ai_usage_level（1-5）─────────────────────────
const Q14_MAP: Record<string, number> = {
  never:   1,
  aware:   2,
  try:     3,
  daily:   4,
  rebuild: 5,
};

// ── tier → 中文（数据库存储用）────────────────────────────
const TIER_ZH: Record<string, string> = {
  safe:     '安全区',
  watch:    '观察区',
  alert:    '警戒区',
  danger:   '高危区',
  critical: '紧急区',
};

// ── anxietyVsRisk → 中文 ──────────────────────────────────
const ANXIETY_VS_RISK_ZH: Record<string, string> = {
  'aligned-high':      '匹配（高风险高焦虑）',
  'aligned-low':       '匹配（低风险低焦虑）',
  'anxious-overblown': '高焦虑低风险',
  'complacent-danger': '低焦虑高风险',
};

// ── 动态计数器 ─────────────────────────────────────────────
function useCountUp(target: number, duration = 1600) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let current = 0;
    const step = target / (duration / 16);
    const t = setInterval(() => {
      current += step;
      if (current >= target) { setCount(target); clearInterval(t); }
      else setCount(Math.floor(current));
    }, 16);
    return () => clearInterval(t);
  }, [target, duration]);
  return count;
}

// ── 六边形雷达图 ───────────────────────────────────────────
type DimKey = 'macro' | 'task' | 'org' | 'company' | 'moat' | 'adapt';

const DIM_KEYS: DimKey[] = ['macro', 'task', 'org', 'company', 'moat', 'adapt'];

function HexRadar({ dimensions }: { dimensions: ScoreResult['dimensions'] }) {
  const SIZE = 160;
  const CX = SIZE;
  const CY = SIZE;
  const R_MAX = 110;
  const N = 6;
  const labelR = R_MAX + 22;

  const dimLabels: Record<DimKey, string> = {
    macro:   '宏观\n环境',
    task:    '任务\n结构',
    org:     '组织\n位置',
    company: '公司\n动向',
    moat:    '护城河',
    adapt:   '适应\n能力',
  };

  const angle = (i: number) => (Math.PI / 2) - (2 * Math.PI * i) / N;
  const point = (r: number, i: number): [number, number] => [
    CX + r * Math.cos(angle(i)),
    CY - r * Math.sin(angle(i)),
  ];

  const gridLevels = [0.33, 0.66, 1.0];

  const dataPoints = DIM_KEYS.map((k, i) => {
    const val = dimensions[k] / 100;
    return point(R_MAX * val, i);
  });
  const dataPath = dataPoints.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';

  const avgVal = DIM_KEYS.reduce((s, k) => s + dimensions[k], 0) / N;
  const dataColor = avgVal >= 70 ? '#f87171' : avgVal >= 50 ? '#fb923c' : avgVal >= 35 ? '#facc15' : '#4ade80';

  return (
    <svg width={SIZE * 2} height={SIZE * 2 + 10} viewBox={`0 0 ${SIZE * 2} ${SIZE * 2 + 10}`} className="overflow-visible">
      {gridLevels.map((lvl, li) => {
        const pts = Array.from({ length: N }, (_, i) => point(R_MAX * lvl, i));
        const path = pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ') + ' Z';
        return <path key={li} d={path} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />;
      })}

      {Array.from({ length: N }, (_, i) => {
        const [x, y] = point(R_MAX, i);
        return <line key={i} x1={CX} y1={CY} x2={x.toFixed(1)} y2={y.toFixed(1)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />;
      })}

      <motion.path
        d={dataPath}
        fill={dataColor}
        fillOpacity={0.1}
        stroke={dataColor}
        strokeWidth="1.5"
        strokeOpacity={0.7}
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{ transformOrigin: `${CX}px ${CY}px` }}
        transition={{ duration: 0.75, ease: [0.4, 0, 0.2, 1], delay: 0.2 }}
      />

      {dataPoints.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x} cy={y} r={3}
          fill={dataColor}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 + i * 0.05 }}
        />
      ))}

      {DIM_KEYS.map((k, i) => {
        const [lx, ly] = point(labelR, i);
        const lines = dimLabels[k].split('\n');
        const lineH = 12;
        const totalH = lines.length * lineH;
        return (
          <text key={k} x={lx.toFixed(1)} y={(ly - totalH / 2 + 6).toFixed(1)} textAnchor="middle" fontSize="9.5" fill="#4a4845">
            {lines.map((ln, li) => (
              <tspan key={li} x={lx.toFixed(1)} dy={li === 0 ? 0 : lineH}>{ln}</tspan>
            ))}
          </text>
        );
      })}

      {DIM_KEYS.map((k, i) => {
        const val = dimensions[k];
        const r = R_MAX * (val / 100);
        const [vx, vy] = point(r + 14, i);
        return (
          <motion.text
            key={k}
            x={vx.toFixed(1)} y={(vy + 3).toFixed(1)}
            textAnchor="middle" fontSize="8" fill="#8a8680"
            fontFamily="monospace"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 + i * 0.05 }}
          >
            {val}
          </motion.text>
        );
      })}
    </svg>
  );
}

// ── 维度展开卡 ────────────────────────────────────────────
const ZHITINEI_JOBS_SET = new Set([
  '公务员（党政机关）', '事业编制（教科文卫）', '事业编制（科研院所）',
  '军队/警察/消防', '城管/执法人员', '社区/街道/村镇干部', '其他体制内岗位',
]);

function getDimLabel(dimKey: DimKey, answers: Answers): string {
  const isZhiTiNei =
    answers['Q0a'] === '政府与公共事业' &&
    ZHITINEI_JOBS_SET.has(answers['Q0b'] as string);
  if (dimKey === 'company' && isZhiTiNei) return '单位动向';
  return dimensionLabels[dimKey];
}

function DimensionInsightCard({
  dimKey,
  value,
  answers,
}: {
  dimKey: DimKey;
  value: number;
  answers: Answers;
}) {
  const [open, setOpen] = useState(false);
  const barColor = value >= 70 ? '#f87171' : value >= 50 ? '#fb923c' : value >= 35 ? '#facc15' : '#4ade80';
  const insight = getDimensionInsight(dimKey, value, answers);
  const label = getDimLabel(dimKey, answers);

  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center gap-3 py-3 text-left"
      >
        <div className="w-14 flex-shrink-0">
          <div className="h-1 bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: barColor }}
              initial={{ width: 0 }}
              animate={{ width: `${value}%` }}
              transition={{ duration: 0.6, delay: 0.1, ease: 'easeOut' }}
            />
          </div>
        </div>

        <span className="text-[#8a8680] text-xs flex-1">{label}</span>
        <span className="text-xs font-medium tabular-nums" style={{ color: barColor }}>{value}</span>
        <ChevronDown
          size={12}
          className="text-[#3a3835] transition-transform duration-200 flex-shrink-0"
          style={{ transform: open ? 'rotate(180deg)' : 'none' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.22 }}
            className="overflow-hidden"
          >
            <p className="text-[#5a5855] text-xs leading-relaxed pb-3 pr-2">{insight}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 动效 ──────────────────────────────────────────────────
const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};
const item = {
  hidden:  { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
};

// ── 将图片 URL 转成 base64（解决微信内置浏览器跨域问题）──
async function toBase64(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch {
    return '';
  }
}

// ── 主页面 ────────────────────────────────────────────────
export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<ScoreResult | null>(null);
  const [answers, setAnswers] = useState<Answers>({});
  const [loaded, setLoaded] = useState(false);

  // 分享卡相关
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [qrBase64, setQrBase64] = useState<string>('');

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem('aria_answers');
      if (!raw) { router.replace('/'); return; }
      const parsed = JSON.parse(raw) as Answers;
      setAnswers(parsed);
      const scoreResult = calculateScore(parsed);
      setResult(scoreResult);

      // 上报匿名统计（静默失败）
      const Q14_val = parsed['Q14'] as string | undefined;
      const Q15_val = parsed['Q15'];
      const Q_anxiety_val = parsed['Q_anxiety'];

      submitAnonymousStats({
        industry:         (parsed['Q0a'] as string) ?? '',
        job_type:         (parsed['Q0b'] as string) ?? '',
        experience_band:  (parsed['Q0c'] as string) ?? '',
        score_total:      scoreResult.total,
        score_macro:      scoreResult.dimensions.macro,
        score_task:       scoreResult.dimensions.task,
        score_org:        scoreResult.dimensions.org,
        score_company:    scoreResult.dimensions.company,
        score_moat:       scoreResult.dimensions.moat,
        score_adapt:      scoreResult.dimensions.adapt,
        anxiety_level:    Q_anxiety_val ? Number(Q_anxiety_val) : 2,
        ai_usage_level:   Q14_val ? (Q14_MAP[Q14_val] ?? 1) : 1,
        adapt_confidence: Q15_val ? Number(Q15_val) : 1,
        risk_tier:        TIER_ZH[scoreResult.tier] ?? scoreResult.tier,
        anxiety_vs_risk:  ANXIETY_VS_RISK_ZH[scoreResult.anxietyVsRisk] ?? scoreResult.anxietyVsRisk,
        platform:         detectPlatform(),
        session_id:       getOrCreateSessionId(),
      });
    } catch { router.replace('/'); }
    finally { setLoaded(true); }
  }, [router]);

  // 预加载二维码 base64（避免微信内置浏览器截图跨域失败）
  useEffect(() => {
    toBase64('/qrcode-placeholder.svg').then(setQrBase64);
  }, []);

  const animatedScore = useCountUp(result?.total ?? 0, 1600);

  // 生成分享卡
  const handleSaveShareCard = async () => {
    if (!shareCardRef.current || isGenerating) return;
    setIsGenerating(true);
    try {
      // 动态导入 html2canvas（避免 SSR 问题）
      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(shareCardRef.current, {
        backgroundColor: '#111110',
        scale: 3,               // 3x 清晰度，适配 Retina 屏
        useCORS: true,
        logging: false,
        width: 375,
      });
      const dataUrl = canvas.toDataURL('image/png');
      setShareImageUrl(dataUrl);
      setShowShareModal(true);
    } catch (err) {
      console.error('生成分享卡失败:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = () => {
    if (!result) return;
    const copy = getResultCopy(result.tier);
    const text = `${copy.share_line}\n\n我的 AI 替代风险指数：${result.total}/100（${copy.score_label}）`;
    if (navigator.share) {
      navigator.share({ title: '测一测你的抗 AI 指数', text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
    }
  };

  if (!loaded || !result) {
    return (
      <div className="min-h-screen bg-[#111110] flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
          className="w-8 h-8 opacity-30"
        >
          <svg viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#edebe6" strokeWidth="1" />
            <polygon points="14,5 23,14 14,23 5,14" stroke="#edebe6" strokeWidth="1" fill="none" />
            <circle cx="14" cy="14" r="2" fill="#edebe6" />
          </svg>
        </motion.div>
      </div>
    );
  }

  const copy = getResultCopy(result.tier);
  const anxietyCopy = getAnxietyCopy(result.anxietyVsRisk);
  const tierColor = TIER_COLOR[result.tier] ?? '#edebe6';
  const industry = (answers['Q0a'] as string) ?? '';
  const industryPercentile = getIndustryPercentile(result.total, industry);

  return (
    <>
      <main className="min-h-screen bg-[#111110] px-4 py-10">
        <motion.div
          className="max-w-xl mx-auto flex flex-col gap-5"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >

          {/* ── 综合分数卡 ──────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-7 text-center"
          >
            <p className="text-[#3a3835] text-[10px] tracking-widest uppercase mb-5">AI 替代风险综合评分</p>

            <div className="flex items-baseline justify-center gap-1.5 mb-3">
              <span
                className="text-[5.5rem] font-semibold leading-none tabular-nums"
                style={{ color: tierColor }}
              >
                {animatedScore}
              </span>
              <span className="text-[#3a3835] text-2xl font-light">/100</span>
            </div>

            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium border mb-4"
              style={{ color: tierColor, borderColor: `${tierColor}30`, backgroundColor: `${tierColor}0d` }}
            >
              {copy.score_label}
            </span>

            <p className="text-[#8a8680] text-sm leading-relaxed mb-4">{copy.tagline}</p>

            {/* 行业对比条 */}
            {industry && (
              <div className="flex items-center justify-center gap-2 mb-6 px-4 py-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                <span className="text-[#4a4845] text-xs">在</span>
                <span className="text-[#8a8680] text-xs font-medium">{industry}</span>
                <span className="text-[#4a4845] text-xs">从业者中，你的风险分低于</span>
                <span className="text-sm font-semibold tabular-nums" style={{ color: tierColor }}>
                  {industryPercentile}%
                </span>
                <span className="text-[#4a4845] text-xs">的人</span>
              </div>
            )}

            {/* 评分方法论说明 */}
            <div className="border-t border-white/[0.05] pt-4 text-left flex flex-col gap-2.5">
              <p className="text-[#3a3835] text-[10px] tracking-widest uppercase">评分依据</p>
              <div className="flex flex-col gap-2">
                {[
                  {
                    source: 'Oxford · Frey & Osborne',
                    desc: '职业自动化概率模型，分析 702 种职业的任务结构与替代风险，对应维度①②',
                  },
                  {
                    source: 'WEF Future of Jobs',
                    desc: '全球就业趋势报告，行业宏观风险与组织层面的 AI 落地节奏，对应维度①③④',
                  },
                  {
                    source: 'McKinsey Global Institute',
                    desc: '以「任务」而非「职业」为粒度的自动化分析，支撑工作内容分配评分，对应维度②',
                  },
                  {
                    source: 'Dweck / Bandura',
                    desc: '成长型思维与自我效能感理论，支撑适应能力和焦虑比对模块，对应维度⑥及情绪层',
                  },
                ].map((r) => (
                  <div key={r.source} className="flex gap-2.5">
                    <span className="text-[#3a3835] text-[9px] mt-0.5 flex-shrink-0">—</span>
                    <p className="text-[10px] leading-relaxed">
                      <span className="text-[#5a5855] font-medium">{r.source}　</span>
                      <span className="text-[#3a3835]">{r.desc}</span>
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-[#2a2826] text-[9px] leading-relaxed pt-1">
                综合评分由六维度加权合并：宏观环境 20% · 任务结构 25% · 组织位置 15% · 公司动向 15% · 护城河 15% · 适应能力 10%
              </p>
            </div>
          </motion.div>

          {/* ── 六维度雷达图 ────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-5"
          >
            <p className="text-[#8a8680] text-xs font-medium mb-1 tracking-wide">六维度风险图谱</p>
            <p className="text-[#3a3835] text-[10px] mb-4">分值越高 = 该维度被替代风险越大</p>

            <div className="flex justify-center">
              <HexRadar dimensions={result.dimensions} />
            </div>
          </motion.div>

          {/* ── 详细解读（可展开）───────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] px-5 pt-4 pb-2"
          >
            <p className="text-[#8a8680] text-xs font-medium tracking-wide mb-1">各维度打分依据</p>
            <p className="text-[#3a3835] text-[10px] mb-3">点击维度查看详细解读</p>

            <div>
              {DIM_KEYS.map((k) => (
                <DimensionInsightCard
                  key={k}
                  dimKey={k}
                  value={result.dimensions[k]}
                  answers={answers}
                />
              ))}
            </div>
          </motion.div>

          {/* ── 三段文案解读 ─────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-5 flex flex-col gap-5"
          >
            <p className="text-[#8a8680] text-xs font-medium tracking-wide">ARIA 综合解读</p>

            {[
              { dot: '#f87171', label: '最大风险', text: copy.risk_text },
              { dot: '#facc15', label: '缓冲因素', text: copy.buffer_text },
              { dot: '#4ade80', label: '行动建议', text: copy.action_text },
            ].map((s) => (
              <div key={s.label} className="flex gap-3">
                <div
                  className="flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5"
                  style={{ backgroundColor: s.dot }}
                />
                <div>
                  <p className="text-[#edebe6] text-xs font-medium mb-1">{s.label}</p>
                  <p className="text-[#8a8680] text-sm leading-relaxed">{s.text}</p>
                </div>
              </div>
            ))}
          </motion.div>

          {/* ── 焦虑 vs 风险 ────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-5"
          >
            <p className="text-[#8a8680] text-xs font-medium mb-3 tracking-wide">客观风险 vs 主观焦虑</p>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-xl border border-white/[0.06] bg-[#111110] p-3 text-center">
                <p className="text-[#3a3835] text-[10px] mb-1.5">客观风险指数</p>
                <p className="text-2xl font-semibold tabular-nums" style={{ color: tierColor }}>
                  {result.total}
                </p>
              </div>
              <div className="rounded-xl border border-white/[0.06] bg-[#111110] p-3 text-center">
                <p className="text-[#3a3835] text-[10px] mb-1.5">主观焦虑程度</p>
                <p className="text-2xl font-semibold text-[#8a8680]">
                  {result.anxietyLevel}<span className="text-sm text-[#4a4845]">/4</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-2">
              <span
                className="px-2 py-0.5 rounded text-xs font-medium border"
                style={{
                  color: anxietyCopy.badgeColor,
                  borderColor: `${anxietyCopy.badgeColor}30`,
                  backgroundColor: `${anxietyCopy.badgeColor}0d`,
                }}
              >
                {anxietyCopy.badge}
              </span>
              <span className="text-[#edebe6] text-sm">{anxietyCopy.title}</span>
            </div>

            <p className="text-[#8a8680] text-sm leading-relaxed">{anxietyCopy.desc}</p>
          </motion.div>

          {/* ── 专业版 CTA ───────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-5"
          >
            <p className="text-[#edebe6] text-sm font-medium mb-1.5">解锁专业版报告</p>
            <p className="text-[#8a8680] text-sm leading-relaxed mb-4">{copy.cta_text}</p>
            <button
              className="w-full py-3 rounded-xl border border-white/[0.12] bg-[#edebe6]/[0.05]
                text-[#edebe6] text-sm font-medium
                hover:bg-[#edebe6]/[0.09] hover:border-white/20
                transition-all duration-200 active:scale-[0.98]"
            >
              获取专属行动计划 →
            </button>
          </motion.div>

          {/* ── 公众号引流 ────────────────────────────────────── */}
          <motion.div
            variants={item}
            className="rounded-2xl border border-white/[0.07] bg-[#161513] p-5 flex flex-col items-center gap-4"
          >
            <div className="text-center">
              <p className="text-[#edebe6] text-sm font-medium mb-1">
                这份结果，值得认真对待
              </p>
              <p className="text-[#4a4845] text-xs leading-relaxed">
                关注「猫系 CEO」，我会持续写<br />
                如何在 AI 时代建立自己真正的护城河
              </p>
            </div>

            <div className="relative">
              <div className="w-32 h-32 rounded-xl overflow-hidden border border-white/[0.08] bg-white">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/qrcode-placeholder.svg"
                  alt="公众号二维码（即将上线）"
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <p className="text-[#3a3835] text-[11px] tracking-wide">
              公众号二维码即将上线
            </p>
          </motion.div>

          {/* ── 底部操作 ─────────────────────────────────────── */}
          <motion.div variants={item} className="flex gap-3">
            <button
              onClick={handleSaveShareCard}
              disabled={isGenerating}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                border border-white/[0.08] text-[#4a4845] hover:text-[#8a8680] hover:border-white/15
                text-sm transition-colors duration-150 disabled:opacity-50"
            >
              {isGenerating ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                  className="w-3 h-3 border border-[#4a4845] border-t-transparent rounded-full"
                />
              ) : (
                <ImageDown size={13} />
              )}
              {isGenerating ? '生成中…' : '保存分享卡'}
            </button>
            <button
              onClick={handleShare}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                border border-white/[0.08] text-[#4a4845] hover:text-[#8a8680] hover:border-white/15
                text-sm transition-colors duration-150"
            >
              <Share2 size={13} />
              分享结果
            </button>
            <button
              onClick={() => { sessionStorage.removeItem('aria_answers'); router.push('/quiz'); }}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                border border-white/[0.08] text-[#4a4845] hover:text-[#8a8680] hover:border-white/15
                text-sm transition-colors duration-150"
            >
              <RotateCcw size={13} />
              重新测评
            </button>
          </motion.div>

          <motion.p variants={item} className="text-center text-[#3a3835] text-xs pb-4">
            由 ARIA 生成 · 仅供参考，不构成职业建议
          </motion.p>

        </motion.div>
      </main>

      {/* ── 隐藏的分享卡 DOM（供 html2canvas 截图用）── */}
      <ShareCard ref={shareCardRef} result={result} qrBase64={qrBase64} />

      {/* ── 分享卡预览 Modal ────────────────────────────────── */}
      <AnimatePresence>
        {showShareModal && shareImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.88, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.88, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 380, damping: 28 }}
              className="relative max-w-xs w-full"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={() => setShowShareModal(false)}
                className="absolute -top-10 right-0 text-white/40 hover:text-white/70 transition-colors"
              >
                <X size={20} />
              </button>

              {/* 分享卡图片预览 */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={shareImageUrl}
                alt="分享卡"
                className="w-full rounded-2xl shadow-2xl"
                style={{ imageRendering: 'crisp-edges' }}
              />

              {/* 提示文字 */}
              <p className="text-center text-white/30 text-xs mt-4">
                长按图片保存到相册
              </p>

              {/* 非移动端提供下载链接 */}
              <div className="mt-3 flex justify-center">
                <a
                  href={shareImageUrl}
                  download="ARIA-AI风险测评分享卡.png"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-white/10
                    text-white/40 hover:text-white/70 hover:border-white/20
                    text-xs transition-colors duration-150"
                  onClick={(e) => e.stopPropagation()}
                >
                  <ImageDown size={11} />
                  下载图片
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
