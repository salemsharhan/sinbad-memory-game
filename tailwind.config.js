/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dyslexia-friendly color palette
        cream: {
          50: '#FFFEF9',
          100: '#FFF9E6',
          200: '#FFF4CC',
          300: '#FFEFB3',
          400: '#FFE999',
          500: '#FFE480', // Main background
          600: '#E6CE73',
          700: '#CCB866',
          800: '#B3A159',
          900: '#998B4D',
        },
        beige: {
          50: '#FAF8F3',
          100: '#F5F1E7',
          200: '#EBE3CF',
          300: '#E0D5B7',
          400: '#D6C79F',
          500: '#CCB987', // Secondary background
          600: '#B8A679',
          700: '#A3936B',
          800: '#8F805D',
          900: '#7A6D4F',
        },
        primary: {
          50: '#E6F3FF',
          100: '#CCE7FF',
          200: '#99CFFF',
          300: '#66B7FF',
          400: '#339FFF',
          500: '#0087FF', // Main interactive color
          600: '#006CE6',
          700: '#0051CC',
          800: '#0036B3',
          900: '#001B99',
        },
        success: {
          50: '#E6F9F0',
          100: '#CCF3E1',
          200: '#99E7C3',
          300: '#66DBA5',
          400: '#33CF87',
          500: '#00C369', // Success green
          600: '#00A85C',
          700: '#008D4F',
          800: '#007242',
          900: '#005735',
        },
        error: {
          50: '#FFE6E6',
          100: '#FFCCCC',
          200: '#FF9999',
          300: '#FF6666',
          400: '#FF3333',
          500: '#FF0000', // Error red
          600: '#E60000',
          700: '#CC0000',
          800: '#B30000',
          900: '#990000',
        },
      },
      fontFamily: {
        arabic: ['Cairo', 'sans-serif'],
        sans: ['Cairo', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        // Larger font sizes for dyslexia-friendly reading
        'child-sm': ['1.125rem', { lineHeight: '1.75rem' }], // 18px
        'child-base': ['1.25rem', { lineHeight: '1.875rem' }], // 20px
        'child-lg': ['1.5rem', { lineHeight: '2.25rem' }], // 24px
        'child-xl': ['1.875rem', { lineHeight: '2.5rem' }], // 30px
        'child-2xl': ['2.25rem', { lineHeight: '3rem' }], // 36px
        'child-3xl': ['3rem', { lineHeight: '3.75rem' }], // 48px
      },
      spacing: {
        // Extra spacing for better readability
        '18': '4.5rem',
        '22': '5.5rem',
        '26': '6.5rem',
        '30': '7.5rem',
      },
      borderRadius: {
        'child': '1rem', // Friendly rounded corners
        'child-lg': '1.5rem',
        'child-xl': '2rem',
      },
      boxShadow: {
        'child': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'child-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'child-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      },
    },
  },
  plugins: [],
}
