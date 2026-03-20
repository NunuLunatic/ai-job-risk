'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function AriaLogo() {
  return (
    <svg width="40" height="40" viewBox="0 0 52 52" fill="none">
      <circle cx="26" cy="26" r="23" stroke="#edebe6" strokeWidth="0.8" />
      <polygon points="26,8 43,26 26,44 9,26" stroke="#edebe6" strokeWidth="0.8" fill="none" />
      <circle cx="26" cy="26" r="2.8" fill="#edebe6" />
    </svg>
  );
}

const stagger = {
  hidden:  { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};
const item = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.4, 0, 0.2, 1] } },
};

export default function HomePage() {
  const router = useRouter();

  return (
    <main className="min-h-screen bg-[#111110] flex flex-col items-center justify-center px-6 py-16">
      <motion.div
        className="flex flex-col items-center text-center max-w-[320px] w-full"
        variants={stagger}
        initial="hidden"
        animate="visible"
      >

        {/* ARIA icon */}
        <motion.div variants={item} className="opacity-40 mb-10">
          <AriaLogo />
        </motion.div>

        {/* 主标题 */}
        <motion.div variants={item} className="mb-3">
          <h1 className="text-[2.2rem] sm:text-[2.5rem] font-semibold text-[#edebe6] leading-[1.15] tracking-[-0.02em]">
            你的工作<br />多久会被 AI 替代
          </h1>
        </motion.div>

        {/* 副标题 */}
        <motion.div variants={item} className="mb-10">
          <p className="text-[#4a4845] text-sm leading-relaxed">
            3 分钟 · 17 题 · 给你一个诚实的答案
          </p>
        </motion.div>

        {/* 分隔线 */}
        <motion.div variants={item} className="w-full h-px bg-white/[0.05] mb-8" />

        {/* 利益点 */}
        <motion.div variants={item} className="w-full flex flex-col gap-3 mb-10 text-left">
          {[
            { head: '综合风险评分', body: '0–100 分，五个风险等级' },
            { head: '六维度拆解', body: '告诉你每个维度的打分依据' },
            { head: '焦虑 vs 现实', body: '客观风险和你的主观感受对比' },
          ].map((t) => (
            <div key={t.head} className="flex items-baseline gap-2.5">
              <span className="text-[#3a3835] text-xs flex-shrink-0">—</span>
              <p className="text-xs leading-relaxed">
                <span className="text-[#8a8680]">{t.head}</span>
                <span className="text-[#3a3835]">　{t.body}</span>
              </p>
            </div>
          ))}
        </motion.div>

        {/* CTA */}
        <motion.div variants={item} className="w-full flex flex-col items-center gap-2.5 mb-8">
          <button
            onClick={() => router.push('/quiz')}
            className="w-full py-3.5 rounded-xl border border-[#edebe6]/18
              bg-[#edebe6]/[0.04] text-[#edebe6] text-sm font-medium tracking-wide
              hover:bg-[#edebe6]/[0.08] hover:border-[#edebe6]/28
              transition-all duration-200 active:scale-[0.98]"
          >
            开始测一测 →
          </button>
          <p className="text-[#2e2c2a] text-[10px] tracking-wide">
            结果立即显示 · 不收集个人信息
          </p>
        </motion.div>

        {/* 底部背书 */}
        <motion.div variants={item}>
          <p className="text-[#282624] text-[9px] tracking-wider uppercase">
            Oxford · WEF · McKinsey
          </p>
        </motion.div>

      </motion.div>
    </main>
  );
}
