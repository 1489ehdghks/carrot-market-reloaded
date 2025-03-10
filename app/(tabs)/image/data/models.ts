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
  isDefault?: boolean;
  price?: string; // 이미지 생성당 가격 정보
  
  // 모델 기능 태그
  modelTags: {
    base: 'SD' | 'Midjourney' | 'Flux' | 'Other';
    style: ('사실적' | '애니메이션')[];
    nsfwSupport: boolean;
  };
  
  // 모델별 설정 옵션
  configOptions: {
    [key: string]: {
      name: string;
      description: string;
      type: 'number' | 'text' | 'select' | 'boolean';
      default: any;
      min?: number;
      max?: number;
      step?: number;
      options?: { value: string; label: string }[];
    };
  };
  
  // 모델별 권장 설정
  recommendedSettings: string;
}

export const AI_MODELS: AIModel[] = [
  // Pony 모델 그룹
  {
    id: "Pony-Realism-v2.2",
    name: "Pony Realism v2.2",
    description: "최신 Pony Realism 모델로, 사실적인 이미지 생성에 특화되어 있습니다.",
    features: ["고해상도", "사실적 이미지", "빠른 생성"],
    vae: "Pony-Realism-v2.2",
    category: "realistic",
    apiModel: "aisha-ai-official/pony-realism-v2.2:142ae19de7553e50fe729910b35734eb233d8267661b8355be5a7ab0b457db1c",
    nsfw: true,
    isDefault: true,
    price: "$0.0068",
    
    modelTags: {
      base: 'SD',
      style: ['사실적'],
      nsfwSupport: true
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. 높을수록 품질이 향상되지만 생성 시간이 길어집니다.",
        type: "number",
        default: 25,
        min: 10,
        max: 50,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 7,
        min: 1,
        max: 20,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "Euler a",
        options: [
          { value: "DPM++ 2M SDE", label: "DPM++ 2M SDE" },
          { value: "DPM++ 2M Karras", label: "DPM++ 2M Karras" },
          { value: "Euler", label: "Euler" },
          { value: "Euler a", label: "Euler a" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 25
CFG 스케일: 7
샘플러: DPM++ 2M SDE
VAE: Euler a
권장 비율: 1:1 (정사각형)`
  },
  
  {
    id: "pony-sdxl",
    name: "Pony SDXL",
    description: "SDXL 기반의 Pony 모델로, 고품질 이미지 생성이 가능합니다.",
    features: ["SDXL 기반", "고품질", "Pony Realism 튜닝"],
    vae: "default",
    category: "realistic",
    apiModel: "charlesmccarthy/pony-sdxl:b070dedae81324788c3c933a5d9e1270093dc74636214b9815dae044b4b3a58a",
    nsfw: true,
    price: "$0.0053 / 이미지 (188회 / $1)",
    
    modelTags: {
      base: 'SD',
      style: ['사실적'],
      nsfwSupport: true
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. 높을수록 품질이 향상되지만 생성 시간이 길어집니다.",
        type: "number",
        default: 28,
        min: 15,
        max: 50,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 7.5,
        min: 1,
        max: 20,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "DPM++ 2M Karras",
        options: [
          { value: "DPM++ 2M SDE", label: "DPM++ 2M SDE" },
          { value: "DPM++ 2M Karras", label: "DPM++ 2M Karras" },
          { value: "Euler", label: "Euler" },
          { value: "Euler a", label: "Euler a" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 28
CFG 스케일: 7.5
샘플러: DPM++ 2M Karras
VAE: default
권장 비율: 1:1 (정사각형) 또는 3:4 (세로)`
  },
  
  {
    id: "pony-nai3",
    name: "Pony NAI3",
    description: "Novel AI 스타일의 Pony 모델, 애니메이션 스타일과 사실적 요소를 결합한 모델입니다.",
    features: ["애니메이션 스타일", "Novel AI 특성", "세부 묘사 우수"],
    vae: "default",
    category: "2D",
    apiModel: "delta-lock/ponynai3",
    nsfw: true,
    price: "$0.030 / 이미지 (33회 / $1)",
    
    modelTags: {
      base: 'SD',
      style: ['애니메이션', '사실적'],
      nsfwSupport: true
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. 높을수록 품질이 향상되지만 생성 시간이 길어집니다.",
        type: "number",
        default: 30,
        min: 20,
        max: 50,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 5,
        min: 1,
        max: 20,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "DPM++ 2M SDE Karras",
        options: [
          { value: "DPM++ 2M SDE", label: "DPM++ 2M SDE" },
          { value: "DPM++ 2M Karras", label: "DPM++ 2M Karras" },
          { value: "Euler", label: "Euler" },
          { value: "Euler a", label: "Euler a" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 30
CFG 스케일: 8
샘플러: Euler a
권장 비율: 3:4 (세로)`
  },
  
  // Flux 모델 그룹
  {
    id: "flux-dev-realism",
    name: "flux-dev-realism",
    description: "120억 파라미터의 Rectified Flow Transformer 모델로, 텍스트 설명에서 고품질 이미지를 생성합니다.",
    features: ["고품질 이미지", "빠른 생성 속도", "우수한 텍스트 충실도"],
    vae: "default",
    category: "All",
    apiModel: "xlabs-ai/flux-dev-realism:39b3434f194f87a900d1bc2b6d4b983e90f0dde1d5022c27b52c143d670758fa",
    nsfw: false,
    price: "0.037",
    
    modelTags: {
      base: 'Flux',
      style: ['사실적', '애니메이션'],
      nsfwSupport: false
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. Flux 모델은 적은 스텝으로도 높은 품질의 이미지를 생성합니다.",
        type: "number",
        default: 30,
        min: 1,
        max: 100,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 8,
        min: 1,
        max: 30,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "Default",
        options: [
          { value: "Default", label: "Default Flux" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 4
CFG 스케일: 8
샘플러: Default
권장 비율: 1:1 (정사각형)
참고: NSFW 내용은 생성 불가`
  },
  
  {
    id: "flux-schnell",
    name: "Flux Schnell",
    description: "로컬 개발 및 개인 사용을 위해 최적화된 가장 빠른 이미지 생성 모델입니다.",
    features: ["초고속 생성", "개발자 친화적", "경량화"],
    vae: "default",
    category: "All",
    apiModel: "black-forest-labs/flux-schnell",
    nsfw: false,
    price: "가격 문의 필요",
    
    modelTags: {
      base: 'Flux',
      style: ['사실적', '애니메이션'],
      nsfwSupport: false
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. Flux Schnell은 최대 4 스텝만 지원하며, 적은 스텝으로도 빠르게 결과를 생성합니다.",
        type: "number",
        default: 4,
        min: 1,
        max: 4,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 7,
        min: 1,
        max: 15,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "Default",
        options: [
          { value: "Default", label: "Default Flux" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 4
CFG 스케일: 7
샘플러: Default
권장 비율: 1:1 (정사각형)
참고: 가장 빠른 생성 속도, NSFW 내용은 생성 불가`
  },
  
  {
    id: "flux-pro",
    name: "Flux 1.1 Pro",
    description: "기존 Flux보다 6배 빠른 생성 속도와 향상된 이미지 품질, 다양성을 제공하는 프리미엄 모델입니다.",
    features: ["고속 생성", "탁월한 이미지 품질", "높은 프롬프트 충실도", "다양한 출력"],
    vae: "default",
    category: "All",
    apiModel: "black-forest-labs/flux-1.1-pro",
    nsfw: false,
    price: "이미지당 과금 방식 (정확한 가격 문의 필요)",
    
    modelTags: {
      base: 'Flux',
      style: ['사실적', '애니메이션'],
      nsfwSupport: false
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. Flux 모델은 적은 스텝으로도 높은 품질의 이미지를 생성합니다.",
        type: "number",
        default: 4,
        min: 1,
        max: 4,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 9,
        min: 1,
        max: 20,
        step: 0.5
      },
      sampler: {
        name: "샘플러",
        description: "이미지 생성에 사용할 샘플링 방법입니다.",
        type: "select",
        default: "Default",
        options: [
          { value: "Default", label: "Default Flux" }
        ]
      }
    },
    
    recommendedSettings: `스텝 수: 4
CFG 스케일: 9
샘플러: Default
권장 비율: 1:1 (정사각형)
참고: 최고 품질의 Flux 모델, NSFW 내용은 생성 불가`
  }
];

// 중복 모델 ID 검사
const modelIds = AI_MODELS.map(model => model.id);
if (new Set(modelIds).size !== modelIds.length) {
  console.error('중복된 모델 ID가 있습니다. 각 모델의 ID는 고유해야 합니다.');
}

export function getDefaultModel(): AIModel {
  const defaultModel = AI_MODELS.find(model => model.isDefault);
  return defaultModel || AI_MODELS[0];
}

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id);
}

// 카테고리별 이름 정의
export const CATEGORY_NAMES: Record<string, string> = {
  'All': '전체',
  '2D': '2D/애니메이션',
  'realistic': '사실적'
};

// 모델 카테고리별 필터링
export function filterModelsByCategory(category: string): AIModel[] {
  if (category === 'All') {
    return AI_MODELS;
  }
  return AI_MODELS.filter(model => model.category === category);
} 