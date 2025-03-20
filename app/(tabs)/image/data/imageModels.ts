// Image to Image 모델 타입 정의
export interface ImageModel {
  id: string;
  name: string;
  description: string;
  apiModel: string;
  price: number; // 달러 기준 API 호출 비용
  tokenPrice?: number; // 계산된 토큰 가격 (자동 계산)
  
  // 모델 기능 정보
  features: {
    quality: 'low' | 'medium' | 'high' | 'ultra';
    speed: 'slow' | 'medium' | 'fast' | 'ultra';
    isRealtime?: boolean;
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
}

// Image to Image 모델 데이터
export const IMAGE_MODELS: ImageModel[] = [
  // InstantID 모델 (얼굴 특성 적용)
  {
    id: "instantId",
    name: "InstantID (얼굴 특성 적용)",
    description: "이미지에서 얼굴 특성을 추출하여 다른 이미지에 적용합니다. 인물 사진을 다양한 스타일로 변환하세요.",
    apiModel: "zsxkib/instant-id-ipadapter-plus-face:71ce3f946b93b23a4a927d84969f2fc9c9e3bb3f19dd66d38c74cf543890461e",
    price: 0.025,
    
    features: {
      quality: 'high',
      speed: 'medium'
    },
    
    configOptions: {
      prompt: {
        name: "프롬프트",
        description: "생성할 이미지에 대한 설명을 입력하세요.",
        type: "text",
        default: "a portrait photo of a person"
      },
      negative_prompt: {
        name: "네거티브 프롬프트",
        description: "이미지에 포함하지 않을 요소를 설명하세요.",
        type: "text",
        default: "bad quality, blurry"
      },
      num_inference_steps: {
        name: "추론 단계",
        description: "이미지 생성 품질에 영향을 미치는 단계 수입니다. 높을수록 더 좋은 품질이지만 더 오래 걸립니다.",
        type: "number",
        default: 30,
        min: 20,
        max: 50,
        step: 1
      },
      guidance_scale: {
        name: "가이던스 스케일",
        description: "텍스트 프롬프트에 따라 이미지가 얼마나 생성될지를 제어합니다. 높을수록 프롬프트를 더 충실히 따릅니다.",
        type: "number",
        default: 5.0,
        min: 1.0,
        max: 10.0,
        step: 0.1
      },
      ip_adapter_scale: {
        name: "IP 어댑터 스케일",
        description: "얼굴 특성이 최종 이미지에 얼마나 강하게 적용될지 제어합니다.",
        type: "number",
        default: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.05
      },
      enhance_face_region: {
        name: "얼굴 영역 향상",
        description: "얼굴 영역을 추가로 향상시킵니다.",
        type: "boolean",
        default: true
      },
      seed: {
        name: "시드",
        description: "이미지 생성의 랜덤성을 제어합니다. 동일한 시드는 유사한 이미지를 생성합니다.",
        type: "number",
        default: -1,
        min: -1,
        max: 2147483647,
        step: 1
      },
      width: {
        name: "너비",
        description: "출력 이미지의 너비를 픽셀 단위로 설정합니다.",
        type: "select",
        default: "768",
        options: [
          { value: "512", label: "512px" },
          { value: "768", label: "768px" },
          { value: "1024", label: "1024px" }
        ]
      },
      height: {
        name: "높이",
        description: "출력 이미지의 높이를 픽셀 단위로 설정합니다.",
        type: "select",
        default: "768",
        options: [
          { value: "512", label: "512px" },
          { value: "768", label: "768px" },
          { value: "1024", label: "1024px" }
        ]
      }
    }
  },
  
  // 스타일 변환 모델
  {
    id: "styleTransfer",
    name: "스타일 변환",
    description: "기존 이미지의 스타일을 다양한 예술 스타일로 변환합니다.",
    apiModel: "stability/sdxl-style-transformer:2c311d41ce53f629f65e23ce1801d3eed2a2eb2ab308e8c2790b5e67b407b459",
    price: 0.018,
    
    features: {
      quality: 'high',
      speed: 'medium'
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
    }
  },
  
  // 이미지 업스케일 모델
  {
    id: "imageUpscaler",
    name: "이미지 업스케일러",
    description: "이미지 해상도를 향상시키고 디테일을 복원합니다.",
    apiModel: "nightmareai/real-esrgan:42fed1c4974146d4d2414e2be2c5277c7fcf05fcc3a73abf41610695738c1d7b",
    price: 0.01,
    
    features: {
      quality: 'high',
      speed: 'fast'
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
    }
  },
  
  // 배경 제거 모델
  {
    id: "backgroundRemover",
    name: "배경 제거",
    description: "이미지에서 배경을 자동으로 제거하고 투명한 배경으로 변환합니다.",
    apiModel: "model-lab/background-remover:39d862aaa594a6c2b96f9056f0065165a9307e97294548e44ace29a8be7139b4",
    price: 0.008,
    
    features: {
      quality: 'high',
      speed: 'ultra'
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
    }
  },
  
  // 이미지 확장 모델
  {
    id: "imageExtender",
    name: "이미지 확장",
    description: "이미지 캔버스를 확장하여 더 넓은 배경이나 컨텍스트를 추가합니다.",
    apiModel: "lstein/outpainting-v1:0fb4818cc9583bc5fb0bd931c8fc2446bc1b487a0a75b40a660c8a19d89fc031",
    price: 0.02,
    
    features: {
      quality: 'high',
      speed: 'slow'
    },
    
    configOptions: {
      direction: {
        name: "확장 방향",
        description: "이미지를 확장할 방향을 선택합니다.",
        type: "select",
        default: "all",
        options: [
          { value: "all", label: "모든 방향" },
          { value: "left", label: "왼쪽" },
          { value: "right", label: "오른쪽" },
          { value: "top", label: "위" },
          { value: "bottom", label: "아래" }
        ]
      },
      expansionRatio: {
        name: "확장 비율",
        description: "원본 이미지 대비 확장 비율을 설정합니다.",
        type: "number",
        default: 0.5,
        min: 0.1,
        max: 1.0,
        step: 0.1
      },
      seamlessBlending: {
        name: "매끄러운 블렌딩",
        description: "확장 부분이 원본과 자연스럽게 블렌딩되도록 합니다.",
        type: "boolean",
        default: true
      }
    }
  }
];

// 토큰 환율 설정 (1000토큰 = $1)
export const TOKEN_EXCHANGE_RATE = 1000;

// 추가 비용 배율 (기본 비용의 150%)
export const COST_MULTIPLIER = 1.5;

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