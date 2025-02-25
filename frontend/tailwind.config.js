/** @type {import('tailwindcss').Config} */
export default {
  content: [ "./index.html", "./src/**/*.{js,ts,jsx,tsx}" ],
  theme: {
    extend: {
      fontFamily: {
        quicksand: ['Quicksand', 'sans-serif'],
        majormono: ['Major Mono Display', 'monospace'],
        jersey: ['Jersey', 'sans-serif'],
        raleway: ['Raleway', 'sans-serif']
      },

      animation: {
        'swipe': 'swipe 30000ms linear infinite',
      },
      
      keyframes: {
        'swipe': {
          '0%': {transform: 'translateX(0)'},
          '100%': {transform: 'translateX(-100%)'}
        }
      }
    },
  },
  plugins: [],
}

