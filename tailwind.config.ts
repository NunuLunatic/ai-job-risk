import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bg:      '#111110',
        surf:    '#1a1917',
        t1:      '#edebe6',
        t2:      '#8a8680',
        t3:      '#4a4845',
        // 风险等级色（仅数据可视化用，不用于背景/装饰）
        'risk-safe':     '#4ade80',
        'risk-watch':    '#facc15',
        'risk-alert':    '#fb923c',
        'risk-danger':   '#f87171',
        'risk-critical': '#ef4444',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
