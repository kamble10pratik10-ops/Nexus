/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#020617', // slate-950
        card: '#0f172a',       // slate-900
        primary: '#2563EB',
        accent: '#059669',
        danger: '#E11D48'
      }
    },
  },
  plugins: [],
}
