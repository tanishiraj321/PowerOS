/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        palette: {
          pink: '#F6E2E9',
          ivory: '#FEFAF3',
          sage: '#B8CFB3',
          muted: '#84A282',
          dark: '#26352B',
          subtext: '#596D5F',
          border: '#DFE7DD',
          warm: '#FAF6EE',
          surface: '#FFFFFF',
          'sage-light': '#DCE8D8',
          'muted-dark': '#698767',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        soft: '0 2px 10px -2px rgba(38, 53, 43, 0.05), 0 1px 3px 0 rgba(38, 53, 43, 0.03)',
        'soft-md': '0 4px 16px -2px rgba(38, 53, 43, 0.08), 0 2px 6px -1px rgba(38, 53, 43, 0.04)',
      }
    },
  },
  plugins: [],
}
