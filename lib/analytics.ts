// lib/analytics.ts
// 匿名统计上报 — 完全静默失败，不影响用户体验
// 普通版只传去标识化数据，不含任何个人信息

export interface QuizStatsPayload {
  industry:         string;
  job_type:         string;
  experience_band:  string;
  score_total:      number;
  score_macro:      number;
  score_task:       number;
  score_org:        number;
  score_company:    number;
  score_moat:       number;
  score_adapt:      number;
  anxiety_level:    number;   // 1–4
  ai_usage_level:   number;   // 1–5
  adapt_confidence: number;   // 1–5
  risk_tier:        string;
  anxiety_vs_risk:  string;
  platform:         string;
  session_id:       string;
}

// ── 辅助函数 ────────────────────────────────────────────────

/** 获取或创建本次会话的匿名 UUID，存在 localStorage，与用户身份无关 */
export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') return 'ssr';
  const key = 'aria_session_id';
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
    localStorage.setItem(key, id);
  }
  return id;
}

/** 检测平台 */
export function detectPlatform(): string {
  if (typeof window === 'undefined') return 'web';
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('micromessenger')) return 'wechat_h5';
  return 'web';
}

// ── 主上报函数 ───────────────────────────────────────────────

/**
 * 在结果页调用，静默上报匿名测评数据。
 * 失败不抛出错误，不影响用户体验。
 */
export async function submitAnonymousStats(payload: QuizStatsPayload): Promise<void> {
  try {
    const res = await fetch('/api/stats', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[analytics] stats upload failed silently, status:', res.status);
    }
  } catch {
    // 网络错误静默处理
  }
}
