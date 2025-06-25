/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Claude.ai specific colors
        claude: {
          // Warm beige backgrounds
          cream: '#f0eee5',
          'cream-light': '#f8f6f1',
          'cream-dark': '#e8e5dc',
          
          // Orange accent colors (primary)
          orange: '#cd6f47',
          'orange-light': '#d88e6f',
          'orange-dark': '#b05730',
          'orange-darker': '#884325',
          
          // Purple accent colors (secondary)
          purple: '#6c5dac',
          'purple-light': '#8a7fbd',
          'purple-dark': '#55498d',
          
          // Neutral colors
          'gray-50': '#ffffff',
          'gray-100': '#f3f4f6',
          'gray-200': '#e5e7eb',
          'gray-300': '#d1d5db',
          'gray-400': '#9ca3af',
          'gray-500': '#6b7280',
          'gray-600': '#4b5563',
          'gray-700': '#374151',
          'gray-800': '#1f2937',
          'gray-900': '#111827',
          
          // Code colors
          'code-bg': '#131210',
          'code-fg': '#b8af84',
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slide-in": {
          from: { transform: "translateX(-100%)" },
          to: { transform: "translateX(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 5px hsla(var(--primary) / 0.5)" },
          "50%": { boxShadow: "0 0 20px hsla(var(--primary) / 0.8)" },
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.5s ease-out",
        "slide-in": "slide-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
      fontFamily: {
        'claude': ['Inter', 'system-ui', 'sans-serif'],
        'claude-mono': ['JetBrains Mono', 'Fira Code', 'Consolas', 'monospace'],
      },
      fontSize: {
        'claude-xs': ['0.75rem', { lineHeight: '1rem' }],
        'claude-sm': ['0.875rem', { lineHeight: '1.25rem' }],
        'claude-base': ['1rem', { lineHeight: '1.5rem' }],
        'claude-lg': ['1.125rem', { lineHeight: '1.75rem' }],
        'claude-xl': ['1.25rem', { lineHeight: '1.75rem' }],
        'claude-2xl': ['1.5rem', { lineHeight: '2rem' }],
        'claude-3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        'claude-4xl': ['2.25rem', { lineHeight: '2.5rem' }],
      },
      spacing: {
        'claude-xs': '0.5rem',
        'claude-sm': '0.75rem',
        'claude-md': '1rem',
        'claude-lg': '1.5rem',
        'claude-xl': '2rem',
        'claude-2xl': '3rem',
      },
      boxShadow: {
        'claude-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
        'claude-md': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'claude-lg': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'claude-xl': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        'claude-glow': '0 0 20px hsla(var(--primary) / 0.3)',
      }
    },
  },
  plugins: [require("tailwindcss-animate")],
} 