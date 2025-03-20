import Replicate from "replicate";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { cache } from "react";
import { 
  API_MODEL_PATHS, 
  getApiModelPath, 
  MODEL_DEFAULT_SETTINGS, 
  getModelDefaultSettings,
  extractImageUrl,
  calculateTokens
} from "./modelUtils";
import { getModelById, getDefaultModel } from "@/app/(tabs)/image/data/models";

// 캐싱된 세션 가져오기
export const getCachedSession = cache(async () => {
  return await getSession();
});

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

// 타입 정의
export interface ImageGenerationParams {
  prompt: string;
  size?: string;
  modelId?: string;
  negativePrompt?: string;
  apiModel?: string;
  vae?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  width?: number;
  height?: number;
  additionalParams?: Record<string, any>;
  saveMetadata?: boolean;
  userId?: number;
}

export interface ImageGenerationResult {
  id?: number;
  imageUrl: string;
  modelId?: string;
  prompt?: string;
  width?: number;
  height?: number;
  success: boolean;
  error?: string;
}

export interface PermanentlyStoreImageParams {
  tempUrl: string;
  fileUrl: string;
  prompt: string;
  negativePrompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae: string;
  additionalParams?: string;
}

// 업로드 추적을 위한 맵 추가 
const uploadTracker = new Map<string, {
  status: 'pending' | 'completed' | 'failed',
  timestamp: number,
  result?: any
}>();

/**
 * Replicate API를 사용하여 이미지 생성 (run 메서드 사용)
 * API 엔드포인트와 다른 서비스 함수에서 모두 사용할 수 있는 통합 함수
 */
export async function generateImageWithReplicate(params: {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  modelId: string;
  sampler: string;
  vae?: string;
  seed?: number;
}): Promise<ImageGenerationResult> {
  try {
    // 모델 정보 가져오기
    const modelInfo = getModelById(params.modelId) || getDefaultModel();
    const apiModel = modelInfo.apiModel;
    
    console.log("Replicate API 호출 시작:", apiModel);
    
    // Replicate 클라이언트 가져오기
    const replicate = getReplicateClient();
    
    // 시드 결정 (제공된 시드 또는 무작위 생성)
    const seed = params.seed !== undefined ? params.seed : Math.floor(Math.random() * 1000000);
    console.log(`Replicate 사용 시드: ${seed}`);
    
    // 이미지 생성 요청 (run 메서드 사용)
    const output = await replicate.run(
      apiModel as `${string}/${string}:${string}`,
      {
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || "",
          width: params.width,
          height: params.height,
          num_inference_steps: params.steps,
          guidance_scale: params.cfgScale,
          scheduler: params.sampler,
          seed: seed
        }
      }
    );
    
    console.log("Replicate API 응답 타입:", typeof output);
    
    // 결과 처리
    let imageUrl = '';
    
    if (Array.isArray(output) && output.length > 0) {
      imageUrl = String(output[0]);
    } else if (typeof output === 'string') {
      imageUrl = output;
    } else if (output && typeof output === 'object') {
      const outputObj = output as any;
      if (outputObj.output) {
        if (typeof outputObj.output === 'string') {
          imageUrl = outputObj.output;
        } else if (Array.isArray(outputObj.output) && outputObj.output.length > 0) {
          imageUrl = String(outputObj.output[0]);
        }
      }
    }
    
    // URL 검증
    if (!imageUrl) {
      return { success: false, error: "이미지 URL을 생성하지 못했습니다", imageUrl: '' };
    }
    
    // 유효한 URL 검증
    try {
      new URL(imageUrl);
    } catch (e) {
      return { success: false, error: "유효하지 않은 이미지 URL 형식", imageUrl: '' };
    }
    
    return { 
      success: true, 
      imageUrl,
      prompt: params.prompt,
      modelId: params.modelId,
      width: params.width,
      height: params.height
    };
  } catch (error) {
    console.error("이미지 생성 실패:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이미지 생성 중 오류 발생",
      imageUrl: ''
    };
  }
}

// 이미지 생성 후 저장이 필요한 경우 API 엔드포인트 호출
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  userId?: number;
}) {
  try {
    // API 엔드포인트 호출 (단일 진입점 사용)
    const response = await fetch('/api/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: data.prompt,
        negativePrompt: data.negativePrompt,
        modelId: data.modelId,
        width: data.width || 768,
        height: data.height || 768,
        trackingId: `service-${Date.now()}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || '이미지 생성 API 호출 실패');
    }

    return await response.json();
  } catch (error) {
    console.error('이미지 저장 API 호출 오류:', error);
    throw error;
  }
}

// Text2Image 함수 수정 - API 엔드포인트 사용
export async function generateImageWithText({
  prompt, 
  size = "768x768", 
  modelId = "pony-realism-v2.2", 
  negativePrompt = "low quality, bad anatomy, worst quality, low resolution, blurry, blur, out of focus, watermarks, logos, letters",
  apiModel,
  vae,
  steps = 30,
  cfgScale = 7,
  sampler = "K_EULER_ANCESTRAL",
  width,
  height,
  additionalParams = {},
  saveMetadata = false,
  userId,
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  try {
    // 크기 파싱 - size 문자열이나 width/height 값을 사용
    let parsedWidth = width;
    let parsedHeight = height;
    
    if (!parsedWidth || !parsedHeight) {
      const [sizeWidth, sizeHeight] = size.split("x").map(Number);
      if (!isNaN(sizeWidth) && !isNaN(sizeHeight)) {
        parsedWidth = sizeWidth;
        parsedHeight = sizeHeight;
      } else {
        parsedWidth = 768;
        parsedHeight = 768;
      }
    }
    
    // DB 저장이 필요한 경우 API 엔드포인트 호출
    if (saveMetadata) {
      console.log(`[서비스] API 엔드포인트 호출로 이미지 생성 및 저장: ${prompt.substring(0, 20)}...`);
      
      const apiResponse = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
      prompt,
          negativePrompt,
          modelId,
          width: parsedWidth,
          height: parsedHeight,
          steps,
          cfgScale,
          sampler,
          vae,
          trackingId: `text2img-${Date.now()}`,
        }),
      });
      
      if (!apiResponse.ok) {
        const errorData = await apiResponse.json();
        throw new Error(errorData.error || '이미지 생성 API 호출 실패');
      }
      
      const apiResult = await apiResponse.json();
      
      return {
        id: apiResult.image.id,
        imageUrl: apiResult.image.url,
        modelId,
        prompt,
        width: parsedWidth,
        height: parsedHeight,
        success: true
      };
    } else {
      // 저장이 필요 없는 경우 바로 이미지만 생성
      console.log(`[서비스] 저장 없이 이미지만 생성: ${prompt.substring(0, 20)}...`);
      
      return await generateImageWithReplicate({
          prompt, 
        negativePrompt,
        width: parsedWidth,
        height: parsedHeight,
        steps,
        cfgScale,
          modelId, 
        sampler,
        vae
      });
    }
  } catch (error: any) {
    console.error("이미지 생성 오류:", error);
    throw error;
  }
}

// Image2Image 함수도 수정 - API 엔드포인트 사용 (옵션)
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength: number = 0.8,
  width: number = 768,
  height: number = 768,
  saveMetadata = false
): Promise<ImageGenerationResult> {
  try {
    // base64 이미지 처리
    let processedImageUrl = imageUrl;
    if (imageUrl.startsWith('data:image')) {
      const formData = new FormData();
      const blob = await (await fetch(imageUrl)).blob();
      formData.append('file', blob);
      
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('이미지 업로드에 실패했습니다');
      }
      
      const { url } = await uploadResponse.json();
      processedImageUrl = url;
    }
    
    // DB 저장이 필요한 경우 (향후 image2image API 엔드포인트 사용)
    if (saveMetadata) {
      console.log("[서비스] Image2Image 저장 기능은 API 엔드포인트를 통해 호출해야 합니다");
    }
    
    // Flux 모델 기본 설정 가져오기
    const defaultSettings = getModelDefaultSettings('flux');
    
    // Flux 모델 호출
    const replicate = getReplicateClient();
    const output = await replicate.run(
      getApiModelPath('flux') as `${string}/${string}:${string}`,
      {
        input: {
          image: processedImageUrl,
          prompt: prompt,
          strength: strength || defaultSettings.strength,
          guidance_scale: defaultSettings.cfgScale,
          num_inference_steps: defaultSettings.steps,
          width: width,
          height: height
        }
      }
    );
    
    // 이미지 URL 추출
    const outputUrl = await extractImageUrl(output);
    if (!outputUrl) {
      throw new Error("이미지 생성에 실패했습니다");
    }
    
    return {
      success: true,
      imageUrl: outputUrl,
      modelId: "flux",
      prompt,
      width,
      height
    };
  } catch (error) {
    console.error("이미지 변환 오류:", error);
    throw error;
  }
}

/**
 * 최적화된 Cloudflare 업로드 함수
 * 이미지 다운로드와 업로드 URL 요청을 병렬로 처리하여 응답 시간을 단축합니다.
 * 
 * @param {string} imageUrl - 업로드할 이미지의 URL
 * @param {string} [customFilename] - 선택적 사용자 지정 파일 이름
 * @returns {Promise<{success: boolean, cloudflareUrl?: string, uploadStatus: string, error?: string}>}
 */
export async function optimizedUploadToCloudflare(imageUrl: string, customFilename?: string) {
  // 이미 Cloudflare URL인 경우 빠르게 반환
  if (imageUrl.includes('imagedelivery.net')) {
    return { 
      success: true, 
      cloudflareUrl: imageUrl,
      uploadStatus: "already-cloudflare" 
    };
  }

  // API 키 검증
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiKey || !accountId) {
    return { 
      success: false, 
      uploadStatus: "no-credentials",
      error: "Cloudflare API 키 또는 계정 ID가 설정되지 않았습니다" 
    };
  }

  try {
    // 병렬 처리: 이미지 다운로드와 업로드 URL 요청을 동시에 진행
    const [uploadUrlResponse, imageResponse] = await Promise.all([
      fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/direct_upload`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        }
      }),
      fetch(imageUrl)
    ]);
    
    // 응답 처리
    if (!uploadUrlResponse.ok || !imageResponse.ok) {
      return { 
        success: false, 
        uploadStatus: "request-failed",
        error: `요청 실패: ${!uploadUrlResponse.ok ? 'URL 요청' : '이미지 다운로드'} 오류` 
      };
    }
    
    // 데이터 추출 - 병렬 처리
    const [uploadUrlData, imageArrayBuffer] = await Promise.all([
      uploadUrlResponse.json(),
      imageResponse.arrayBuffer()
    ]);
    
    if (!uploadUrlData.success) {
      return { 
        success: false, 
        uploadStatus: "url-response-failed",
        error: "업로드 URL 응답 실패" 
      };
    }
    
    // 이미지 업로드 준비
    const filename = customFilename || `ai-image-${Date.now()}.png`;
    const formData = new FormData();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const blob = new Blob([imageBuffer], { type: "image/png" });
    const file = new File([blob], filename, { type: "image/png" });
    formData.append("file", file);
    
    // Cloudflare로 이미지 업로드
    const uploadResponse = await fetch(uploadUrlData.result.uploadURL, {
      method: "POST",
      body: formData
    });
    
    if (!uploadResponse.ok) {
      return { 
        success: false, 
        uploadStatus: "upload-failed",
        error: `이미지 업로드 실패 (${uploadResponse.status})` 
      };
    }
    
    // 업로드 결과 처리
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success || !uploadResult.result || !uploadResult.result.variants) {
      return { 
        success: false, 
        uploadStatus: "result-failed",
        error: "업로드 결과 처리 실패" 
      };
    }
    
    // 최종 URL 반환
    const variant = selectVariant(1024, 1024, uploadResult.result.variants);
    const cloudflareUrl = variant || uploadResult.result.variants[0];
    
    return {
      success: true,
      cloudflareUrl,
      cloudflareId: uploadResult.result.id,
      variants: uploadResult.result.variants,
      uploadStatus: "success"
    };
  } catch (error) {
    return { 
      success: false, 
      uploadStatus: "error",
      error: error instanceof Error ? error.message : "업로드 중 오류 발생" 
    };
  }
}

/**
 * 백그라운드에서 이미지를 Cloudflare에 업로드하고 DB를 업데이트하는 함수
 * 즉시 반환되며 백그라운드에서 작업을 계속합니다.
 * 
 * @param {number} imageId - 이미지 ID
 * @param {string} originalUrl - 원본 이미지 URL
 * @returns {Promise<void>}
 */
export async function processImageBackground(imageId: number, originalUrl: string): Promise<void> {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    console.error("[백그라운드 처리] 유효하지 않은 이미지 ID:", imageId);
    return;
  }

  if (!originalUrl) {
    console.error("[백그라운드 처리] 업로드할 이미지 URL이 없습니다");
    return;
  }

  try {
    console.log(`[백그라운드 처리] 이미지 ID ${imageId} 처리 시작`);
    
    // 이미지 정보 가져오기 (너비/높이 정보 필요)
    const image = await db.aIImage.findUnique({
      where: { id: imageId }
    });
    
    if (!image) {
      console.error(`[백그라운드 처리] 이미지 ID ${imageId}를 찾을 수 없습니다`);
      return;
    }
    
    // 최적화된 Cloudflare 업로드 함수 사용
    const uploadResult = await optimizedUploadToCloudflare(originalUrl, `image-${imageId}`);
    
    // 업로드 실패 시
    if (!uploadResult.success) {
      console.error(`[백그라운드 처리] 이미지 ID ${imageId} Cloudflare 업로드 실패:`, uploadResult.error);
      return;
    }
    
    // 업로드 성공 시 DB 업데이트
    if (uploadResult.cloudflareUrl) {
      try {
        // 이미지 원본 크기에 따라 적절한 변형자 선택
        const fileUrl = selectVariant(
          image.width, 
          image.height, 
          uploadResult.variants || [], 
          false // 원본용
        ) || uploadResult.cloudflareUrl;
        
        // 썸네일용 변형자 선택 (public 우선)
        const thumbnailUrl = selectVariant(
          image.width, 
          image.height, 
          uploadResult.variants || [], 
          true // 썸네일용
        ) || uploadResult.cloudflareUrl;
        
        await db.aIImage.update({
          where: { id: imageId },
          data: {
            fileUrl,
            thumbnailUrl,
            isPermanent: true,
            status: 'COMPLETED'
          }
        });
        
        console.log(`[백그라운드 처리] 이미지 ID ${imageId} 처리 완료:
          fileUrl: ${fileUrl.substring(0, 30)}...,
          thumbnailUrl: ${thumbnailUrl.substring(0, 30)}...`);
      } catch (dbError) {
        console.error(`[백그라운드 처리] 이미지 ID ${imageId} DB 업데이트 실패:`, dbError);
      }
    }
  } catch (error) {
    console.error(`[백그라운드 처리] 이미지 ID ${imageId} 처리 중 오류:`, error);
  }
}

// 기존 uploadToCloudflare 함수는 유지 (호환성을 위해)
// Cloudflare 이미지에 업로드하는 함수
export async function uploadToCloudflare(imageUrl: string, customFilename?: string): Promise<{
  success: boolean;
  cloudflareId?: string;
  cloudflareUrl?: string;
  variants?: string[];
  uploadStatus: string;
  error?: string;
}> {
  // 최적화된 함수로 전달하여 코드 중복 제거
  return await optimizedUploadToCloudflare(imageUrl, customFilename);
}

// Cloudflare 업로드 스케줄링 함수 (최적화 버전)
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    throw new Error("유효하지 않은 이미지 ID입니다.");
  }

  if (!originalUrl) {
    throw new Error("업로드할 이미지 URL이 제공되지 않았습니다.");
  }

  try {
    console.log(`[Cloudflare 업로드 스케줄링] 이미지 ID ${imageId} 처리 시작 (비동기)`);
    
    // 즉시 응답을 위한 리턴 객체 준비
    const response = {
      success: true,
      imageId,
      status: 'scheduled',
      message: `이미지 ID ${imageId} 업로드가 백그라운드에서 진행 중입니다.`,
      originalUrl
    };
    
    // 백그라운드 처리 시작 (await 하지 않음)
    processImageBackground(imageId, originalUrl).catch(error => {
      console.error(`[Cloudflare 업로드 스케줄링] 백그라운드 처리 실패:`, error);
    });
    
    // 즉시 응답 반환
    return response;
  } catch (error) {
    console.error(`[Cloudflare 업로드 스케줄링] 이미지 ID ${imageId} 스케줄링 오류:`, error);
    return {
      success: false,
      imageId,
      status: 'error',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// 이미지 크기에 따라 적절한 variant 선택
/**
 * 이미지 크기 비율에 따라 최적의 변형자를 선택합니다.
 * 
 * @param {number} width - 이미지 너비
 * @param {number} height - 이미지 높이
 * @param {string[]} variants - 사용 가능한 변형자 배열
 * @param {boolean} isThumbnail - 썸네일용 변형자 선택 여부
 * @returns {string} 선택된 변형자 URL
 */
export function selectVariant(
  width: number, 
  height: number, 
  variants: string[], 
  isThumbnail: boolean = false
): string {
  // 변형자가 없는 경우 빈 문자열 반환
  if (!variants || variants.length === 0) {
    return '';
  }
  
  // 썸네일용이면 public 변형자 찾기
  if (isThumbnail) {
    return variants.find(v => v.includes('public')) || 
           variants.find(v => v.includes('thumbnail')) || 
           variants[0];
  }
  
  // 너비와 높이 비교하여 적절한 변형자 선택
  if (width > height) {
    // 너비가 더 큰 경우 (가로 이미지)
    return variants.find(v => v.includes('width') || v.includes('landscape')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  } else if (height > width) {
    // 높이가 더 큰 경우 (세로 이미지)
    return variants.find(v => v.includes('height') || v.includes('portrait')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  } else {
    // 너비와 높이가 같은 경우 (정사각형 이미지)
    return variants.find(v => v.includes('normal') || v.includes('square')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  }
}

// 기존 변형자를 public 변형자로 교체하는 함수
export function generatePublicVariantUrl(originalUrl: string): string {
  try {
    // Cloudflare 이미지 URL 예시:
    // https://imagedelivery.net/abcdefg/some-id/variant
    
    const urlParts = originalUrl.split('/');
    if (urlParts.length < 4) {
      console.warn("예상된 Cloudflare URL 형식이 아닙니다:", originalUrl);
      return originalUrl;
    }
    
    // 마지막 부분(변형자)만 'public'으로 교체
    urlParts[urlParts.length - 1] = 'public';
    return urlParts.join('/');
  } catch (error) {
    console.error("URL 변환 중 오류:", error);
    return originalUrl; // 오류 발생 시 원본 반환
  }
}

// Cloudflare 이미지 업로드 URL 얻기
export async function getImageUploadUrl() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json"
        },
        cache: 'no-store' // 캐싱 방지
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API 오류 (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("업로드 URL 가져오기 오류:", error);
    throw new Error(error.message || "업로드 URL을 가져오는데 실패했습니다");
  }
}

// 이미지 공개 함수
export async function publishImage(imageId: number) {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    throw new Error("유효하지 않은 이미지 ID입니다.");
  }

  const session = await getCachedSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  // 이미지 조회
  const image = await db.aIImage.findUnique({
    where: { id: imageId }
  });
  
  if (!image) throw new Error("이미지를 찾을 수 없습니다");
  if (image.userId !== session.id) throw new Error("권한이 없습니다");
  if (image.isPublic) return image; // 이미 공개 상태면 바로 반환
  
  try {
    // 공개 상태로 변경
    return await db.aIImage.update({
      where: { id: imageId },
      data: { isPublic: true }
    });
  } catch (error) {
    console.error("이미지 공개 중 오류:", error);
    throw new Error("이미지 공개 중 오류가 발생했습니다");
  }
} 