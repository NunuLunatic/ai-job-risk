import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: 'AI 替代风险测评 | ARIA',
  description:
    '3 分钟，17 个问题，基于真实风险模型的 AI 岗位替代评估。由 ARIA（AI Risk Intelligence Advisor）驱动。',
  keywords: ['AI', '替代风险', '职业测评', '人工智能', '岗位安全'],
  authors: [{ name: 'ARIA' }],
  openGraph: {
    title: '你的工作，AI 几年后会替代你？',
    description: '3 分钟，17 个问题，给你一个诚实的答案。',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  themeColor: '#0a0f1e',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN" className={inter.variable}>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
