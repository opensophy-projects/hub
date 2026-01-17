export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        veilstack: ['UnifixSP', 'system-ui', 'sans-serif'],
      },
      animation: {
        marquee: 'marquee var(--duration) linear infinite',
        'marquee-vertical': 'marquee-vertical var(--duration) linear infinite',
        scroll: 'scroll var(--animation-duration, 40s) var(--animation-direction, forwards) linear infinite',
      },
      keyframes: {
        marquee: {
          to: { transform: 'translateX(calc(-100% - var(--gap)))' },
        },
        'marquee-vertical': {
          to: { transform: 'translateY(calc(-100% - var(--gap)))' },
        },
        scroll: {
          to: { transform: 'translate(calc(-50% - 0.5rem))' },
        },
      },
      maxHeight: {
        96: '24rem',
      },
    },
  },
  plugins: [],
};
