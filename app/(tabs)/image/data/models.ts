// TypeScript 선언 확장: globalThis에 모델 API 캐시 추가
declare global {
  var _modelApiCache: Record<string, { modelId: string; versionId: string }>;
}

// 이미지 생성 모델 정보
export interface AIModel {
  id: string;
  name: string;
  description: string;
  vae: string;
  category: 'All' | '2D' | 'realistic';
  apiModel: string;
  nsfw: boolean;
  safety_tolerance?: number;
  isDefault?: boolean;
  price?: string; // 이미지 생성당 가격 정보
  
  // 모델 기능 태그
  modelTags: {
    base: 'SD' | 'Midjourney' | 'Flux' | 'PONY';
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
    id: "Realistic Vision 5.1",
    name: "Realistic Vision 5.1",
    description: "현실적인 이미지 생성",
    vae: "default",
    category: "realistic",
    apiModel: "wglint/3_rv:f543bb04f1cf613c3df1cdb8219288c6b44abc2c39f006c188f8d22a9598bd47",
    nsfw: false,
    price: "0.0038",
    
    modelTags: {
      base: 'SD',
      style: ['사실적'],
      nsfwSupport: false
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다. Flux 모델은 적은 스텝으로도 높은 품질의 이미지를 생성합니다.",
        type: "number",
        default: 20,
        min: 1,
        max: 100,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다. 값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 7,
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
    
    recommendedSettings: `스텝 수: 20
CFG 스케일: 7
샘플러: Default
`
  },
  
  {
    id: "flux-schnell",
    name: "Flux Schnell",
    description: "로컬 개발 및 개인 사용을 위해 최적화된 가장 빠른 이미지 생성 모델입니다.",
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
  },
  
  {
    id: "nsfw-flux-dev",
    name: "nsfw-flux-dev",
    description: "기존 Flux보다 6배 빠른 생성 속도와 향상된 이미지 품질, 다양성을 제공하는 프리미엄 모델입니다.",
    vae: "default",
    category: "All",
    apiModel: "aisha-ai-official/nsfw-flux-dev:fb4f086702d6a301ca32c170d926239324a7b7b2f0afc3d232a9c4be382dc3fa",
    nsfw: false,
    price: "0.0057",
    
    modelTags: {
      base: 'Flux',
      style: ['사실적', '애니메이션'],
      nsfwSupport: false
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "생성 단계 수입니다",
        type: "number",
        default: 30,
        min: 1,
        max: 100,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 9,
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
    
    recommendedSettings: `스텝 수: 30
CFG 스케일: 9
샘플러: Default
참고: 최고 품질의 Flux 모델, NSFW 내용은 생성 불가
price: 0.0057
`
  },
  
  {
    id: "realism-xl",
    name: "realism-xl",
    description: "향상된 이미지 품질, 다양성을 제공하는 모델입니다.",
    vae: "default",
    category: "All",
    apiModel: "asiryan/realism-xl:ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219",
    nsfw: true,
    price: "0.0033",
    
    modelTags: {
      base: 'PONY',
      style: ['사실적'],
      nsfwSupport: true
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "높일수록 만드는 시간이 오래걸리지만 좀 더 세밀하게 그려냅니다.",
        type: "number",
        default: 30,
        min: 1,
        max: 50,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "값이 높을수록 프롬프트와 유사한 이미지가 생성됩니다.",
        type: "number",
        default: 14,
        min: 1,
        max: 20,
        step: 0.5
      },
    },
    
    recommendedSettings: `스텝 수: 30
CFG 스케일: 14
샘플러: K_EULER_ANCESTRAL
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

/**
 * 모델의 API 정보를 추출합니다.
 * "owner/model:version" 형식에서 모델 ID와 버전을 분리합니다.
 */
export function getModelApiInfo(modelId: string): { modelId: string; versionId: string } {
  // API 모델 정보 캐시 객체 (선언되지 않은 경우 초기화)
  if (typeof globalThis._modelApiCache === 'undefined') {
    globalThis._modelApiCache = {};
  }
  
  // 캐시에 있으면 바로 반환
  if (globalThis._modelApiCache[modelId]) {
    return globalThis._modelApiCache[modelId];
  }
  
  // 먼저 해당 ID의 모델 정보 가져오기
  const modelInfo = getModelById(modelId);
  
  if (!modelInfo) {
    // 모델 정보가 없는 경우 기본 모델 정보 사용
    const defaultModel = getDefaultModel();
    const result = parseApiModel(defaultModel.apiModel);
    // 결과 캐싱
    globalThis._modelApiCache[modelId] = result;
    return result;
  }
  
  // API 모델 문자열 파싱
  const result = parseApiModel(modelInfo.apiModel);
  // 결과 캐싱
  globalThis._modelApiCache[modelId] = result;
  return result;
}

/**
 * API 모델 문자열을 파싱하여 모델 ID와 버전 ID로 분리합니다.
 */
function parseApiModel(apiModel: string): { modelId: string; versionId: string } {
  // "owner/model:version" 형식인 경우
  if (apiModel.includes(':')) {
    const [modelId, versionId] = apiModel.split(':');
    return { modelId, versionId };
  } 
  
  // "owner/model" 형식인 경우 (버전 없음)
  return { 
    modelId: apiModel, 
    versionId: '' // 버전 정보가 없는 경우 빈 문자열 반환
  };
} 