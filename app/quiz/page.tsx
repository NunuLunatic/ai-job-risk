'use client';

import { useReducer, useEffect, useRef, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { questions, questionIds, Answers } from '@/lib/questions';
import ChatBubble from '@/components/ChatBubble';
import QuestionCard from '@/components/QuestionCard';

interface QuizState {
  answers: Answers;
  currentStep: number;
}

type QuizAction =
  | { type: 'ANSWER'; id: string; value: string | number }
  | { type: 'BACK' }
  | { type: 'RESTORE'; state: QuizState };

function quizReducer(state: QuizState, action: QuizAction): QuizState {
  switch (action.type) {
    case 'ANSWER': {
      const newAnswers = { ...state.answers, [action.id]: action.value };
      const next = Math.min(state.currentStep + 1, questionIds.length);
      return { answers: newAnswers, currentStep: next };
    }
    case 'BACK':
      return { ...state, currentStep: Math.max(0, state.currentStep - 1) };
    case 'RESTORE':
      return action.state;
    default:
      return state;
  }
}

const STORAGE_KEY = 'aria_quiz_v2';

export default function QuizPage() {
  const router = useRouter();
  const [state, dispatch] = useReducer(quizReducer, { answers: {}, currentStep: 0 });
  const chatEndRef = useRef<HTMLDivElement>(null);
  const isFinished = state.currentStep >= questionIds.length;

  // 存档恢复提示 —— null 表示无存档，QuizState 表示待确认的存档内容
  const [pendingDraft, setPendingDraft] = useState<QuizState | null>(null);

  useEffect(() => {
    // 清除旧版存档，防止残留卡死
    localStorage.removeItem('aria_quiz_v1');
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved) as QuizState;
        // 有实际答题进度才弹提示（至少答了 1 题）
        if (draft.currentStep > 0) {
          setPendingDraft(draft);
          return;
        }
      }
    } catch { /* ignore */ }
  }, []);

  const handleResume = useCallback(() => {
    if (pendingDraft) {
      dispatch({ type: 'RESTORE', state: pendingDraft });
      setPendingDraft(null);
    }
  }, [pendingDraft]);

  const handleRestart = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setPendingDraft(null);
  }, []);

  useEffect(() => {
    // pendingDraft 待确认期间不存档，避免覆盖
    if (pendingDraft !== null) return;
    if (Object.keys(state.answers).length > 0)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, pendingDraft]);

  useEffect(() => {
    if (isFinished) {
      sessionStorage.setItem('aria_answers', JSON.stringify(state.answers));
      localStorage.removeItem(STORAGE_KEY);
      router.push('/result');
    }
  }, [isFinished, state.answers, router]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [state.currentStep]);

  const currentQuestion = questions[state.currentStep];
  const progress = (state.currentStep / questionIds.length) * 100;

  const handleAnswer = useCallback((value: string | number) => {
    if (!currentQuestion) return;
    dispatch({ type: 'ANSWER', id: currentQuestion.id, value });
  }, [currentQuestion]);

  const handleSkip = useCallback(() => {
    if (!currentQuestion) return;
    dispatch({ type: 'ANSWER', id: currentQuestion.id, value: '' });
  }, [currentQuestion]);

  const handleBack = useCallback(() => dispatch({ type: 'BACK' }), []);

  return (
    <div className="min-h-screen bg-[#111110] flex flex-col relative">

      {/* 存档恢复提示 */}
      <AnimatePresence>
        {pendingDraft && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center
              bg-black/60 backdrop-blur-sm px-4 pb-8 sm:pb-0"
          >
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.28, ease: [0.4, 0, 0.2, 1] }}
              className="w-full max-w-sm bg-[#1a1917] border border-white/[0.08]
                rounded-2xl p-6 flex flex-col gap-5"
            >
              {/* ARIA logo 小图标 */}
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 opacity-60 flex-shrink-0">
                  <svg viewBox="0 0 28 28" fill="none">
                    <circle cx="14" cy="14" r="12" stroke="#edebe6" strokeWidth="1" />
                    <polygon points="14,5 23,14 14,23 5,14" stroke="#edebe6" strokeWidth="1" fill="none" />
                    <circle cx="14" cy="14" r="2" fill="#edebe6" />
                  </svg>
                </div>
                <span className="text-[#8a8680] text-xs tracking-wide uppercase">ARIA</span>
              </div>

              {/* 文案 */}
              <div className="flex flex-col gap-1.5">
                <p className="text-[#edebe6] text-base font-medium leading-snug">
                  检测到上次的测评进度
                </p>
                <p className="text-[#4a4845] text-sm leading-relaxed">
                  已答到第 {pendingDraft.currentStep} / {questionIds.length} 题，
                  要从上次继续，还是重新开始？
                </p>
              </div>

              {/* 操作按钮 */}
              <div className="flex flex-col gap-2.5">
                <button
                  onClick={handleResume}
                  className="w-full py-3 rounded-xl bg-[#edebe6]/[0.07] border border-white/[0.08]
                    text-[#edebe6] text-sm font-medium
                    hover:bg-[#edebe6]/[0.12] active:scale-[0.98]
                    transition-all duration-150"
                >
                  继续上次 →
                </button>
                <button
                  onClick={handleRestart}
                  className="w-full py-3 rounded-xl
                    text-[#4a4845] text-sm
                    hover:text-[#8a8680] active:scale-[0.98]
                    transition-all duration-150"
                >
                  重新开始
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 顶部栏 */}
      <header className="flex-shrink-0 px-4 pt-5 pb-3 border-b border-white/[0.05]">
        <div className="max-w-xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              disabled={state.currentStep === 0}
              className="flex items-center gap-1.5 text-[#8a8680] hover:text-[#edebe6]
                disabled:opacity-20 disabled:cursor-not-allowed text-sm transition-colors
                px-2 py-1 rounded-lg hover:bg-white/[0.05]"
            >
              <ArrowLeft size={15} />
              上一题
            </button>
            <span className="text-[#4a4845] text-xs tabular-nums">
              {Math.min(state.currentStep + 1, questionIds.length)} / {questionIds.length}
            </span>
          </div>

          {/* 极简进度条 — 单色细线 */}
          <div className="h-px bg-white/[0.06] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[#edebe6]/50 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.35, ease: 'easeInOut' }}
            />
          </div>
        </div>
      </header>

      {/* 对话区 */}
      <div className="flex-1 overflow-y-auto px-4 py-5">
        <div className="max-w-xl mx-auto flex flex-col gap-4">

          {/* ARIA 开场白：两条气泡，错落出现 */}
          <ChatBubble
            role="aria"
            content="你好，我是 ARIA——你的 AI 职业风险分析师。"
            animate={state.currentStep === 0}
            delay={0}
          />
          <ChatBubble
            role="aria"
            content="接下来大约 3 分钟，我会从行业、任务结构、组织位置、公司动向、个人护城河和适应能力六个维度分析你的处境，然后告诉你真正需要关注什么。"
            animate={state.currentStep === 0}
            delay={state.currentStep === 0 ? 0.65 : 0}
          />

          {/* 已回答 */}
          {questions.slice(0, state.currentStep).map((q, i) => {
            const ans = state.answers[q.id];
            let userLabel = ans === '' || ans === undefined ? '（跳过）' : String(ans);
            if (q.type === 'single' && q.options) {
              const opt = q.options.find((o) => o.value === ans);
              if (opt) userLabel = `${opt.emoji ?? ''} ${opt.label}`.trim();
            }
            if (q.type === 'allocation' && typeof ans === 'string' && ans) {
              try {
                const alloc: Record<string, number> = JSON.parse(ans);
                const labelMap: Record<string, string> = {
                  repeat: '重复流程', social: '沟通协调', creative: '创意内容', judgment: '复杂判断',
                };
                userLabel = Object.entries(alloc)
                  .filter(([, v]) => v > 0)
                  .map(([k, v]) => `${labelMap[k] ?? k} ${v}%`)
                  .join(' · ');
              } catch { /* ignore */ }
            }
            return (
              <div key={q.id} className="flex flex-col gap-2">
                <ChatBubble role="aria" content={q.ariaMessage} animate={i === state.currentStep - 1} />
                {ans !== undefined && ans !== '' && (
                  <ChatBubble role="user" content={userLabel} animate={i === state.currentStep - 1} />
                )}
                {ans === '' && q.isOptional && (
                  <ChatBubble role="user" content="（已跳过）" animate={i === state.currentStep - 1} />
                )}
              </div>
            );
          })}

          {/* 当前问题 */}
          {currentQuestion && !isFinished && (
            <div className="flex flex-col gap-4">
              <ChatBubble
                role="aria"
                content={currentQuestion.ariaMessage}
                animate
                delay={state.currentStep === 0 ? 1.35 : 0}
              />
              <div className="ml-9">
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22, delay: state.currentStep === 0 ? 1.55 : 0 }}
                >
                  <QuestionCard
                    question={currentQuestion}
                    currentAnswer={state.answers[currentQuestion.id]}
                    answers={state.answers}
                    onAnswer={handleAnswer}
                    onSkip={currentQuestion.isOptional ? handleSkip : undefined}
                  />
                </motion.div>
              </div>
            </div>
          )}

          {/* 完成过渡 */}
          {isFinished && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center gap-3 py-10 text-center"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                className="w-7 h-7 opacity-40"
              >
                <svg viewBox="0 0 28 28" fill="none">
                  <circle cx="14" cy="14" r="12" stroke="#edebe6" strokeWidth="1" />
                  <polygon points="14,5 23,14 14,23 5,14" stroke="#edebe6" strokeWidth="1" fill="none" />
                  <circle cx="14" cy="14" r="2" fill="#edebe6" />
                </svg>
              </motion.div>
              <p className="text-[#4a4845] text-sm">正在分析你的风险画像……</p>
            </motion.div>
          )}

          <div ref={chatEndRef} className="h-6" />
        </div>
      </div>

      {/* 底部渐变遮罩 */}
      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-16
        bg-gradient-to-t from-[#111110] to-transparent" />
    </div>
  );
}
