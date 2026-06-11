import type { Config } from "tailwindcss";

/**
 * Every color resolves to an HSL CSS variable so the whole palette is themeable
 * from globals.css (light on :root, dark on .dark). Opacity modifiers like
 * `bg-primary/20` work because we wrap each token in `hsl(var(--token) / <alpha>)`.
 */
const withAlpha = (variable: string) => `hsl(var(--${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
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
        border: withAlpha("border"),
        input: withAlpha("input"),
        ring: withAlpha("ring"),
        background: withAlpha("background"),
        foreground: withAlpha("foreground"),
        primary: {
          DEFAULT: withAlpha("primary"),
          foreground: withAlpha("primary-foreground"),
        },
        secondary: {
          DEFAULT: withAlpha("secondary"),
          foreground: withAlpha("secondary-foreground"),
        },
        destructive: {
          DEFAULT: withAlpha("destructive"),
          foreground: withAlpha("destructive-foreground"),
        },
        success: {
          DEFAULT: withAlpha("success"),
          foreground: withAlpha("success-foreground"),
        },
        warning: {
          DEFAULT: withAlpha("warning"),
          foreground: withAlpha("warning-foreground"),
        },
        info: {
          DEFAULT: withAlpha("info"),
          foreground: withAlpha("info-foreground"),
        },
        muted: {
          DEFAULT: withAlpha("muted"),
          foreground: withAlpha("muted-foreground"),
        },
        accent: {
          DEFAULT: withAlpha("accent"),
          foreground: withAlpha("accent-foreground"),
        },
        popover: {
          DEFAULT: withAlpha("popover"),
          foreground: withAlpha("popover-foreground"),
        },
        card: {
          DEFAULT: withAlpha("card"),
          foreground: withAlpha("card-foreground"),
        },
        sidebar: {
          DEFAULT: withAlpha("sidebar"),
          foreground: withAlpha("sidebar-foreground"),
          accent: withAlpha("sidebar-accent"),
          "accent-foreground": withAlpha("sidebar-accent-foreground"),
          border: withAlpha("sidebar-border"),
        },
        chart: {
          1: withAlpha("chart-1"),
          2: withAlpha("chart-2"),
          3: withAlpha("chart-3"),
          4: withAlpha("chart-4"),
          5: withAlpha("chart-5"),
        },
        // Raw Tailwind slate + indigo remain available for legacy screens still
        // being migrated to semantic tokens.
        slate: require("tailwindcss/colors").slate,
        indigo: require("tailwindcss/colors").indigo,
      },
      borderRadius: {
        xl: "calc(var(--radius) + 4px)",
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "var(--font-inter)", "system-ui", "sans-serif"],
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
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.96)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.4s ease forwards",
        "fade-up": "fade-up 0.5s cubic-bezier(0.22,1,0.36,1) forwards",
        "scale-in": "scale-in 0.25s cubic-bezier(0.22,1,0.36,1) forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate"), require("@tailwindcss/typography")],
};

export default config;
