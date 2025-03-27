// Replicate API 클라이언트
import Replicate from "replicate";

// Replicate 클라이언트 인스턴스 생성 (싱글톤 패턴)
const getReplicateClient = (() => {
  let instance: Replicate | null = null;
  
  return () => {
    if (!instance) {
      instance = new Replicate({
        auth: process.env.REPLICATE_API_KEY || "",
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(60000) // 60초 이상 자동 중지
          });
        }
      });
    }
    return instance;
  };
})();

/**
 * Replicate API를 사용하여 이미지 생성
 */
export async function generateWithReplicate(params: {
  apiModel: string;
  input: Record<string, any>;
}): Promise<{
  success: boolean;
  result?: any;
  error?: string;
}> {
  try {
    const replicate = getReplicateClient();
    
    console.log("Replicate API 호출:", params.apiModel);
    
    const output = await replicate.run(
      params.apiModel as `${string}/${string}:${string}`,
      {
        input: params.input
      }
    );
    
    return {
      success: true,
      result: output
    };
  } catch (error) {
    console.error("Replicate API 오류:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Replicate API 호출 실패"
    };
  }
}

/**
 * 이미지 URL 추출 헬퍼 함수
 */
export function extractImageUrl(output: any): string | null {
  if (!output) return null;
  
  // 배열인 경우
  if (Array.isArray(output) && output.length > 0) {
    return String(output[0]);
  }
  
  // 문자열인 경우
  if (typeof output === 'string') {
    return output;
  }
  
  // 객체인 경우
  if (output && typeof output === 'object') {
    if (output.output) {
      if (typeof output.output === 'string') {
        return output.output;
      } else if (Array.isArray(output.output) && output.output.length > 0) {
        return String(output.output[0]);
      }
    }
  }
  
  return null;
} 