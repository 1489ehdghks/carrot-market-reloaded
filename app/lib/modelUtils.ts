import { getModelById, getDefaultModel } from '@/app/(tabs)/image/data/models';
import { AIModel } from '@/app/(tabs)/image/data/models';

/**
 * 모델 ID로 모델 정보를 가져오고 확장된 정보를 추가하는 유틸리티 함수
 * @param modelId 모델 ID
 * @returns 확장된 모델 정보 객체
 */
export function getModelInformation(modelId: string): AIModel & { version: string; supportsVae: boolean } {
  // 모델 정보 가져오기
  const modelInfo = getModelById(modelId);
  
  // 모델이 없으면 기본 모델 정보 반환
  const baseModel = modelInfo || getDefaultModel();
  
  // 모델 정보를 확장하여 추가 속성 제공
  return {
    ...baseModel,
    // version 속성: 버전이 있으면 사용하고 없으면 apiModel 자체를 사용
    version: extractModelVersion(baseModel.apiModel),
    // vae 지원 여부: 모델의 vae 속성이 비어있지 않은 경우 지원
    supportsVae: !!baseModel.vae
  };
}

/**
 * 모델 ID에서 버전 정보 추출
 * @param apiModel 모델 API ID
 * @returns 모델 버전 문자열 또는 apiModel 자체
 */
function extractModelVersion(apiModel: string): string {
  // 콜론(:)으로 버전 정보가 포함된 경우
  if (apiModel.includes(':')) {
    return apiModel.split(':')[1];
  }
  
  // 버전이 없는 모델들은 apiModel 자체를 사용
  return apiModel;
}

// API 모델 경로 매핑 (캐싱)
export const API_MODEL_PATHS: Record<string, string> = {
  'pony-realism-v2.2': 'stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b',
  'realistic-vision-v5': 'takuma104/realistic-vision-v5:9222a21c181b707209ef12b5e0d7e94c994b58f01c7b2fec5c412de1dceb0e91',
  'realism-xl': 'asiryan/realism-xl:ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219',
  'dreamshaper-xl': 'stability-ai/dreamshaper-xl:7dcb6c87c5d00a4ea2059ce845b53cbe20e53b5efdad0e0439ab1a34f20050fd',
  'flux': 'black-forest-labs/flux-schnell:7575ea6892c48502f04d92e473cc6e246b8507f7e3b6320d4f1a2f90858c73b0'
};

// API 모델 경로 가져오기 (캐싱된 맵 활용)
export function getApiModelPath(modelId: string): string {
  return API_MODEL_PATHS[modelId.toLowerCase()] || API_MODEL_PATHS['pony-realism-v2.2'];
}

// 모델별 기본 설정값
export const MODEL_DEFAULT_SETTINGS: Record<string, any> = {
  'pony-realism-v2.2': {
    steps: 28,
    cfgScale: 8.5,
    sampler: "DPM++ 2M SDE",
    scheduler: "K_EULER_ANCESTRAL",
    vae: "Pony-Realism-v2.2"
  },
  'realistic-vision-v5': {
    steps: 30,
    cfgScale: 7.0,
    sampler: "DPM++ SDE Karras",
    scheduler: "K_EULER_ANCESTRAL",
    vae: "default"
  },
  'realism-xl': {
    steps: 30,
    cfgScale: 3.5,
    sampler: "DPM++ SDE Karras",
    scheduler: "K_EULER_ANCESTRAL",
    vae: "default"
  },
  'dreamshaper-xl': {
    steps: 28,
    cfgScale: 7.0,
    sampler: "DPM++ 2M SDE",
    scheduler: "K_EULER",
    vae: "default"
  },
  'flux': {
    steps: 30,
    cfgScale: 7.5,
    strength: 0.8
  }
};

// 모델별 기본 설정 가져오기
export function getModelDefaultSettings(modelId: string): any {
  const lowerModelId = modelId.toLowerCase();
  return MODEL_DEFAULT_SETTINGS[lowerModelId] || MODEL_DEFAULT_SETTINGS['pony-realism-v2.2'];
}

// 이미지 URL 추출 함수
export async function extractImageUrl(output: any): Promise<string | null> {
  try {
    // 배열에 ReadableStream이 포함된 경우
    if (Array.isArray(output) && output.length > 0 && output[0] instanceof ReadableStream) {
      console.log("ReadableStream 응답 감지, 스트림 처리 시작...");
      try {
        // 첫 번째 스트림 처리
        const reader = output[0].getReader();
        const chunks = [];
        
        // 스트림 청크 읽기
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          chunks.push(value);
        }

        // 모든 청크를 합쳐 이미지 데이터 생성
        const concatenated = new Uint8Array(chunks.reduce((acc, chunk) => acc + chunk.length, 0));
        let offset = 0;
        for (const chunk of chunks) {
          concatenated.set(chunk, offset);
          offset += chunk.length;
        }

        // Base64로 변환하기 위해 문자 배열로 변환 - 청크 단위로 처리하여 스택 오버플로 방지
        const chunkSize = 8192; // 적절한 청크 크기 설정
        let base64 = '';
        
        for (let i = 0; i < concatenated.length; i += chunkSize) {
          const chunk = concatenated.slice(i, i + chunkSize);
          base64 += String.fromCharCode.apply(null, Array.from(chunk));
        }
        
        return `data:image/png;base64,${btoa(base64)}`;
      } catch (streamError) {
        console.error("ReadableStream 처리 오류:", streamError);
        
        // 스트림 처리 실패 시 에러를 전역 에러 핸들러에 전달
        const { handleGlobalError } = require("./error-handling");
        handleGlobalError(streamError);
        
        return null;
      }
    }
    
    // 배열인 경우 (가장 일반적인 응답 형식)
    if (Array.isArray(output) && output.length > 0) {
      if (typeof output[0] === 'string' && output[0].startsWith('http')) {
        return output[0];
      }
    }
    
    // 객체인 경우
    if (output && typeof output === 'object') {
      // output 속성 확인
      if (output.output && Array.isArray(output.output) && output.output.length > 0) {
        return output.output[0];
      }
      
      // url 또는 image 속성 확인
      if (output.url && typeof output.url === 'string') {
        return output.url;
      }
      
      if (output.image && typeof output.image === 'string') {
        return output.image;
      }
    }
    
    // 문자열인 경우
    if (typeof output === 'string' && output.startsWith('http')) {
      return output;
    }
    
    // 응답 객체에서 URL 패턴 찾기
    const outputStr = JSON.stringify(output);
    const urlMatch = outputStr.match(/(https?:\/\/[^\s"]+\.(?:png|jpg|jpeg|webp))/i);
    if (urlMatch) {
      return urlMatch[0];
    }
    
    return null;
  } catch (error) {
    console.error("이미지 URL 추출 오류:", error);
    return null;
  }
}

// 토큰 계산 함수 (대략적인 계산)
export function calculateTokens(text: string): number {
  if (!text) return 0;
  const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
  const otherCharCount = text.length - koreanCharCount;
  return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
} 