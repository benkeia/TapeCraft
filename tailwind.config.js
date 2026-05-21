/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        app: {
          darkest: '#141419',
          dark: '#1C1C24',
          panel: '#252530',
          primary: '#8B5CF6',
          primaryHover: '#7C3AED',
          text: '#E2E8F0',
          textMuted: '#94A3B8',
          border: '#334155'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
