// 특수 모델 타입 정의
export interface SpecialModel {
  id: string;
  name: string;
  description: string;
  category: 'inpainting' | 'faceswap' | 'outfit' | 'controlnet';
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

// 특수 모델 데이터
export const SPECIAL_MODELS: SpecialModel[] = [
  // Face Swap 모델
  {
    id: "faceSwap",
    name: "Face Swap",
    description: "기본 얼굴 교체 모델로, 한 이미지의 얼굴을 다른 이미지의 얼굴로 교체합니다.",
    category: "faceswap",
    apiModel: "cdingram/face-swap:d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111",
    price: 0.015, // API 호출당 $0.015
    
    features: {
      quality: 'medium',
      speed: 'fast'
    },
    
    configOptions: {
      strength: {
        name: "교체 강도",
        description: "얼굴 교체의 강도를 설정합니다. 값이 클수록 더 강하게 적용됩니다.",
        type: "number",
        default: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.1
      }
    }
  },
  
  {
    id: "insightfaceSwap",
    name: "InsightFace Swap",
    description: "고품질 얼굴 교체 모델로, 자연스러운 표정과 피부톤 보존에 탁월합니다.",
    category: "faceswap",
    apiModel: "lucataco/faceswap-insightface:520c974e265e7daa47a5796a33d3dad2815200032dc6b7a56870f7de42a46432",
    price: 0.025, // API 호출당 $0.025
    
    features: {
      quality: 'high',
      speed: 'medium'
    },
    
    configOptions: {
      strength: {
        name: "교체 강도",
        description: "얼굴 교체의 강도를 설정합니다. 값이 클수록 더 강하게 적용됩니다.",
        type: "number",
        default: 0.85,
        min: 0.1,
        max: 1.0,
        step: 0.05
      },
      preserveSkinTone: {
        name: "피부톤 보존",
        description: "대상 이미지의 피부톤을 보존합니다.",
        type: "boolean",
        default: true
      },
      enhanceDetails: {
        name: "디테일 향상",
        description: "얼굴 특징의 디테일을 보존하고 향상시킵니다.",
        type: "boolean",
        default: true
      }
    }
  },
  
  {
    id: "faceswapPlus",
    name: "FaceSwap Plus",
    description: "다중 얼굴을 지원하며 고급 블렌딩 기능이 있는 프리미엄 얼굴 교체 모델입니다.",
    category: "faceswap",
    apiModel: "ashishkr/faceswapplus-v1:c3f4e8c3cc405c481e61897e8acc4b4597c83457e6f180e68f1fc2693fa3dc0c",
    price: 0.03, // API 호출당 $0.03
    
    features: {
      quality: 'ultra',
      speed: 'slow'
    },
    
    configOptions: {
      strength: {
        name: "교체 강도",
        description: "얼굴 교체의 강도를 설정합니다. 값이 클수록 더 강하게 적용됩니다.",
        type: "number",
        default: 0.9,
        min: 0.2,
        max: 1.0,
        step: 0.05
      },
      faceRefinement: {
        name: "얼굴 개선 수준",
        description: "얼굴 특징의 미세한 개선 정도를 설정합니다.",
        type: "select",
        default: "medium",
        options: [
          { value: "none", label: "없음" },
          { value: "low", label: "낮음" },
          { value: "medium", label: "중간" },
          { value: "high", label: "높음" }
        ]
      },
      blendMode: {
        name: "블렌딩 모드",
        description: "얼굴과 배경 이미지의 블렌딩 방식을 선택합니다.",
        type: "select",
        default: "normal",
        options: [
          { value: "normal", label: "일반" },
          { value: "enhance", label: "향상됨" },
          { value: "soft", label: "부드러움" },
          { value: "sharp", label: "선명함" }
        ]
      },
      detectAllFaces: {
        name: "모든 얼굴 감지",
        description: "이미지 내 모든 얼굴을 감지하여 교체합니다. 비활성화하면 가장 큰 얼굴만 교체합니다.",
        type: "boolean",
        default: false
      }
    }
  },
  
  // 인페인팅 모델
  {
    id: "inpaintingStandard",
    name: "표준 인페인팅",
    description: "이미지의 특정 부분을 지우고 자연스럽게 채워넣습니다.",
    category: "inpainting",
    apiModel: "stability/inpainting-v1",
    price: 0.018, // API 호출당 $0.018
    
    features: {
      quality: 'high',
      speed: 'medium'
    },
    
    configOptions: {
      steps: {
        name: "스텝 수",
        description: "인페인팅 생성 단계 수입니다. 높을수록 품질이 향상되지만 생성 시간이 길어집니다.",
        type: "number",
        default: 25,
        min: 10,
        max: 50,
        step: 1
      },
      cfgScale: {
        name: "CFG 스케일",
        description: "프롬프트 충실도입니다.",
        type: "number",
        default: 7,
        min: 1,
        max: 20,
        step: 0.5
      }
    }
  },
  
  // 의상 모델
  {
    id: "outfitGenerator",
    name: "의상 생성기",
    description: "캐릭터나 인물을 위한 다양한 의상을 생성합니다. 코스프레, 판타지 의상 등에 적합합니다.",
    category: "outfit",
    apiModel: "outfitai/outfit-generator-v1",
    price: 0.022, // API 호출당 $0.022
    
    features: {
      quality: 'high',
      speed: 'medium'
    },
    
    configOptions: {
      complexity: {
        name: "복잡도",
        description: "의상의 복잡도를 설정합니다. 높을수록 더 상세한 의상이 생성됩니다.",
        type: "select",
        default: "medium",
        options: [
          { value: "simple", label: "단순함" },
          { value: "medium", label: "보통" },
          { value: "complex", label: "복잡함" }
        ]
      },
      style: {
        name: "스타일",
        description: "의상의 스타일을 설정합니다.",
        type: "select",
        default: "modern",
        options: [
          { value: "modern", label: "현대" },
          { value: "fantasy", label: "판타지" },
          { value: "historical", label: "역사적" },
          { value: "futuristic", label: "미래적" },
          { value: "anime", label: "애니메이션" }
        ]
      }
    }
  },
  
  // ControlNet 모델
  {
    id: "controlnetPose",
    name: "포즈 컨트롤넷",
    description: "참조 포즈를 기반으로 이미지를 생성합니다.",
    category: "controlnet",
    apiModel: "lllyasviel/controlnet-pose",
    price: 0.02, // API 호출당 $0.02
    
    features: {
      quality: 'high',
      speed: 'medium'
    },
    
    configOptions: {
      controlWeight: {
        name: "컨트롤 가중치",
        description: "포즈 컨트롤의 강도를 설정합니다.",
        type: "number",
        default: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.1
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
 * 모델 ID로 특수 모델을 조회합니다.
 * @param id 모델 ID
 * @returns 특수 모델 정보 또는 undefined
 */
export function getSpecialModelById(id: string): SpecialModel | undefined {
  const model = SPECIAL_MODELS.find(model => model.id === id);
  
  if (model) {
    // 토큰 가격 계산 (요청 시 계산하여 항상 최신 환율 적용)
    model.tokenPrice = convertToTokens(model.price);
  }
  
  return model;
}

/**
 * 카테고리별 특수 모델을 필터링합니다.
 * @param category 모델 카테고리
 * @returns 필터링된 모델 목록
 */
export function filterSpecialModelsByCategory(category: string): SpecialModel[] {
  return SPECIAL_MODELS.filter(model => model.category === category).map(model => {
    // 토큰 가격 계산
    return {
      ...model,
      tokenPrice: convertToTokens(model.price)
    };
  });
} 