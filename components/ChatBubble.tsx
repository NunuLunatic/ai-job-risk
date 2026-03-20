'use client';

import { motion } from 'framer-motion';

interface ChatBubbleProps {
  role: 'aria' | 'user';
  content: string;
  animate?: boolean;
  delay?: number;
}

// ARIA 极简几何标记 — 细线圆 + 内切菱形 + 中心点，单色无发光
function AriaIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="12" stroke="#edebe6" strokeWidth="1" />
      <polygon points="14,5 23,14 14,23 5,14" stroke="#edebe6" strokeWidth="1" fill="none" />
      <circle cx="14" cy="14" r="2" fill="#edebe6" />
    </svg>
  );
}

export default function ChatBubble({ role, content, animate = true, delay = 0 }: ChatBubbleProps) {
  const isAria = role === 'aria';

  return (
    <motion.div
      className={`flex items-end gap-2.5 ${isAria ? 'justify-start' : 'justify-end'}`}
      initial={animate ? { opacity: 0, y: 10 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1], delay }}
    >
      {isAria && (
        <div className="flex-shrink-0 w-7 h-7 flex items-center justify-center opacity-60">
          <AriaIcon />
        </div>
      )}

      <div
        className={`
          max-w-[82%] px-4 py-3 text-sm leading-relaxed rounded-2xl
          ${isAria
            ? 'rounded-bl-sm bg-[#1c1b19] border border-white/[0.07] text-[#edebe6]'
            : 'rounded-br-sm bg-[#252320] border border-white/[0.07] text-[#edebe6]'
          }
        `}
      >
        <p className="whitespace-pre-wrap">{content}</p>
      </div>

      {!isAria && (
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-[#252320] border border-white/[0.07] flex items-center justify-center text-[10px] text-[#8a8680]">
          你
        </div>
      )}
    </motion.div>
  );
}
