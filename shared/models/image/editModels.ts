// 특수 모델 타입 정의
export interface EditModel {
  id: string;
  name: string;
  description: string;
  category: 'inpainting' | 'upscale' | 'refiner';
  apiModel: string;
  price: number; // 달러 기준 API 호출 비용
  tokenPrice?: number; // 계산된 토큰 가격 (자동 계산)
  version?: string; // API 버전 ID
  
  // 필수 입력 정의
  requiredInputs: {
    image?: boolean; // 원본 이미지 필요 여부
    mask?: boolean;  // 마스크 이미지 필요 여부
  };
  
  // 모델별 설정 옵션
  configOptions?: {
    [key: string]: {
      name: string;
      description: string;
      type: 'number' | 'text' | 'select' | 'boolean' | 'file';
      default?: any;
      min?: number;
      max?: number;
      step?: number;
      options?: { value: string; label: string }[];
    };
  };
}

/**
 * 달러 가격에 2300을 곱해 토큰 가격으로 변환합니다.
 * @param price 달러 가격
 * @returns 토큰 가격 (정수로 반올림)
 */
function calculateTokenPrice(price: number): number {
  return Math.round(price * 2300);
}

// 특수 모델 데이터
export const EDIT_MODELS: EditModel[] = [
  // Inpainting 모델
  {
    id: "realistic-vision-v5-inpainting",
    name: "lucataco-v5-Inpainting",
    description: "이미지의 마스킹된 부분을 자연스럽게 수정합니다. 사실적인 결과물을 생성합니다.",
    category: "inpainting",
    apiModel: "lucataco/realistic-vision-v5-inpainting",
    version: "c0f549d4b1a3bbc4642042558b1a6d888eca083c1e3fcd21151b1a37918b154a",
    price: 0.029,
    tokenPrice: 67,
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,
      mask: true,
    },
    
    configOptions: {
      strength: {
        name: "강도",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "number",
        default: 0.8,
        min: 0.01,
        max: 1.0,
        step: 0.01
      },
      steps: {
        name: "스텝 수",
        description: "생성 단계 수. 높을수록 품질이 향상되지만 생성 시간이 길어집니다.",
        type: "number",
        default: 20,
        min: 1,
        max: 50,
        step: 1
      },
    }
  },
  
  // Face Swap 모델
  {
    id: "realisitic-vision-v3-inpainting",
    name: "mixinmax1990-v3-inpainting",
    description: "mixinmax1990-인페인팅",
    category: "inpainting",
    apiModel: "mixinmax1990/realisitic-vision-v3-inpainting",
    version: "555a66628ea19a3b820d28878a0b0bfad222a814a7f12c79a83dbdbf57873213",
    price: 0.013,
    tokenPrice: calculateTokenPrice(0.013),
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,
      mask: true
    },
    
    configOptions: {
      strength: {
        name: "교체 강도",
        description: "얼굴 교체의 강도를 설정합니다. 값이 클수록 더 강하게 적용됩니다.",
        type: "number",
        default: 0.8,
        min: 0.1,
        max: 1.0,
        step: 0.05
      },
      steps: {
        name: "steps",
        description: "num_inference_steps",
        type: "number",
        default: 20,
        min: 1,
        max: 50,
        step: 1
      },
      guaidance_scale: {
        name: "guaidance_scale",
        description: "guaidance_scale",
        type: "number",
        default: 7.5,
        min: 1,
        max: 20,
        step: 0.5
      },
    }
  },

  {
    id: "stable-diffusion-inpainting",
    name: "stable-diffusion-inpainting",
    description: "stable-diffusion기반의 inpainting",
    category: "inpainting",
    apiModel: "stability-ai/stable-diffusion-inpainting",
    version: "95b7223104132402a9ae91cc677285bc5eb997834bd2349fa486f53910fd68b3",
    price: 0.0022,
    tokenPrice: calculateTokenPrice(0.0022),
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,  // 대상 이미지 필요
      mask: false   // 마스크 필요 없음
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
      steps: {
        name: "steps",
        description: "num_inference_steps",
        type: "number",
        default: 25,
        min: 1,
        max: 50,
        step: 1
      },
      guaidance_scale: {
        name: "cfg scale",
        description: "얼굴 특징의 디테일을 보존하고 향상시킵니다.",
        type: "number",
        default: 7.5,
        min: 1,
        max: 20,
        step: 0.5
      },
      scheduler: {
        name: "scheduler",
        description: "얼굴 특징의 디테일을 보존하고 향상시킵니다.",
        type: "select",
        default: "DPMSolverMultistep",
        options: [
          { value: "DDIM", label: "DDIM" },
          { value: "K_EULER", label: "K_EULER" },
          { value: "K_EULER_ANCESTRAL", label: "K_EULER_ANCESTRAL" },
          { value: "DPMSolverMultistep", label: "DPMSolverMultistep" }
        ]
      }
    }
  },
  {
    id: "nightmareai/real-esrgan",
    name: "real-upscale",
    description: "이미지를 확대합니다.",
    category: "upscale",
    apiModel: "nightmareai/real-esrgan",
    version: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
    price: 0.0022,
    tokenPrice: calculateTokenPrice(0.0022),
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,
      mask: false,
    },
    
    configOptions: {
      scale: {
        name: "scale",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "number",
        default: 4,
        min: 1,
        max: 10,
        step: 0.1
      },

    }
  },
  {
    id: "fermatresearch/magic-image-refiner",
    name: "image-refiner",
    description: "이미지를 확대합니다.",
    category: "refiner",
    apiModel: "fermatresearch/magic-image-refiner",
    version: "507ddf6f977a7e30e46c0daefd30de7d563c72322f9e4cf7cbac52ef0f667b13",
    price: 0.021,
    tokenPrice: calculateTokenPrice(0.021),
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,
      mask: false,
    },
    
    configOptions: {
      prompt: {
        name: "prompt",
        description: "이미지에 나타나야할 프롬프트.",
        type: "text",
      },
      negative_prompt: {
        name: "negative_prompt",
        description: "이미지에 나타나면 안되는 프롬프트.",
        type: "text",
      },
      resemblance: {
        name: "resemblance",
        description: "Controlnet을 위한 컨디셔닝 스케일.",
        type: "number",
        default:0.6,
        min:0.3,
        max:1.6,
        step:0.1
      },
      guidance_scale: {
        name: "guidance_scale",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "number",
        default: 4,
        min: 1,
        max: 10,
        step: 0.1
      },
      scheduler: {
        name: "scheduler",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "select",
        default: "DDIM",
        options: [
          { value: "DDIM", label: "DDIM" },
          { value: "DPMSolverMultistep", label: "DPMSolverMultistep" },
          { value: "K_EULER_ANCESTRAL", label: "K_EULER_ANCESTRAL" },
          { value: "K_EULER", label: "K_EULER" },
        ]
      },
    }
  },
  {
    id: "philz1337x/clarity-upscaler",
    name: "clarity-refiner",
    description: "이미지를 더욱 선명하게 변경합니다.",
    category: "refiner",
    apiModel: "philz1337x/clarity-upscaler",
    version: "dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e",
    price: 0.012,
    tokenPrice: calculateTokenPrice(0.012),
    
    // 필수 입력 지정
    requiredInputs: {
      image: true,
      mask: false,
    },
    
    configOptions: {
      prompt: {
        name: "prompt",
        description: "이미지에 나타나야할 프롬프트.",
        type: "text",
        default: "masterpiece, best quality, highres, <lora:more_details:0.5> <lora:SDXLrender_v2.0:1>",
      },
      negative_prompt: {
        name: "negative_prompt",
        description: "이미지에 나타나면 안되는 프롬프트.",
        type: "text",
        default: "(worst quality, low quality, normal quality:2) JuggernautNegative-neg,normal quality,worst quality, bad quality,panty,displeasing, lowres,bad finger,bad anatomy, bad perspective, bad proportions, bad aspect ratio, bad face, bad teeth, bad neck, bad arm, bad hands, bad ass, bad leg, bad feet, bad reflection, bad shadow, bad link, bad source, wrong hand, wrong feet, missing limb, missing eye, missing tooth, missing ear, missing finger, missing ear, extra faces, extra eyes, extra eyebrows, extra mouth, extra tongue, extra teeth, extra ears, extra breasts, extra arms, extra hands",
      },
      resemblance: {
        name: "resemblance",
        description: "Controlnet을 위한 컨디셔닝 스케일.",
        type: "number",
        default:0.6,
        min:0.3,
        max:1.6,
        step:0.1
      },
      creativity: {
        name: "creativity",
        description: "Creativity, try from 0.3 - 0.9",
        type: "number",
        default: 0.35,
        min: 0.01,
        max: 1,
        step: 0.01
      },
      guidance_scale: {
        name: "guidance_scale",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "number",
        default: 4,
        min: 1,
        max: 10,
        step: 0.1
      },
      sd_model: {
        name: "sd_model",
        description: "Stable Diffusion model checkpoint",
        type: "select",
        default: "epicrealism_naturalSinRC1VAE.safetensors [84d76a0328]",
        options: [
          { value: "epicrealism_naturalSinRC1VAE.safetensors [84d76a0328]", label: "epicrealism_naturalSinRC1VAE" },
          { value: "juggernaut_reborn.safetensors [338b85bc4f]", label: "juggernaut_reborn" },
          { value: "flat2DAnimerge_v45Sharp.safetensors", label: "flat2DAnimerge_v45Sharp" },
        ]
      },
      scheduler: {
        name: "scheduler",
        description: "마스크 영역의 변화 강도. 높을수록 프롬프트가 더 많이 반영됩니다.",
        type: "select",
        default: "DPM++ 3M SDE Karras",
        options: [
          { value: "Euler", label: "Euler" },
          { value: "Euler a", label: "Euler a" },
          { value: "DPM++ 2M", label: "DPM++ 2M" },
          { value: "DPM++ 2M SDE", label: "DPM++ 2M SDE" },
          { value: "DPM++ 2M Karras", label: "DPM++ 2M Karras" },
          { value: "DPM++ SDE Karras", label: "DPM++ SDE Karras" },
          { value: "DPM++ 2M SDE Karras", label: "DPM++ 2M SDE Karras" },
          { value: "DPM++ 3M SDE", label: "DPM++ 3M SDE" },
          { value: "DPM++ 3M SDE Karras", label: "DPM++ 3M SDE Karras" },
          { value: "DPM++ 3M SDE Exponential", label: "DPM++ 3M SDE Exponential" },
        ]
      },
    }
  },



];

/**
 * 모델 ID로 특수 모델을 조회합니다.
 * @param id 모델 ID
 * @returns 특수 모델 정보 또는 undefined
 */
export function getEditModelById(id: string): EditModel | undefined {
  const model = EDIT_MODELS.find(model => model.id === id);
  
  if (model && !model.tokenPrice) {
    model.tokenPrice = calculateTokenPrice(model.price);
  }
  
  return model;
}

/**
 * 카테고리별 특수 모델을 필터링합니다.
 * @param category 모델 카테고리
 * @returns 필터링된 모델 목록
 */
export function filterEditModelsByCategory(category: string): EditModel[] {
  return EDIT_MODELS.filter(model => model.category === category).map(model => {
    // tokenPrice 계산
    if (!model.tokenPrice) {
      model.tokenPrice = calculateTokenPrice(model.price);
    }
    return model;
  });
}

/**
 * 모델 ID로 특정 모델 찾기
 * @param modelId 찾을 모델 ID
 * @returns 찾은 모델 또는 undefined
 */
export function findModelById(modelId: string): EditModel | undefined {
  return EDIT_MODELS.find(model => model.id === modelId);
}

/**
 * 모델 사용 비용 계산 (토큰 기준)
 * @param modelId 모델 ID
 * @returns 토큰 비용 (없으면 0)
 */
export function getModelTokenPrice(modelId: string): number {
  const model = findModelById(modelId);
  return model?.tokenPrice || 0;
} 