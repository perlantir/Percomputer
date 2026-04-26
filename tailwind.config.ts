/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: "var(--bg-canvas)",
        surface: {
          DEFAULT: "var(--bg-surface)",
          2: "var(--bg-surface-2)",
          3: "var(--bg-surface-3)",
        },
        border: {
          subtle: "var(--border-subtle)",
          DEFAULT: "var(--border-default)",
        },
        foreground: {
          primary: "var(--text-primary)",
          secondary: "var(--text-secondary)",
          tertiary: "var(--text-tertiary)",
          inverse: "var(--text-inverse)",
        },
        accent: {
          primary: "var(--accent-primary)",
          "primary-hover": "var(--accent-primary-hover)",
          secondary: "var(--accent-secondary)",
          tertiary: "var(--accent-tertiary)",
        },
        success: "var(--success)",
        warning: "var(--warning)",
        danger: "var(--danger)",
        info: "var(--info)",
        syntax: {
          keyword: "var(--syntax-keyword)",
          string: "var(--syntax-string)",
          number: "var(--syntax-number)",
          comment: "var(--syntax-comment)",
          function: "var(--syntax-function)",
          operator: "var(--syntax-operator)",
          type: "var(--syntax-type)",
          variable: "var(--syntax-variable)",
          property: "var(--syntax-property)",
        },
      },
      fontFamily: {
        /* ── Display/Heading font ── */
        display: [
          '"FK Display"',                          /* Primary: brand display font */
          '"FK Display Fallback"',                 /* Size-adjusted fallback: minimizes CLS */
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',                           /* Cross-platform fallback */
          "sans-serif",
        ],
        /* ── Body/UI font ── */
        sans: [
          '"FK Grotesk Neue"',                     /* Primary: brand body font */
          '"FK Grotesk Fallback"',                 /* Size-adjusted fallback: minimizes CLS */
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',                           /* Cross-platform fallback */
          "sans-serif",
        ],
        body: [
          '"FK Grotesk Neue"',
          '"FK Grotesk Fallback"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
        ui: [
          '"FK Grotesk Neue"',
          '"FK Grotesk Fallback"',
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          '"Noto Sans"',
          "sans-serif",
        ],
        /* ── Monospace font ── */
        mono: [
          '"Berkeley Mono"',                       /* Primary: brand mono font */
          '"Berkeley Mono Fallback"',              /* Size-adjusted fallback: minimizes CLS */
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          '"Liberation Mono"',
          '"Courier New"',
          "monospace",
        ],
      },
      fontSize: {
        "2xs": ["0.625rem", { lineHeight: "0.875rem" }],
      },
      spacing: {
        18: "4.5rem",
        88: "22rem",
        128: "32rem",
      },
      borderRadius: {
        xs: "0.25rem",
        sm: "0.375rem",
        md: "0.5rem",
        lg: "0.75rem",
        xl: "1rem",
        "2xl": "1.25rem",
        "3xl": "1.5rem",
        pill: "9999px",
        full: "9999px",
      },
      boxShadow: {
        sm: "0 1px 2px 0 rgb(0 0 0 / 0.04)",
        DEFAULT: "0 1px 3px 0 rgb(0 0 0 / 0.06), 0 1px 2px -1px rgb(0 0 0 / 0.06)",
        md: "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)",
        lg: "0 10px 15px -3px rgb(0 0 0 / 0.05), 0 4px 6px -4px rgb(0 0 0 / 0.05)",
        xl: "0 20px 25px -5px rgb(0 0 0 / 0.05), 0 8px 10px -6px rgb(0 0 0 / 0.05)",
        "shadow-low": "0 1px 2px 0 rgb(0 0 0 / 0.04), 0 0 1px 0 rgb(0 0 0 / 0.02)",
        "shadow-medium": "0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05), 0 0 1px 0 rgb(0 0 0 / 0.02)",
        "shadow-high": "0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.06), 0 0 1px 0 rgb(0 0 0 / 0.02)",
        "glow": "var(--shadow-glow)",
        "glow-lg": "var(--shadow-glow-lg)",
        "glow-sm": "0 0 8px var(--accent-primary) / 0.25",
        "glow-md": "0 0 16px var(--accent-primary) / 0.20",
        "glow-lg": "0 0 32px var(--accent-primary) / 0.15",
        inset: "inset 0 2px 4px 0 rgb(0 0 0 / 0.04)",
        float: "0 8px 24px rgb(0 0 0 / 0.08)",
      },
      ringWidth: {
        3: "3px",
      },
      ringColor: {
        accent: "var(--accent-primary)",
      },
      ringOffsetColor: {
        canvas: "var(--bg-canvas)",
        surface: "var(--bg-surface)",
      },
      transitionTimingFunction: {
        "ease-out-expo": "cubic-bezier(0.16, 1, 0.3, 1)",
        "ease-in-out-quart": "cubic-bezier(0.76, 0, 0.24, 1)",
        "ease-out-quart": "cubic-bezier(0.25, 1, 0.5, 1)",
        "ease-in-quart": "cubic-bezier(0.5, 0, 0.75, 1)",
        "spring": "cubic-bezier(0.34, 1.56, 0.64, 1)",
      },
      transitionDuration: {
        "50": "50ms",
        "150": "150ms",
        "250": "250ms",
        "350": "350ms",
        "450": "450ms",
        "600": "600ms",
        "800": "800ms",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideIn: {
          "0%": { transform: "translateX(12px)", opacity: "0" },
          "100%": { transform: "translateX(0)", opacity: "1" },
        },
        slideUp: {
          "0%": { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        slideDown: {
          "0%": { transform: "translateY(-8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        pulseGlow: {
          "0%, 100%": { boxShadow: "0 0 8px var(--accent-primary) / 0.2" },
          "50%": { boxShadow: "0 0 16px var(--accent-primary) / 0.35" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        spinSlow: {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
        ping: {
          "75%, 100%": { transform: "scale(2)", opacity: "0" },
        },
        ripple: {
          "0%": { transform: "scale(0)", opacity: "0.35" },
          "100%": { transform: "scale(4)", opacity: "0" },
        },
      },
      animation: {
        "slide-in": "slideIn 250ms ease-out-expo forwards",
        "fade-in": "fadeIn 250ms ease-out-expo forwards",
        "slide-up": "slideUp 350ms ease-out-expo forwards",
        "slide-down": "slideDown 350ms ease-out-expo forwards",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite",
        "shimmer": "shimmer 2s linear infinite",
        "spin-slow": "spinSlow 3s linear infinite",
        "ping": "ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "ripple": "ripple 600ms ease-out-quart forwards",
      },
      cursor: {
        grab: "grab",
        grabbing: "grabbing",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
