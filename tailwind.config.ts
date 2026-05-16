import type { Config } from "tailwindcss";

const config: Config = {
  // Use attribute selector so ThemeProvider's data-theme="dark" drives dark: utilities
  darkMode: ["selector", '[data-theme="dark"]'],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1320px"
      }
    },
    extend: {
      borderRadius: {
        xl: "1rem",
        "2xl": "1.5rem",
        "3xl": "2rem"
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))"
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))"
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))"
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))"
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))"
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))"
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))"
        },
        // Semantic glass token aliases
        glass: {
          DEFAULT: "var(--glass-fill)",
          hover: "var(--glass-fill-hover)",
          border: "var(--glass-border)",
        },
        // Action tile accent colors (theme-aware via CSS vars)
        action: {
          flatmates: "var(--action-flatmates)",
          ai:        "var(--action-ai)",
          property:  "var(--action-property)",
          study:     "var(--action-study)",
        }
      },
      boxShadow: {
        glow: "0 18px 40px -24px rgba(15, 23, 42, 0.45)",
        card: "0 24px 60px -30px rgba(15, 23, 42, 0.35)",
        glass: "var(--glass-shadow)"
      },
      fontFamily: {
        display: ['"Playfair Display"', "serif"],
        sans: ['"Plus Jakarta Sans"', "system-ui", "sans-serif"]
      },
      backgroundImage: {
        "mesh-light":
          "radial-gradient(circle at top left, rgba(14,165,233,0.22), transparent 40%), radial-gradient(circle at top right, rgba(245,158,11,0.18), transparent 35%), linear-gradient(180deg, rgba(255,255,255,0.98), rgba(244,247,250,0.95))",
        "mesh-dark":
          "radial-gradient(circle at top left, rgba(34,197,94,0.15), transparent 38%), radial-gradient(circle at top right, rgba(59,130,246,0.2), transparent 32%), linear-gradient(180deg, rgba(2,6,23,0.98), rgba(15,23,42,0.96))"
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(14px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 0 rgba(14,165,233,0.3)" },
          "50%": { boxShadow: "0 0 24px rgba(14,165,233,0.4)" }
        },
        shimmer: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(100%)" }
        },
        "typing-dot": {
          "0%, 60%, 100%": { transform: "translateY(0)", opacity: "0.4" },
          "30%": { transform: "translateY(-4px)", opacity: "1" }
        }
      },
      animation: {
        "fade-up": "fade-up 0.45s ease-out",
        "pulse-glow": "pulse-glow 2.4s ease-in-out infinite",
        shimmer: "shimmer 1.6s ease-in-out infinite",
        "typing-dot": "typing-dot 1.4s ease-in-out infinite"
      }
    }
  },
  plugins: []
};

export default config;
