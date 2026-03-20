'use client';

import { useState, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown, Mic, Square } from 'lucide-react';
import { Question, Option, industryJobMap } from '@/lib/questions';

// Web Speech API 类型声明（浏览器原生，不在 lib.dom.d.ts 默认集中）
type SpeechRec = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};
type SpeechRecConstructor = new () => SpeechRec;

interface QuestionCardProps {
  question: Question;
  currentAnswer: string | number | undefined;
  answers: Record<string, string | number>;
  onAnswer: (value: string | number) => void;
  onSkip?: () => void;
}

// ── 语音输入按钮 ────────────────────────────────────────────
function VoiceButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const [status, setStatus] = useState<'idle' | 'listening' | 'unsupported'>(() =>
    typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window)
      ? 'idle'
      : 'unsupported'
  );
  const recRef = useRef<SpeechRec | null>(null);

  const toggle = useCallback(() => {
    if (status === 'unsupported') return;

    if (status === 'listening') {
      recRef.current?.stop();
      setStatus('idle');
      return;
    }

    const w = window as Window & {
      webkitSpeechRecognition?: SpeechRecConstructor;
      SpeechRecognition?: SpeechRecConstructor;
    };
    const SpeechRecCtor = w.webkitSpeechRecognition ?? w.SpeechRecognition;
    if (!SpeechRecCtor) return;

    const rec = new SpeechRecCtor();
    rec.lang = 'zh-CN';
    rec.interimResults = false;
    rec.maxAlternatives = 1;

    rec.onresult = (e) => {
      const text = e.results[0]?.[0]?.transcript ?? '';
      if (text) onTranscript(text);
      setStatus('idle');
    };
    rec.onerror = () => setStatus('idle');
    rec.onend = () => setStatus('idle');

    recRef.current = rec;
    rec.start();
    setStatus('listening');
  }, [status, onTranscript]);

  if (status === 'unsupported') return null;

  return (
    <button
      type="button"
      onClick={toggle}
      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs transition-all duration-150
        ${status === 'listening'
          ? 'border-[#edebe6]/30 bg-[#edebe6]/[0.08] text-[#edebe6]'
          : 'border-white/[0.08] text-[#4a4845] hover:text-[#8a8680] hover:border-white/15'
        }`}
    >
      {status === 'listening' ? (
        <><Square size={11} className="fill-current" />停止录音</>
      ) : (
        <><Mic size={11} />语音输入</>
      )}
    </button>
  );
}

const enter = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] as [number, number, number, number] },
};

export default function QuestionCard({
  question,
  currentAnswer,
  answers,
  onAnswer,
  onSkip,
}: QuestionCardProps) {
  const [textValue, setTextValue] = useState(
    typeof currentAnswer === 'string' ? currentAnswer : ''
  );

  // slider: 分离"当前显示值"与"已提交值"，避免碰一下就提交
  const [sliderDisplay, setSliderDisplay] = useState(
    typeof currentAnswer === 'number' ? currentAnswer : question.sliderMin ?? 1
  );
  const [sliderConfirmed, setSliderConfirmed] = useState(
    typeof currentAnswer === 'number'
  );

  // allocation: 四类百分比
  const parseAlloc = (): Record<string, number> => {
    if (typeof currentAnswer === 'string' && currentAnswer) {
      try { return JSON.parse(currentAnswer); } catch { /* ignore */ }
    }
    const items = question.allocationItems ?? [];
    const each = Math.floor(100 / items.length);
    const alloc: Record<string, number> = {};
    items.forEach((it, i) => {
      alloc[it.value] = i === 0 ? 100 - each * (items.length - 1) : each;
    });
    return alloc;
  };
  const [alloc, setAlloc] = useState<Record<string, number>>(parseAlloc);

  const getOptions = (): Option[] => {
    if (question.dependsOn) {
      const parent = answers[question.dependsOn] as string;
      // 「其他行业：xxx」格式时，用「其他行业」做 key
      const key = parent?.startsWith('其他行业：') ? '其他行业' : parent;
      return industryJobMap[key] ?? [];
    }
    return question.options ?? [];
  };

  // ── 单选 ─────────────────────────────────────────────────
  if (question.type === 'single') {
    const options = getOptions();
    return (
      <motion.div className="flex flex-col gap-2" {...enter}>
        {options.map((opt) => {
          const selected = currentAnswer === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onAnswer(opt.value)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left text-sm
                border transition-all duration-150
                ${selected
                  ? 'border-[#edebe6] bg-[#edebe6]/[0.06] text-[#edebe6]'
                  : 'border-white/[0.08] text-[#8a8680] hover:border-white/20 hover:text-[#edebe6]'
                }
              `}
            >
              {opt.emoji && (
                <span className="text-base leading-none flex-shrink-0 opacity-70">{opt.emoji}</span>
              )}
              <span className="flex-1">{opt.label}</span>
              {selected && <span className="text-[#edebe6]/50 text-xs ml-auto">✓</span>}
            </button>
          );
        })}
      </motion.div>
    );
  }

  // ── 滑块（加确认按钮，避免碰一下就提交）──────────────────
  if (question.type === 'slider') {
    const min = question.sliderMin ?? 1;
    const max = question.sliderMax ?? 5;
    const pct = ((sliderDisplay - min) / (max - min)) * 100;

    return (
      <motion.div className="flex flex-col gap-5 px-1" {...enter}>
        {/* 数值 */}
        <div className="flex justify-center">
          <div
            className={`w-12 h-12 rounded-full border flex items-center justify-center
              text-xl font-semibold tabular-nums transition-colors duration-150
              ${sliderConfirmed
                ? 'border-[#edebe6] bg-[#edebe6]/[0.06] text-[#edebe6]'
                : 'border-white/[0.12] bg-[#1c1b19] text-[#8a8680]'
              }`}
          >
            {sliderDisplay}
          </div>
        </div>

        {/* 轨道 */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={sliderDisplay}
          onChange={(e) => {
            setSliderDisplay(Number(e.target.value));
            setSliderConfirmed(false);
          }}
          className="quiz-slider w-full"
          style={{ '--pct': `${pct}%` } as React.CSSProperties}
        />

        {/* 端点标签 */}
        {question.sliderLabels && (
          <div className="flex justify-between text-xs text-[#4a4845]">
            <span>{question.sliderLabels[0]}</span>
            <span>{question.sliderLabels[1]}</span>
          </div>
        )}

        {/* 刻度点 */}
        <div className="flex justify-between">
          {Array.from({ length: max - min + 1 }, (_, i) => i + min).map((v) => (
            <button
              key={v}
              onClick={() => { setSliderDisplay(v); setSliderConfirmed(false); }}
              className={`w-7 h-7 rounded-full text-xs font-medium transition-all
                ${v === sliderDisplay
                  ? sliderConfirmed
                    ? 'border border-[#edebe6] text-[#edebe6] bg-[#edebe6]/[0.06]'
                    : 'border border-white/30 text-[#edebe6] bg-transparent'
                  : 'border border-white/[0.08] text-[#4a4845] hover:text-[#8a8680] hover:border-white/15'
                }`}
            >
              {v}
            </button>
          ))}
        </div>

        {/* 确认按钮 — 解耦选值与提交 */}
        <button
          onClick={() => {
            setSliderConfirmed(true);
            onAnswer(sliderDisplay);
          }}
          className={`w-full py-2.5 rounded-xl border text-sm font-medium transition-all duration-150
            ${sliderConfirmed
              ? 'border-white/[0.08] text-[#4a4845] cursor-default'
              : 'border-[#edebe6]/20 bg-[#edebe6]/[0.05] text-[#edebe6] hover:bg-[#edebe6]/[0.09] active:scale-[0.98]'
            }`}
          disabled={sliderConfirmed}
        >
          {sliderConfirmed ? '✓ 已确认' : '确认这个分数'}
        </button>
      </motion.div>
    );
  }

  // ── 文字输入（含语音） ────────────────────────────────────
  if (question.type === 'text') {
    return (
      <motion.div className="flex flex-col gap-3" {...enter}>
        <textarea
          value={textValue}
          onChange={(e) => setTextValue(e.target.value)}
          placeholder="随便说说……"
          rows={3}
          className="w-full px-4 py-3 rounded-xl bg-[#1c1b19] border border-white/[0.08]
            text-[#edebe6] text-sm placeholder-[#3a3835]
            focus:outline-none focus:border-white/20
            resize-none transition-colors leading-relaxed"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { if (textValue.trim()) onAnswer(textValue.trim()); }}
            disabled={!textValue.trim()}
            className="flex-1 py-2.5 rounded-xl border border-[#edebe6]/20 bg-[#edebe6]/[0.05]
              text-[#edebe6] text-sm font-medium transition-all duration-150
              hover:bg-[#edebe6]/[0.09] disabled:opacity-25 disabled:cursor-not-allowed"
          >
            确认
          </button>
          <VoiceButton
            onTranscript={(text) => setTextValue((prev) => prev ? prev + ' ' + text : text)}
          />
          {question.isOptional && onSkip && (
            <button
              onClick={onSkip}
              className="px-4 py-2.5 rounded-xl border border-white/[0.08] text-[#4a4845]
                text-sm transition-colors hover:text-[#8a8680] hover:border-white/15"
            >
              跳过
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  // ── 下拉（Q0a 选其他行业时追加文字输入）───────────────────
  if (question.type === 'dropdown') {
    const options = getOptions();
    const isQ0a = question.id === 'Q0a';
    const selectedOther = isQ0a && (currentAnswer === '其他行业' || String(currentAnswer ?? '').startsWith('其他行业：'));
    // 如果是依赖题（Q0b），用父题答案做 key，父题一变立即 remount，杜绝闪烁
    const parentVal = question.dependsOn ? (answers[question.dependsOn] as string ?? '') : '';

    return (
      <motion.div className="flex flex-col gap-3" {...enter}>
        <div className="relative">
          <select
            key={parentVal || question.id}
            value={typeof currentAnswer === 'string' ? currentAnswer : ''}
            onChange={(e) => { if (e.target.value) onAnswer(e.target.value); }}
            className="w-full appearance-none px-4 py-3 pr-10 rounded-xl
              bg-[#1c1b19] border border-white/[0.08] text-[#edebe6] text-sm
              focus:outline-none focus:border-white/20 transition-colors cursor-pointer"
          >
            <option value="" disabled>请选择……</option>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a4845] pointer-events-none" />
        </div>

        {/* 其他行业：追加填空 + 确认按钮，让用户明确提交自定义行业名 */}
        {selectedOther && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-2"
          >
            <input
              type="text"
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && textValue.trim()) onAnswer('其他行业：' + textValue.trim());
              }}
              placeholder="说说你的行业或领域……"
              className="w-full px-3 py-2.5 rounded-xl bg-[#1c1b19] border border-white/[0.08]
                text-[#edebe6] text-sm placeholder-[#3a3835]
                focus:outline-none focus:border-white/20 transition-colors"
            />
            <button
              onClick={() => { if (textValue.trim()) onAnswer('其他行业：' + textValue.trim()); }}
              disabled={!textValue.trim()}
              className="w-full py-2.5 rounded-xl border border-[#edebe6]/20 bg-[#edebe6]/[0.05]
                text-[#edebe6] text-sm font-medium transition-all duration-150
                hover:bg-[#edebe6]/[0.09] disabled:opacity-25 disabled:cursor-not-allowed"
            >
              确认
            </button>
          </motion.div>
        )}

        {currentAnswer && !selectedOther && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-[#8a8680] px-1"
          >
            已选：{currentAnswer}
          </motion.p>
        )}
      </motion.div>
    );
  }

  // ── allocation：四类百分比分配（紧凑版）──────────────────
  if (question.type === 'allocation') {
    const items = question.allocationItems ?? [];
    const total = Object.values(alloc).reduce((a, b) => a + b, 0);
    const isValid = total === 100;

    const handleChange = (key: string, delta: number) => {
      setAlloc((prev) => {
        const newVal = Math.max(0, Math.min(100, (prev[key] ?? 0) + delta));
        const diff = newVal - (prev[key] ?? 0);
        if (diff === 0) return prev;

        const others = items.map((i) => i.value).filter((k) => k !== key);
        let remaining = -diff; // 负 = 需从其他项扣；正 = 需向其他项补
        const adjusted: Record<string, number> = { ...prev, [key]: newVal };

        // 升序排列：值小的先处理
        // 扣减时：先动小值 → 大值（用户精心设置的高值）得以保留
        // 补充时：先填小值 → 自然趋向均衡
        const sorted = [...others].sort((a, b) => (adjusted[a] ?? 0) - (adjusted[b] ?? 0));

        for (const k of sorted) {
          if (remaining === 0) break;
          const cur = adjusted[k] ?? 0;
          // 修正公式：扣减不低于 0；补充不超过 100
          const change = remaining < 0
            ? Math.max(-cur, remaining)       // 扣减：最多扣完 cur
            : Math.min(100 - cur, remaining); // 补充：最多补满到 100
          adjusted[k] = cur + change;
          remaining -= change;
        }
        return adjusted;
      });
    };

    return (
      <motion.div className="flex flex-col gap-2.5" {...enter}>
        {items.map((it) => {
          const val = alloc[it.value] ?? 0;
          return (
            <div key={it.value} className="flex items-center gap-2">
              {/* 标签 */}
              <div className="flex items-center gap-1.5 w-28 flex-shrink-0">
                {it.emoji && <span className="text-xs opacity-50">{it.emoji}</span>}
                <span className="text-[#8a8680] text-xs leading-tight">{it.label}</span>
              </div>

              {/* 进度条 */}
              <div className="flex-1 h-px bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-[#edebe6]/40 rounded-full"
                  animate={{ width: `${val}%` }}
                  transition={{ duration: 0.12 }}
                />
              </div>

              {/* 数值 + 加减 */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={() => handleChange(it.value, -5)}
                  disabled={val <= 0}
                  className="w-5 h-5 rounded border border-white/[0.08] text-[#8a8680]
                    hover:text-[#edebe6] hover:border-white/20 disabled:opacity-20
                    text-xs flex items-center justify-center transition-all leading-none"
                >
                  −
                </button>
                <span className="text-[#edebe6] text-xs tabular-nums w-7 text-center font-medium">
                  {val}%
                </span>
                <button
                  onClick={() => handleChange(it.value, 5)}
                  disabled={val >= 100}
                  className="w-5 h-5 rounded border border-white/[0.08] text-[#8a8680]
                    hover:text-[#edebe6] hover:border-white/20 disabled:opacity-20
                    text-xs flex items-center justify-center transition-all leading-none"
                >
                  +
                </button>
              </div>
            </div>
          );
        })}

        {/* 合计 + 确认 */}
        <div className="flex items-center justify-between pt-1">
          <span className={`text-xs tabular-nums font-medium ${isValid ? 'text-[#4ade80]' : 'text-[#fb923c]'}`}>
            {isValid ? '✓ 合计 100%' : `合计 ${total}%，还差 ${100 - total}%`}
          </span>
          <button
            onClick={() => { if (isValid) onAnswer(JSON.stringify(alloc)); }}
            disabled={!isValid}
            className="px-4 py-1.5 rounded-lg border border-[#edebe6]/20 bg-[#edebe6]/[0.05]
              text-[#edebe6] text-xs font-medium transition-all duration-150
              hover:bg-[#edebe6]/[0.09] disabled:opacity-25 disabled:cursor-not-allowed"
          >
            确认
          </button>
        </div>
      </motion.div>
    );
  }

  return null;
}
