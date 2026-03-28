'use client';

// components/ShareCard.tsx
// 分享卡组件 — 隐藏 DOM，仅用于 html2canvas 截图
// 使用内联样式（html2canvas 对 Tailwind JIT 类支持有限）

import { forwardRef } from 'react';
import { ScoreResult } from '@/lib/scoring';
import { getResultCopy } from '@/lib/resultCopy';

const TIER_COLOR: Record<string, string> = {
  safe:     '#4ade80',
  watch:    '#facc15',
  alert:    '#fb923c',
  danger:   '#f87171',
  critical: '#ef4444',
};

const DIM_LABELS: Record<string, string> = {
  macro:   '宏观环境',
  task:    '任务结构',
  org:     '组织位置',
  company: '公司动向',
  moat:    '护城河',
  adapt:   '适应能力',
};

const DIM_KEYS = ['macro', 'task', 'org', 'company', 'moat', 'adapt'] as const;

const ANXIETY_LABELS: Record<number, string> = {
  1: '几乎不担心',
  2: '偶尔想到',
  3: '有点焦虑',
  4: '非常担心',
};

interface ShareCardProps {
  result: ScoreResult;
  /** 二维码图片 base64 dataURL（微信内置浏览器需转成 base64 避免跨域） */
  qrBase64?: string;
}

const ShareCard = forwardRef<HTMLDivElement, ShareCardProps>(({ result, qrBase64 }, ref) => {
  const copy = getResultCopy(result.tier);
  const tierColor = TIER_COLOR[result.tier] ?? '#edebe6';

  // 卡片固定宽度 375px，高度自适应（约 660px）
  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: '-9999px',
    top: 0,
    width: '375px',
    backgroundColor: '#111110',
    fontFamily: '-apple-system, "PingFang SC", "Helvetica Neue", sans-serif',
    padding: '28px 24px 24px',
    boxSizing: 'border-box',
    color: '#edebe6',
  };

  return (
    <div ref={ref} style={cardStyle}>

      {/* ── 顶部品牌行 ── */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* ARIA 图标 */}
          <svg width="18" height="18" viewBox="0 0 28 28" fill="none">
            <circle cx="14" cy="14" r="12" stroke="#6366f1" strokeWidth="1.5" />
            <polygon points="14,5 23,14 14,23 5,14" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
            <circle cx="14" cy="14" r="2.5" fill="#8b5cf6" />
          </svg>
          <span style={{ fontSize: '13px', fontWeight: 600, color: '#edebe6', letterSpacing: '0.04em' }}>ARIA</span>
          <span style={{ fontSize: '11px', color: '#4a4845', letterSpacing: '0.06em' }}>AI 替代风险测评</span>
        </div>
        <span style={{ fontSize: '10px', color: '#3a3835', letterSpacing: '0.06em' }}>aria-risk.app</span>
      </div>

      {/* ── 分隔线 ── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '20px' }} />

      {/* ── 分数主体 ── */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div style={{ fontSize: '72px', fontWeight: 600, lineHeight: 1, color: tierColor, marginBottom: '8px' }}>
          {result.total}
        </div>
        <div style={{
          display: 'inline-block',
          padding: '4px 14px',
          borderRadius: '999px',
          border: `1px solid ${tierColor}40`,
          backgroundColor: `${tierColor}12`,
          color: tierColor,
          fontSize: '12px',
          fontWeight: 500,
          marginBottom: '6px',
        }}>
          {copy.score_label}
        </div>
        <div style={{ fontSize: '11px', color: '#8a8680', marginTop: '4px' }}>
          {copy.tagline}
        </div>
      </div>

      {/* ── 分隔线 ── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '16px' }} />

      {/* ── 6 维度横条 ── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
        {DIM_KEYS.map((k) => {
          const val = result.dimensions[k];
          const barColor = val >= 70 ? '#f87171' : val >= 50 ? '#fb923c' : val >= 35 ? '#facc15' : '#4ade80';
          return (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '11px', color: '#8a8680', width: '52px', flexShrink: 0 }}>{DIM_LABELS[k]}</span>
              <div style={{ flex: 1, height: '5px', backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: '999px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${val}%`, backgroundColor: barColor, borderRadius: '999px' }} />
              </div>
              <span style={{ fontSize: '11px', color: barColor, fontVariantNumeric: 'tabular-nums', width: '24px', textAlign: 'right', flexShrink: 0 }}>{val}</span>
            </div>
          );
        })}
      </div>

      {/* ── 分隔线 ── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '14px' }} />

      {/* ── 焦虑 vs 风险 ── */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
        <div style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#4a4845', marginBottom: '4px' }}>客观风险</div>
          <div style={{ fontSize: '22px', fontWeight: 600, color: tierColor }}>{result.total}</div>
        </div>
        <div style={{ flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid rgba(255,255,255,0.07)', backgroundColor: 'rgba(255,255,255,0.03)', textAlign: 'center' }}>
          <div style={{ fontSize: '10px', color: '#4a4845', marginBottom: '4px' }}>焦虑程度</div>
          <div style={{ fontSize: '14px', fontWeight: 500, color: '#8a8680' }}>
            {ANXIETY_LABELS[result.anxietyLevel] ?? '—'} <span style={{ fontSize: '11px', color: '#4a4845' }}>({result.anxietyLevel}/4)</span>
          </div>
        </div>
      </div>

      {/* ── 分隔线 ── */}
      <div style={{ height: '1px', backgroundColor: 'rgba(255,255,255,0.06)', marginBottom: '14px' }} />

      {/* ── 底部引流 ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {/* 二维码区域 */}
        <div style={{ width: '56px', height: '56px', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', backgroundColor: '#fff', flexShrink: 0 }}>
          {qrBase64 ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qrBase64} alt="二维码" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f5f5f5' }}>
              <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                <circle cx="14" cy="14" r="12" stroke="#6366f1" strokeWidth="1.5" />
                <polygon points="14,5 23,14 14,23 5,14" stroke="#8b5cf6" strokeWidth="1.5" fill="none" />
                <circle cx="14" cy="14" r="2.5" fill="#8b5cf6" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <div style={{ fontSize: '12px', fontWeight: 500, color: '#edebe6', marginBottom: '2px' }}>
            测一测你的抗 AI 指数
          </div>
          <div style={{ fontSize: '10px', color: '#4a4845', lineHeight: 1.5 }}>
            扫码免费测评，3分钟看清职业风险
          </div>
        </div>
      </div>

    </div>
  );
});

ShareCard.displayName = 'ShareCard';

export default ShareCard;
