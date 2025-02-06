import type { Config } from "tailwindcss";

export default {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend:{
      fontFamily:{
        oswald:'var(--font-oswald)',
        roboto:'var(--font-roboto)',
        notoSansKR:'var(--font-notoSansKR)'
      },
      margin:{
        tomato:'120px'
      },
      borderRadius:{
        sexyName:'11.11px'
      },
    }
  },
  plugins: [
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