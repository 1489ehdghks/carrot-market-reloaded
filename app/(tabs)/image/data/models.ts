// 이미지 생성 모델 정보
export interface AIModel {
  id: string;
  name: string;
  description: string;
  features: string[];
  vae: string;
  category: 'All' | '2D' | 'realistic';
  apiModel: string;
  nsfw: boolean;
  safety_tolerance?: number;
}

// VAE 옵션 정의
export const VAE_OPTIONS = [
  { id: 'default', name: 'Default VAE', description: '기본 VAE 설정' },
  { id: 'sdxl-vae-fp16-fix', name: 'SDXL VAE FP16', description: 'SDXL 모델용 최적화된 VAE' },
  { id: 'Pony-Realism-v2.2', name: 'Pony Realism v2.2', description: '포니 리얼리즘용 특화 VAE' }
];

export const AI_MODELS: AIModel[] = [
  {
    id: "stable-diffusion",
    name: "Stable Diffusion",
    description: "범용 이미지 생성에 적합한 기본 모델입니다.",
    features: ["균형잡힌 품질", "다양한 주제 지원", "빠른 생성 속도"],
    category: "realistic",
    apiModel: "stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478",
    vae: "sdxl-vae-fp16-fix",
    nsfw: true
  },
  {
    id: "sdxl",
    name: "SDXL",
    description: "최고 품질의 이미지를 생성하는 대형 모델입니다.",
    features: ["고품질 이미지", "풍부한 디테일", "정확한 프롬프트 반영"],
    category: "realistic",
    apiModel: "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
    vae: "sdxl-vae-fp16-fix",
    nsfw: false
  },
  {
    id: "flux-schnell",
    name: "flux-schnell",
    description: "flux-schnell",
    features: ["사진같은 품질", "인물 표현 우수", "현실적인 질감"],
    category: "All",
    apiModel: "black-forest-labs/flux-schnell",
    vae: "sdxl-vae-fp16-fix",
    safety_tolerance: 1,
    nsfw: false
  },
  {
    id: "flux-1.1-pro",
    name: "flux-1.1-pro",
    description: "flux-schnell",
    features: ["사진같은 품질", "인물 표현 우수", "현실적인 질감"],
    category: "All",
    apiModel: "black-forest-labs/flux-1.1-pro",
    vae: "sdxl-vae-fp16-fix",
    safety_tolerance: 1,
    nsfw: false
  },
  {
    id: "dreamshaper",
    name: "Dreamshaper",
    description: "창의적이고 예술적인 이미지를 생성합니다.",
    features: ["환상적인 분위기", "독특한 스타일", "상상력 자극"],
    category: "2D",
    apiModel: "lykon/dreamshaper-xl-turbo:3af9fa2d72419dd2404091041d5459404421cf0cd93e3936eeef8c03a6e20348",
    vae: "sdxl-vae-fp16-fix",
    nsfw: false
  },
  {
    id: "anime-model",
    name: "Animagine XL",
    description: "애니메이션 및 일러스트 스타일 특화 모델입니다.",
    features: ["애니메이션 스타일", "만화/일러스트 특화", "생동감 있는 캐릭터"],
    category: "2D",
    apiModel: "cjwbw/animagine-xl:3b5dc49e673e3027d1179a0cb71f2e5fc3a1bc649922a0316c88a4ab59a9fbc2",
    vae: "sdxl-vae-fp16-fix",
    nsfw: false
  },
  {
    id: "ponyRealism21",
    name: "pony Realism",
    description: "포니 모델을 사용한 x.",
    features: ["스타일라이즈된 캐릭터", "다양한 스타일 믹스", "고채도 색감"],
    category: "realistic",
    apiModel: "charlesmccarthy/pony-sdxl:b070dedae81324788c3c933a5d9e1270093dc74636214b9815dae044b4b3a58a",
    vae: "sdxl-vae-fp16-fix",
    nsfw: true
  },
  {
    id: "imagen-3",
    name: "imagen-3",
    description: "구글에서 제작, 0.05 per image ",
    features: ["스타일라이즈된 캐릭터", "다양한 스타일 믹스", "고채도 색감"],
    category: "realistic",
    apiModel: "google/imagen-3",
    vae: "sdxl-vae-fp16-fix",
    nsfw: false
  }
];

// 카테고리 이름
export const CATEGORY_NAMES = {
  '2D': '2D',
  'realistic': 'realistic',
  'All': 'All'
}; 