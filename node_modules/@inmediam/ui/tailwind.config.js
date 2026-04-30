/** @type {import('tailwindcss').Config} */
module.exports = function (app, options) {
  let config = {
    content: [
      `../../apps/${app}/src/index.html`,
      `../../apps/${app}/src/**/*.{ts,tsx,html,stories.tsx}`,
      '../../packages/*/src/**/*.{ts,tsx,html,stories.tsx}',
      '../../interface/**/*.{ts,tsx,html,stories.tsx}',

      './pages/**/*.{ts,tsx}',
      './components/**/*.{ts,tsx}',
      './app/**/*.{ts,tsx}',
      './src/**/*.{ts,tsx}',

      '../../pages/**/*.{ts,tsx}',
      '../../components/**/*.{ts,tsx}',
      '../../app/**/*.{ts,tsx}',
      '../../src/**/*.{ts,tsx}',

      'node_modules/@inmediam/ui/dist/**/*.js'
    ],
    darkMode: ['class'],
    theme: {
      screens: {
        xs: '475px',
        sm: '640px',
        md: '768px',
        lg: '1024px',
        xl: '1280px',
      },
      fontSize: {
        'tiny': '.65rem',
        'xs': '.75rem',
        'sm': '.875rem',
        'base': '1rem',
        'lg': '1.125rem',
        'xl': '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
        '6xl': '4rem',
        '7xl': '5rem'
      },
      container: {
        center: true,
        padding: "2rem",
        screens: {
          "2xl": "1400px",
        },
      },
      extend: {
        fontFamily: {
          sans: ['Inter', 'sans-serif']
        },
        lineHeight: {
          '4.5': '18px',
        },
        colors: {
          "gray-25": "hsl(var(--gray-25))",
          "gray-50": "hsl(var(--gray-50))",
          "gray-100": "hsl(var(--gray-100))",
          "gray-200": "hsl(var(--gray-200))",
          "gray-300": "hsl(var(--gray-300))",
          "gray-400": "hsl(var(--gray-400))",
          "gray-500": "hsl(var(--gray-500))",
          "gray-600": "hsl(var(--gray-600))",
          "gray-700": "hsl(var(--gray-700))",
          "gray-800": "hsl(var(--gray-800))",
          "gray-900": "hsl(var(--gray-900))",
          "gray-950": "hsl(var(--gray-950))",

          "brand-25": "hsl(var(--brand-25))",
          "brand-50": "hsl(var(--brand-50))",
          "brand-100": "hsl(var(--brand-100))",
          "brand-200": "hsl(var(--brand-200))",
          "brand-300": "hsl(var(--brand-300))",
          "brand-400": "hsl(var(--brand-400))",
          "brand-500": "hsl(var(--brand-500))",
          "brand-600": "hsl(var(--brand-600))",
          "brand-700": "hsl(var(--brand-700))",
          "brand-800": "hsl(var(--brand-800))",
          "brand-900": "hsl(var(--brand-900))",
          "brand-950": "hsl(var(--brand-950))",

          "error-25" : "hsl(var(--error-25))",
          "error-50": "hsl(var(--error-50))",
          "error-100": "hsl(var(--error-100))",
          "error-200": "hsl(var(--error-200))",
          "error-300": "hsl(var(--error-300))",
          "error-400": "hsl(var(--error-400))",
          "error-500": "hsl(var(--error-500))",
          "error-600": "hsl(var(--error-600))",
          "error-700": "hsl(var(--error-700))",
          "error-800": "hsl(var(--error-800))",
          "error-900": "hsl(var(--error-900))",
          "error-950": "hsl(var(--error-950))",

          "warning-25": "hsl(var(--warning-25))",
          "warning-50": "hsl(var(--warning-50))",
          "warning-100": "hsl(var(--warning-100))",
          "warning-200": "hsl(var(--warning-200))",
          "warning-300": "hsl(var(--warning-300))",
          "warning-400": "hsl(var(--warning-400))",
          "warning-500": "hsl(var(--warning-500))",
          "warning-600": "hsl(var(--warning-600))",
          "warning-700": "hsl(var(--warning-700))",
          "warning-800": "hsl(var(--warning-800))",
          "warning-900": "hsl(var(--warning-900))",
          "warning-950": "hsl(var(--warning-950))",

          "success-25": "hsl(var(--success-25))",
          "success-50": "hsl(var(--success-50))",
          "success-100": "hsl(var(--success-100))",
          "success-200": "hsl(var(--success-200))",
          "success-300": "hsl(var(--success-300))",
          "success-400": "hsl(var(--success-400))",
          "success-500": "hsl(var(--success-500))",
          "success-600": "hsl(var(--success-600))",
          "success-700": "hsl(var(--success-700))",
          "success-800": "hsl(var(--success-800))",
          "success-900": "hsl(var(--success-900))",
          "success-950": "hsl(var(--success-950))",

          "chart-1": "hsl(var(--chart-1))",
          "chart-2": "hsl(var(--chart-2))",
          "chart-3": "hsl(var(--chart-3))",
          "chart-4": "hsl(var(--chart-4))",
          "chart-5": "hsl(var(--chart-5))",

          "sidebar": "hsl(var(--sidebar))",
          "sidebar-background": "hsl(var(--sidebar-background))",
          "sidebar-foreground": "hsl(var(--sidebar-foreground))",
          "sidebar-border": "hsl(var(--sidebar-border))",
          "sidebar-ring": "hsl(var(--sidebar-ring))",
          "sidebar-primary": "hsl(var(--sidebar-primary))",
          "sidebar-primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          "sidebar-accent": "hsl(var(--sidebar-accent))",
          "sidebar-accent-foreground": "hsl(var(--sidebar-accent-foreground))",

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
    plugins: [require("tailwindcss-animate")]
  };
  return config;
};