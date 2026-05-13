/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class', '[data-theme="dark"]'],
  content: [
    './index.html',
    './App.tsx',
    './components/**/*.{ts,tsx}',
    './contexts/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './services/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
    './constants/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        'brand-primary': 'var(--brand-primary)',
        'product-primary': 'var(--product-primary)',
        'product-hover': 'var(--product-hover)',
        'product-glow': 'var(--product-glow)',
        'bg-base': 'var(--bg-base)',
        'text-high': 'var(--text-high)',
      },
      textColor: {
        product: 'var(--product-primary)',
      },
      backgroundColor: {
        product: 'var(--product-primary)',
      },
      borderColor: {
        product: 'var(--product-primary)',
      },
      textDecorationColor: {
        product: 'var(--product-primary)',
      },
    },
  },
};
