export const colors = {
  // Sunset gradient (노을빛 그라데이션)
  sunset: {
    light: '#ffbe76',
    DEFAULT: '#ff9f43',
    dark: '#e67e22',
    from: 'from-orange-500',
    via: 'via-orange-300',
    to: 'to-amber-200',
    gradient: 'bg-gradient-to-r from-orange-500 via-orange-300 to-amber-200',
    shadow: {
      light: 'rgba(251,191,36,0.5)',
      medium: 'rgba(251,191,36,0.8)',
      dark: 'rgba(251,191,36,0.5)',
    }
  },
  
  // Tangerine gradient (귤빛 그라데이션)
  tangerine: {
    light: '#ffb142',
    DEFAULT: '#ff9f1a',
    dark: '#e67e00',
    from: 'from-amber-500/80',
    via: 'via-orange-400/80',
    to: 'to-amber-500/80',
    hover: {
      from: 'hover:from-amber-400/90',
      via: 'hover:via-orange-300/90',
      to: 'hover:to-amber-400/90'
    },
    gradient: 'bg-gradient-to-r from-amber-500/80 via-orange-400/80 to-amber-500/80',
    hoverGradient: 'hover:from-amber-400/90 hover:via-orange-300/90 hover:to-amber-400/90'
  },

  // Tailwind 설정에서 사용하기 쉽게 RGB 값도 제공
  tailwindColors: {
    sunset: {
      light: { r: 255, g: 190, b: 118 }, // #ffbe76
      DEFAULT: { r: 255, g: 159, b: 67 }, // #ff9f43
      dark: { r: 230, g: 126, b: 34 }, // #e67e22
    },
    tangerine: {
      light: { r: 255, g: 177, b: 66 }, // #ffb142
      DEFAULT: { r: 255, g: 159, b: 26 }, // #ff9f1a
      dark: { r: 230, g: 126, b: 0 }, // #e67e00
    }
  },

  // 쉽게 색상 추가 가능
  // 추가 색상을 여기에 정의하면 tailwind.config.js에 자동 적용
} 