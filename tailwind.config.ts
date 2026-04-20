import type { Config } from "tailwindcss"

const config = {
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
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        /** Design System palette */
        brand: {
          /* Primary - purple/indigo */
          primary: '#5952e5',
          "primary-foreground": '#ffffff',
          heading: '#0A0A0F',
          body: '#4B5563',
          /* Accent - purple variants (#5952e5 family) */
          accent: '#5952e5',
          "accent-foreground": '#ffffff',
          "accent-50": '#F3F3FD',
          "accent-100": '#E7E6FB',
          "accent-200": '#D0CDF8',
          "accent-300": '#B8B4F4',
          "accent-400": '#A09CF0',
          "accent-500": '#8883EC',
          "accent-600": '#716AE9',
          "accent-700": '#5952e5',
          "accent-800": '#3B3699',
          "accent-900": '#1E1B4C',
          "accent-950": '#0F0E26',
          "accent-subtle": 'rgba(89, 82, 229, 0.1)', /* Light primary bg */
          "accent-pastel": 'rgba(89, 82, 229, 0.15)', /* Pastel primary bg */
          /* Semantic */
          success: '#059669',       /* Positive Green */
          danger: '#d03238',       /* Danger Red */
          warning: '#ffd11a',      /* Warning Yellow */
          info: 'rgba(56,200,255,0.10)', /* Background Cyan */
          orange: '#ffc091',       /* Bright Orange */
          /* Neutrals */
          muted: '#454745',       /* Warm Dark - secondary text */
          "muted-secondary": '#868685', /* Gray - tertiary */
          surface: '#f5f5f7',     /* Light Surface */
          light: '#F3F3FD',    /* brand-primary-50 */
          gray: '#F9FAFB',
          border: '#E5E7EB',
          "primary-light": "rgba(89, 82, 229, 0.1)", /* Transparent purple for backgrounds */
          dark: "#1a1a2e",
        },
      },
      fontFamily: {
        sans: ["var(--font-plus-jakarta-sans)", "sans-serif"],
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
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [],
} satisfies Config

export default config
