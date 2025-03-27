/**
 * 데이터 모델 유틸리티 모듈
 * 
 * 이 모듈은 AI 모델, 이미지 생성 모델, 토큰 계산 등과 관련된 유틸리티 함수들을 제공합니다.
 * - 모델 API 경로 관리
 * - 모델 기본 설정 관리
 * - 이미지 URL 추출
 * - 토큰 계산
 * 
 * @module data/utils
 */

/**
 * API 모델 경로 상수
 * 
 * 각 모델 ID에 해당하는 Replicate API 경로 정의
 */
export const API_MODEL_PATHS: Record<string, string> = {
  'stable-diffusion': 'stability-ai/stable-diffusion:27b93a2413e7f36cd83da926f3656280b2931564ff050bf9575f1fdf9bcd7478',
  'midjourney': 'tstramer/midjourney-diffusion:436b051ebd8f68d23e83d22de5e198e0995357afef113768c20f0b6fcef23c8b',
  'sdxl': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  'realistic-vision-v5.1': 'SG161222/realistic_vision_v5.1:b39ea7cb2e3d3e24c377430dc5e6fb2621042ac73562cc526c6f423c957b94c7',
  'realistic-vision-v6': 'SG161222/realistic_vision_v6.0_b1:b829399f9ad8c3762db8a75a7435e10abab87303de3e0dba4239578f702cd9de',
  'dreamshaper': 'cjwbw/dreamshaper-8:91bc8947a89212b544130ec24deff8e5bdf03fa4b5e0bf7439935e6bcdfcb449',
  'deliberate': 'ckpt/deliberate-v2:8e6663822898613137943b6dbc990e36219b42d08fb7e4c7b9b873b3563b9684',
  'something': 'g4ailab/something-v2.2:a08baeea0016da33e796bf98c45bfce85f21ae9a3661f0b01d4d2a44791d0399',
  'reliberate': 'lmhll/reliberate:a50d11ca89d3adcc4a306d5accb6f8151bdbb873e2ab4ea241f5184f02d5b4f8',
  'unstable-diffusion': 'lucataco/fused-wd-1.4:7e1eecd7940c77ac8a1f4a1d26caed2cbd3d47a50d9f99b979839c987b296760',
  'juggernaut': 'kizou01/juggernaut-xl:adb3bd0068985844d38260a70d10a24443e8d34a94f71ed75cd0b2127544d403'
};

/**
 * 주어진 모델 ID에 대한 API 경로를 반환합니다.
 * 
 * @param modelId 모델 ID
 * @returns API 경로 문자열 (기본값 제공)
 */
export function getApiModelPath(modelId: string): string {
  return API_MODEL_PATHS[modelId] || API_MODEL_PATHS['stable-diffusion'];
}

/**
 * 모델 기본 설정 객체
 * 
 * 각 모델에 대한 기본 설정 값 정의
 */
export const MODEL_DEFAULT_SETTINGS: Record<string, any> = {
  'stable-diffusion': {
    width: 512,
    height: 512,
    num_inference_steps: 50,
    guidance_scale: 7.5,
    scheduler: "K_EULER_ANCESTRAL"
  },
  'midjourney': {
    width: 768,
    height: 768,
    num_inference_steps: 25,
    guidance_scale: 6.0,
    scheduler: "DPMSolverMultistep"
  },
  'sdxl': {
    width: 1024,
    height: 1024,
    num_inference_steps: 28,
    guidance_scale: 7.5,
    scheduler: "K_EULER_ANCESTRAL"
  },
  'realistic-vision-v5.1': {
    width: 768,
    height: 768,
    num_inference_steps: 25,
    guidance_scale: 7.0,
    scheduler: "DPMSolverMultistep"
  },
  'default': {
    width: 768,
    height: 768,
    num_inference_steps: 30,
    guidance_scale: 7.0,
    scheduler: "K_EULER_ANCESTRAL"
  }
};

/**
 * 주어진 모델 ID에 대한 기본 설정을 반환합니다.
 * 
 * @param modelId 모델 ID
 * @returns 모델 기본 설정 객체 (없을 경우 기본값 제공)
 */
export function getModelDefaultSettings(modelId: string): any {
  return MODEL_DEFAULT_SETTINGS[modelId] || MODEL_DEFAULT_SETTINGS['default'];
}

/**
 * 생성된 이미지 URL을 추출합니다.
 * 
 * Replicate API 응답에서 이미지 URL을 추출하는 헬퍼 함수
 * 
 * @param output API 응답 객체
 * @returns 이미지 URL 문자열 또는 null
 */
export function extractImageUrl(output: any): string | null {
  if (!output) return null;
  
  // 출력이 배열인 경우 (일반적인 응답 형식)
  if (Array.isArray(output) && output.length > 0) {
    return output[0];
  }
  
  // 출력이 문자열인 경우 (단일 URL)
  if (typeof output === 'string') {
    return output;
  }
  
  // 출력이 객체인 경우 (특정 모델의 응답 형식)
  if (output && typeof output === 'object') {
    if (output.output) {
      if (typeof output.output === 'string') {
        return output.output;
      } else if (Array.isArray(output.output) && output.output.length > 0) {
        return output.output[0];
      }
    }
    
    // 다른 형태의 응답도 처리
    if (output.image) {
      return output.image;
    }
    
    if (output.images && Array.isArray(output.images) && output.images.length > 0) {
      return output.images[0];
    }
  }
  
  return null;
}

/**
 * 텍스트의 토큰 수를 계산합니다.
 * 
 * 간단한 토큰 수 계산 유틸리티 함수 (대략적인 추정값)
 * 
 * @param text 입력 텍스트
 * @returns 추정 토큰 수
 */
export function calculateTokens(text: string): number {
  if (!text) return 0;
  
  // 간단한 토큰 분할 알고리즘
  // 실제 GPT 토큰화 방식과는 다르지만 간단한 추정값 제공
  const words = text.trim().split(/\s+/);
  let tokenCount = 0;
  
  for (const word of words) {
    // 일반적으로 단어는 약 1.3개의 토큰으로 계산
    const wordLength = word.length;
    if (wordLength <= 2) {
      tokenCount += 1;
    } else if (wordLength <= 6) {
      tokenCount += 1;
    } else if (wordLength <= 10) {
      tokenCount += 2;
    } else {
      // 긴 단어는 4자당 약 1개의 토큰으로 계산
      tokenCount += Math.ceil(wordLength / 4);
    }
  }
  
  // 최소 1 토큰 보장
  return Math.max(1, tokenCount);
} 