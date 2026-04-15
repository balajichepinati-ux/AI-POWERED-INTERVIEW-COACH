/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'monospace'],
      },
      colors: {
        brand: {
          50:  '#e4f0ff',
          100: '#bee3ff',
          200: '#90d1ff',
          300: '#61bbff',
          400: '#40a9ff',
          500: '#4F9DFF', // Neon blue
          600: '#2b7ce6',
          700: '#1b5ec2',
          800: '#114499',
          900: '#0a2e70',
        },
        accent: {
          cyan:   '#22d3ee',
          violet: '#8A5CFF', // Purple glow
          green:  '#34d399',
          amber:  '#fbbf24',
          rose:   '#f87171',
        },
        dark: {
          900: '#0B0F1A', // Dark base
          800: '#111726',
          700: '#181f33',
          600: '#1f2840',
          500: '#2a3552',
          400: '#38466b',
          300: '#475885',
        }
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(79, 157, 255, 0.4), transparent)',
        'hero-glow-purple': 'radial-gradient(ellipse 60% 60% at 50% 120%, rgba(138, 92, 255, 0.3), transparent)',
        'card-glow': 'linear-gradient(135deg, rgba(79, 157, 255, 0.1) 0%, rgba(138, 92, 255, 0.08) 100%)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
        'pulse-ring': 'pulseRing 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'shimmer': 'shimmer 2.5s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'float-slow': 'float 8s ease-in-out infinite',
        'float-fast': 'float 4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(30px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseRing: { '0%, 100%': { transform: 'scale(1)', opacity: 1 }, '50%': { transform: 'scale(1.05)', opacity: 0.8 } },
        shimmer: { from: { backgroundPosition: '-200% center' }, to: { backgroundPosition: '200% center' } },
        float: { '0%, 100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-15px)' } }
      },
      boxShadow: {
        'glow': '0 0 30px rgba(79, 157, 255, 0.5)',
        'glow-sm': '0 0 15px rgba(79, 157, 255, 0.3)',
        'glow-purple': '0 0 30px rgba(138, 92, 255, 0.5)',
        'card': '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        'card-hover': '0 12px 48px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.15)',
      }
    },
  },
  plugins: [],
}
