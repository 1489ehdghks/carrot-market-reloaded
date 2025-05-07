// Image to Image 모델 타입 정의
export interface ImageModel {
  id: string;
  name: string;
  description: string;
  apiModel: string;
  price: number; // 달러 기준 API 호출 비용
  tokenPrice?: number; // 계산된 토큰 가격 (자동 계산)
  version?: string; // Replicate API 버전 정보
  additionalParams?: Record<string, any>; // 모델별 추가 매개변수

  // 필요한 이미지 타입 정의
  requiredImages: {
    sourceImage?: boolean; // 원본 이미지 필요 여부
    faceImage?: boolean;   // 얼굴 참조 이미지 필요 여부
    // 추후 다른 이미지 타입을 여기에 추가할 수 있음
  };
  
  
  // 모델별 설정 옵션
  configOptions?: {
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
  recommendedSettings: string;
}

// Image to Image 모델 데이터
export const IMAGE_MODELS: ImageModel[] = [
  // Realism XL 모델 (이미지 변환)
  {
    id: "realism-xl",
    name: "Realism XL (Image to Image)",
    description: "고품질의 사실적인 이미지 변환을 제공합니다.",
    apiModel: "asiryan/realism-xl:ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219",
    price: 0.0043,
    version: "ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219",
    
    // Realism XL은 원본 이미지만 필요
    requiredImages: {
      sourceImage: true,
      faceImage: false
    },
    
    configOptions: {
      guidance_scale: {
        name: "CFG 스케일",
        description: "생성 과정에서 모델이 입력 텍스트(프롬프트)를 얼마나 중요하게 여길지 결정하는 변수",
        type: "number",
        default: 3.5,
        min: 1,
        max: 50,
        step: 0.5
      },
      num_inference_steps: {
        name: "steps",
        description: "이미지 생성 과정에서 모델이 노이즈를 점진적으로 제거하며 이미지를 세밀화하는 데 사용되는 단계의 수",
        type: "number",
        default: 40,
        min: 1,
        max: 100,
        step: 1
      },

      strength: {
        name: "strength",
        description: "Prompt strength when using img2img, 낮을수록 이미지의 영향이 강함. 높으면 프롬프트의 영향이 강함.",
        type: "number",
        default: 0.4,
        min: 0,
        max: 1,
        step: 0.01
      },
      scheduler: {
        name: "scheduler",
        description: "이미지의 묘사에 영향을 주는 변수`",
        type: "select",
        default: 'K_EULER_ANCESTRAL',
        options: [
          { value: "K_EULER_ANCESTRAL", label: "K_EULER_ANCESTRAL" },
          { value: "DPMSolverMultistep", label: "DPMSolverMultistep" },
          { value: "HeunDiscrete", label: "HeunDiscrete" },
          { value: "KarrasDPM", label: "KarrasDPM" },
        ]

      },

    },
    recommendedSettings: `스텝 수: 40
    CFG 스케일: 3.5
    샘플러: DPM++ 2M SDE
    권장 비율: 1:1 (정사각형)`
  },

  
  // 스타일 변환 모델
  {
    id: "controlnet-x-ip-adapter-realistic-vision-v5",
    name: "controlnet-vision-v5",
    description: "기존 이미지의 스타일을 다양한 예술 스타일로 변환합니다.",
    apiModel: "stability/sdxl-style-transformer:2c311d41ce53f629f65e23ce1801d3eed2a2eb2ab308e8c2790b5e67b407b459",
    price: 0.018,
    
    // 스타일 변환은 원본 이미지만 필요
    requiredImages: {
      sourceImage: true,
      faceImage: false
    },
    
    
    configOptions: {
      styleStrength: {
        name: "스타일 강도",
        description: "스타일 적용 강도를 설정합니다. 값이 클수록 더 강하게 적용됩니다.",
        type: "number",
        default: 0.7,
        min: 0.1,
        max: 1.0,
        step: 0.1
      },
      stylePreset: {
        name: "스타일 프리셋",
        description: "적용할 예술 스타일을 선택합니다.",
        type: "select",
        default: "cinematic",
        options: [
          { value: "cinematic", label: "영화적" },
          { value: "anime", label: "애니메이션" },
          { value: "photographic", label: "사진" },
          { value: "digital-art", label: "디지털 아트" },
          { value: "fantasy-art", label: "판타지 아트" },
          { value: "oil-painting", label: "유화" },
          { value: "watercolor", label: "수채화" }
        ]
      }
    },
    recommendedSettings: `스텝 수: 25
    CFG 스케일: 7
    샘플러: DPM++ 2M SDE
    VAE: Euler a
    권장 비율: 1:1 (정사각형)`
  },
  
  // 이미지 업스케일 모델
  {
    id: "imageUpscaler",
    name: "이미지 업스케일러",
    description: "이미지 해상도를 향상시키고 디테일을 복원합니다.",
    apiModel: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
    price: 0.01,
    
    // 업스케일러는 원본 이미지만 필요
    requiredImages: {
      sourceImage: true,
      faceImage: false
    },
    
    configOptions: {
      scale: {
        name: "확대 배율",
        description: "이미지 확대 배율을 설정합니다.",
        type: "select",
        default: "2",
        options: [
          { value: "2", label: "2배" },
          { value: "3", label: "3배" },
          { value: "4", label: "4배" }
        ]
      },
      enhanceDetails: {
        name: "디테일 향상",
        description: "이미지 디테일과 선명도를 향상시킵니다.",
        type: "boolean",
        default: true
      },
      removeNoise: {
        name: "노이즈 제거",
        description: "이미지의 노이즈와 압축 아티팩트를 제거합니다.",
        type: "boolean",
        default: true
      }
    },
    recommendedSettings: `스텝 수: 25
    CFG 스케일: 7
    샘플러: DPM++ 2M SDE
    VAE: Euler a
    권장 비율: 1:1 (정사각형)`
  },
  
  // 배경 제거 모델
  {
    id: "ip_adapter-sdxl-face",
    name: "ip_adapter-sdxl (face swap)",
    description: "업로드한 얼굴을 바탕으로 프롬프트를 이용하여 이미지를 생성합니다",
    apiModel: "model-lab/background-remover:39d862aaa594a6c2b96f9056f0065165a9307e97294548e44ace29a8be7139b4",
    price: 0.025,
    
    // 배경 제거는 원본 이미지만 필요
    requiredImages: {
      sourceImage: true,
      faceImage: false
    },
    
    configOptions: {
      refinementLevel: {
        name: "세부 조정 수준",
        description: "가장자리 세부 조정 수준을 설정합니다.",
        type: "select",
        default: "medium",
        options: [
          { value: "low", label: "낮음" },
          { value: "medium", label: "중간" },
          { value: "high", label: "높음" }
        ]
      },
      preserveShadows: {
        name: "그림자 보존",
        description: "자연스러운 그림자를 보존합니다.",
        type: "boolean",
        default: false
      }
    },
    recommendedSettings: `스텝 수: 30
    CFG 스케일: 0.6
    샘플러: DPM++ 2M SDE
    VAE: Euler a
    권장 비율: 1:1 (정사각형)`
  },
];

// 토큰 환율 설정 
export const TOKEN_EXCHANGE_RATE = 1000;

// 추가 비용 배율 
export const COST_MULTIPLIER = 2.3;

/**
 * 달러 가격을 토큰으로 변환합니다.
 * @param price 달러 가격
 * @returns 토큰 가격 (정수로 반올림)
 */
export function convertToTokens(price: number): number {
  return Math.round(price * TOKEN_EXCHANGE_RATE * COST_MULTIPLIER);
}

/**
 * 모델 ID로 Image to Image 모델을 조회합니다.
 * @param id 모델 ID
 * @returns Image to Image 모델 정보 또는 undefined
 */
export function getImageModelById(id: string): ImageModel | undefined {
  const model = IMAGE_MODELS.find(model => model.id === id);
  
  if (model) {
    // 토큰 가격 계산 (요청 시 계산하여 항상 최신 환율 적용)
    model.tokenPrice = convertToTokens(model.price);
  }
  
  return model;
} 