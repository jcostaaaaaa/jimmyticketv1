/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: ['var(--font-inter)'],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#FFA500", // Orange accent
          50: "#FFF8E6",
          100: "#FFECC6",
          200: "#FFD88A",
          300: "#FFC14D",
          400: "#FFAF1A",
          500: "#FFA500",
          600: "#CC8400",
          700: "#996300",
          800: "#664200",
          900: "#332100",
          950: "#1A1100",
        },
        secondary: {
          DEFAULT: "#2B2B2B", // Medium Charcoal/Grey
          50: "#E0E0E0",
          100: "#C2C2C2",
          200: "#A0A0A0", 
          300: "#7E7E7E",
          400: "#5C5C5C",
          500: "#3C3C3C",
          600: "#2B2B2B",
          700: "#1A1A1A",
          800: "#0D0D0D",
          900: "#000000",
          950: "#000000",
        },
        accent: {
          DEFAULT: "#FFA500", // Orange accent (same as primary)
          50: "#FFF8E6",
          100: "#FFECC6",
          200: "#FFD88A",
          300: "#FFC14D",
          400: "#FFAF1A",
          500: "#FFA500",
          600: "#CC8400",
          700: "#996300",
          800: "#664200",
          900: "#332100",
          950: "#1A1100",
        },
        info: {
          DEFAULT: "#3b82f6", // blue-500
          foreground: "#ffffff",
        },
        success: {
          DEFAULT: "#22c55e", // green-500
          foreground: "#ffffff",
        },
        warning: {
          DEFAULT: "#f59e0b", // amber-500
          foreground: "#ffffff",
        },
        error: {
          DEFAULT: "#ef4444", // red-500
          foreground: "#ffffff",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}; 