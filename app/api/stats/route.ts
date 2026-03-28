// app/api/stats/route.ts
// 匿名统计上报 API — 仅允许 INSERT，字段白名单过滤
// 使用 service_role key 在服务端写入，不暴露给前端

import { createClient } from '@supabase/supabase-js';

// 懒初始化：构建时 env 未注入不会崩溃，运行时再校验
function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

export async function POST(req: Request) {
  const supabase = getSupabase();
  if (!supabase) {
    // 未配置 Supabase 时静默返回 OK（不影响用户体验）
    console.warn('[stats] Supabase not configured, skipping stat insert.');
    return Response.json({ ok: true, skipped: true });
  }

  try {
    const payload = await req.json();

    // 白名单过滤，防止注入非预期字段
    const safePayload = {
      industry:          typeof payload.industry === 'string'          ? payload.industry          : null,
      job_type:          typeof payload.job_type === 'string'          ? payload.job_type          : null,
      experience_band:   typeof payload.experience_band === 'string'   ? payload.experience_band   : null,
      score_total:       Number(payload.score_total)       || 0,
      score_macro:       Number(payload.score_macro)       || 0,
      score_task:        Number(payload.score_task)        || 0,
      score_org:         Number(payload.score_org)         || 0,
      score_company:     Number(payload.score_company)     || 0,
      score_moat:        Number(payload.score_moat)        || 0,
      score_adapt:       Number(payload.score_adapt)       || 0,
      anxiety_level:     Number(payload.anxiety_level)     || 0,
      ai_usage_level:    Number(payload.ai_usage_level)    || 0,
      adapt_confidence:  Number(payload.adapt_confidence)  || 0,
      risk_tier:         typeof payload.risk_tier === 'string'         ? payload.risk_tier         : null,
      anxiety_vs_risk:   typeof payload.anxiety_vs_risk === 'string'   ? payload.anxiety_vs_risk   : null,
      platform:          typeof payload.platform === 'string'          ? payload.platform          : 'web',
      session_id:        typeof payload.session_id === 'string'        ? payload.session_id        : null,
      app_version:       '0.4',
      product_tier:      'free',
    };

    const { error } = await supabase.from('quiz_stats').insert(safePayload);
    if (error) {
      console.error('[stats] supabase insert error:', error.message);
      return Response.json({ ok: false, error: error.message }, { status: 500 });
    }
    return Response.json({ ok: true });
  } catch (err) {
    console.error('[stats] unexpected error:', err);
    return Response.json({ ok: false }, { status: 500 });
  }
}
