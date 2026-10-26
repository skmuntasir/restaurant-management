/** @type {import('tailwindcss').Config} */
// Theme tokens live in src/index.css as RGB triplets so Tailwind opacity
// modifiers (bg-tint/5, text-ink/60 …) keep working in both dark and light mode.
const v = (name) => `rgb(var(--c-${name}) / <alpha-value>)`;

module.exports = {
  darkMode: ['selector', '[data-theme="dark"]'],
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['Inter', 'system-ui', '-apple-system', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        glow: '0 1px 2px rgba(15,23,42,0.12)',
        card: '0 1px 2px rgba(15,23,42,0.08)',
      },
      colors: {
        page: v('page'),
        canvas: v('canvas'),
        surface: v('surface'),
        'surface-2': v('surface-2'),
        ink: v('ink'),
        'ink-2': v('ink-2'),
        'ink-3': v('ink-3'),
        'ink-4': v('ink-4'),
        tint: v('tint'),
        shade: v('shade'),
        accent: v('accent'),
        'accent-soft': v('accent-soft'),
        brand: {
          DEFAULT: "#F6B100",
          soft: "#FFD25E",
          deep: "#C98F00",
        },
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
        kenburns: {
          "0%": { transform: "scale(1.05) translate3d(0,0,0)" },
          "100%": { transform: "scale(1.15) translate3d(-1.5%, -1%, 0)" },
        },
        floaty: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.25)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        shake: "shake 0.4s ease-in-out",
        shimmer: "shimmer 1.4s linear infinite",
        kenburns: "none",
        floaty: "none",
        pop: "pop 0.3s ease-out",
      },
    },
  },
  plugins: [
    require('tailwind-scrollbar-hide')
  ],
};
