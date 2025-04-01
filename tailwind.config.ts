import type { Config } from "tailwindcss";
import { fontFamily } from "tailwindcss/defaultTheme";
import { colors } from "./shared/lib/colors";

export default {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./widgets/**/*.{js,ts,jsx,tsx,mdx}",
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
      fontFamily: {
        sans: ["var(--font-inter)", ...fontFamily.sans],
        display: ["var(--font-outfit)", ...fontFamily.sans],
        mono: ["var(--font-montserrat)", ...fontFamily.mono],
        heading: ["var(--font-poppins)", ...fontFamily.sans],
        body: ["var(--font-noto-sans)", ...fontFamily.sans],
        oswald: "var(--font-oswald)",
        roboto: "var(--font-roboto)",
        notoSansKR: "var(--font-notoSansKR)"
      },
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
        // colors.ts에서 정의한 색상 사용
        sunset: {
          light: colors.sunset.light,
          DEFAULT: colors.sunset.DEFAULT,
          dark: colors.sunset.dark
        },
        tangerine: {
          light: colors.tangerine.light,
          DEFAULT: colors.tangerine.DEFAULT,
          dark: colors.tangerine.dark
        }
      },
      margin: {
        tomato: '120px'
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        sexyName: '11.11px'
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
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
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "fade-out": {
          "0%": { opacity: "1" },
          "100%": { opacity: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-in-out",
        "fade-out": "fade-out 0.3s ease-in-out",
      },
    },
  },
  plugins: [
    require("tailwindcss-animate"),
    require('@tailwindcss/forms'),
    require('daisyui'),
  ],
} satisfies Config;


// ailwindcss/forms
// 유틸리티를 사용하여 form 요소를 쉽게 재정의할 수 있도록 form 스타일에 대한 기본 reset을 제공하는 플러그인입니다.
// npm install -D @tailwindcss/forms
// https://github.com/tailwindlabs/tailwindcss-forms

// tailwindcss/forms 테스트
// https://tailwindcss-forms.vercel.app

// Official plugins
// 플러그인은 npm을 통해 설치한 후 tailwind.config.js 파일에 추가하여 프로젝트에 추가할 수 있습니다.
// https://tailwindcss.com/docs/plugins#official-plugins

// daisyUI
// Tailwind CSS용 가장 인기있는 컴포넌트 라이브러리
// npm i -D daisyui@latest
// https://daisyui.com