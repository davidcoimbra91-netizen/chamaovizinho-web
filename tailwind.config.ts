import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange:       '#C85A1A',
          'orange-dark':'#A84A14',
          'orange-light':'#FBF0E8',
          cream:        '#FAF7F2',
          'cream-dark': '#F0E8DC',
          border:       '#EDE6DC',
          text:         '#2C1A0E',
          'text-mid':   '#7A6048',
          'text-light': '#9B7A5A',
          green:        '#3B6D11',
          'green-light':'#EAF3DE',
        },
      },
      fontFamily: {
        display: ['Lora', 'Georgia', 'serif'],
        body:    ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'fade-in': 'fadeIn 0.3s ease forwards',
        'float':   'float 3s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:  { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        float:   { '0%,100%': { transform: 'translateY(0)' }, '50%': { transform: 'translateY(-6px)' } },
      },
    },
  },
  plugins: [],
}
export default config
