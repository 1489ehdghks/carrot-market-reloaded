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
  additionalParams?: Record<string, any>;
  saveMetadata?: boolean;
}

export interface ImageGenerationResult {
  id?: number;
  imageUrl: string;
  modelId?: string;
  prompt?: string;
  width?: number;
  height?: number;
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

// Text2Image 생성 함수
export async function generateImageWithText({
  prompt, 
  size = "768x768", 
  modelId = "pony-realism-v2.2", 
  negativePrompt = "low quality, bad anatomy, worst quality, low resolution, blurry, blur, out of focus, watermarks, logos, letters",
  apiModel,
  vae,
  steps,
  cfgScale,
  additionalParams = {},
  saveMetadata = false
}: ImageGenerationParams): Promise<ImageGenerationResult> {
  const session = await getCachedSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    // 기본 검증
    if (!prompt || prompt.trim() === "") {
      throw new Error("프롬프트는 필수입니다");
    }
    
    const [width, height] = size.split("x").map(Number);
    if (isNaN(width) || isNaN(height)) {
      throw new Error("유효하지 않은 크기 형식입니다");
    }
    
    // 기본값 설정
    const safeNegativePrompt = negativePrompt || "low quality, bad anatomy, worst quality, low resolution, blurry, blur, out of focus, watermarks, logos, letters";
    
    // API 모델 경로 결정
    const apiModelPath = apiModel || getApiModelPath(modelId);
    
    // 모델별 기본 설정 가져오기
    const defaultSettings = getModelDefaultSettings(modelId);
    
    // VAE 처리 로직
    let selectedVae = vae || defaultSettings.vae || "default";
    
    // 입력 객체 구성 (기본 설정값 사용)
    const inputObj = {
      prompt,
      negative_prompt: safeNegativePrompt,
      width,
      height,
      num_inference_steps: steps || defaultSettings.steps,
      guidance_scale: cfgScale || defaultSettings.cfgScale,
      scheduler: defaultSettings.scheduler || "K_EULER_ANCESTRAL",
      stream: false,
      model_id: modelId,
      vae: selectedVae,
      ...additionalParams
    };
    
    console.log("Replicate API 호출 입력:", {
      ...inputObj,
      selectedModelId: modelId,
      apiModelPath
    });
    
    // Replicate API 호출
    console.log("Replicate API 호출 시작:", apiModelPath);
    const replicate = getReplicateClient();
    let output;
    try {
      output = await replicate.run(
        apiModelPath as `${string}/${string}:${string}`,
        { input: inputObj }
      );
    } catch (apiError: any) {
      console.error("Replicate API 호출 오류:", apiError.message || apiError);
      throw new Error(`AI 이미지 생성 API 호출 오류: ${apiError.message || '알 수 없는 오류'}`);
    }
    
    console.log("API 응답 타입:", typeof output);
    console.log("API 응답 구조:", output instanceof ReadableStream ? 'ReadableStream' : 
                               Array.isArray(output) ? `Array [${output.length}]` : 
                               typeof output === 'object' ? JSON.stringify(output).substring(0, 200) : 
                               String(output).substring(0, 200));
    
    // 이미지 URL 추출
    let imageUrl;
    try {
      imageUrl = await extractImageUrl(output);
    } catch (extractError: any) {
      console.error("이미지 URL 추출 오류:", extractError);
      throw new Error(`이미지 URL 추출 오류: ${extractError.message || '알 수 없는 오류'}`);
    }
    
    if (!imageUrl) {
      console.error("유효하지 않은 응답 형식:", output);
      throw new Error("이미지 URL을 가져오는데 실패했습니다");
    }
    
    // 간소화된 결과 객체 생성
    const result: ImageGenerationResult = {
      imageUrl,
      modelId,
      prompt,
      width,
      height
    };
    
    // 선택적 메타데이터 저장 (saveMetadata가 true인 경우에만 저장)
    if (saveMetadata && session.id) {
      try {
        // 이미지 정보 저장
        const savedImage = await saveImageToDatabase(
          prompt, 
          imageUrl, 
          session.id, 
          undefined, 
          modelId, 
          safeNegativePrompt,
          width,
          height,
          {
            steps: steps || defaultSettings.steps, 
            cfgScale: cfgScale || defaultSettings.cfgScale, 
            sampler: defaultSettings.sampler, 
            vae: selectedVae,
            additionalParams
          }
        );
        
        // DB 저장 결과가 있으면 결과 객체 업데이트
        if (savedImage) {
          result.id = savedImage.id;
        }
        
        console.log("이미지 메타데이터가 데이터베이스에 저장되었습니다:", result.id);
      } catch (dbError: any) {
        // 메타데이터 저장 실패 시에도 이미지 URL은 반환
        console.error("메타데이터 저장 오류:", dbError);
        console.warn("메타데이터 저장에 실패했으나, 이미지 URL은 반환됩니다");
      }
    } else {
      console.log("메타데이터 저장이 비활성화되어 있습니다. 이미지 URL만 반환합니다.");
    }
    
    return result;
  } catch (error: any) {
    console.error("이미지 생성 오류:", error);
    throw error;
  }
}

// Image2Image 생성 함수
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength: number = 0.8,
  width: number = 768,
  height: number = 768,
  saveMetadata = false
): Promise<ImageGenerationResult> {
  const session = await getCachedSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    // 이미지 URL 처리
    let processedImageUrl = imageUrl;
    
    // base64 이미지 처리
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
    
    // 간소화된 결과 객체 생성
    const result: ImageGenerationResult = {
      imageUrl: outputUrl,
      modelId: "flux",
      prompt,
      width,
      height
    };
    
    // 선택적 메타데이터 저장 (saveMetadata가 true인 경우에만 저장)
    if (saveMetadata && session.id) {
      try {
        const savedImage = await saveImageToDatabase(
          prompt, 
          outputUrl, 
          session.id, 
          processedImageUrl, 
          "flux", 
          undefined,
          width,
          height,
          {
            strength,
            steps: defaultSettings.steps,
            cfgScale: defaultSettings.cfgScale
          }
        );
        
        // DB 저장 결과가 있으면 결과 객체 업데이트
        if (savedImage) {
          result.id = savedImage.id;
        }
        
        console.log("이미지 메타데이터가 데이터베이스에 저장되었습니다:", result.id);
      } catch (dbError: any) {
        // 메타데이터 저장 실패 시에도 이미지 URL은 반환
        console.error("메타데이터 저장 오류:", dbError);
        console.warn("메타데이터 저장에 실패했으나, 이미지 URL은 반환됩니다");
      }
    } else {
      console.log("메타데이터 저장이 비활성화되어 있습니다. 이미지 URL만 반환합니다.");
    }
    
    return result;
  } catch (error) {
    console.error("이미지 변환 오류:", error);
    throw error;
  }
}

// DB 저장 결과를 ImageGenerationResult 타입으로 변환하는 함수
export function convertToImageGenerationResult(image: any): ImageGenerationResult {
  return {
    id: image.id,
    imageUrl: image.fileUrl,
    modelId: image.model,
    prompt: image.prompt,
    width: image.width,
    height: image.height
  };
}

// 이미지를 DB에 저장하는 함수
async function saveImageToDatabase(
  prompt: string, 
  fileUrl: string, 
  userId: number, 
  originalImageUrl?: string,
  modelName?: string,
  negativePrompt?: string,
  width: number = 768,
  height: number = 768,
  additionalParams?: Record<string, any>
) {
  try {
    const promptTokens = calculateTokens(prompt);
    const negativeTokens = negativePrompt ? calculateTokens(negativePrompt) : 0;
    
    // 토큰 제한 확인
    if (promptTokens > 1500) {
      console.warn(`프롬프트 토큰 초과: ${promptTokens}/1500`);
      throw new Error(`프롬프트가 토큰 제한을 초과했습니다 (${promptTokens}/1500)`);
    }

    if (negativePrompt && negativeTokens > 500) {
      console.warn(`네거티브 프롬프트 토큰 초과: ${negativeTokens}/500`);
      throw new Error(`네거티브 프롬프트가 토큰 제한을 초과했습니다 (${negativeTokens}/500)`);
    }

    // 텍스트 길이 제한
    const truncatedPrompt = prompt.substring(0, 5000);
    const truncatedNegativePrompt = negativePrompt ? negativePrompt.substring(0, 2000) : "";
    
    // 입력 검증
    if (!prompt || !fileUrl || !userId) {
      throw new Error("필수 입력값이 누락되었습니다");
    }

    // DB에 저장
    const image = await db.aIImage.create({
      data: {
        title: truncatedPrompt.substring(0, 100),
        description: truncatedPrompt,
        prompt: truncatedPrompt,
        negativePrompt: truncatedNegativePrompt,
        fileUrl: fileUrl,
        thumbnailUrl: fileUrl,
        category: "generated",
        model: modelName || (originalImageUrl ? "flux" : "pony"),
        width: width,
        height: height,
        format: "png",
        settings: JSON.stringify({
          originalImage: originalImageUrl || "",
          modelName: modelName || (originalImageUrl ? "flux" : "ponyRealism21.safetensors"),
          negativePrompt: truncatedNegativePrompt,
          ...additionalParams
        }).substring(0, 10000), // 설정 JSON 10000자로 제한
        userId: userId,
        isPublic: false,
        isAdult: false
      }
    });

    // Cloudflare 업로드 백그라운드 처리
    if (image?.id) {
      scheduleCloudflareUpload(image.id, fileUrl)
        .catch(error => console.error("Cloudflare 업로드 실패:", error));
    }
    
    return image;
  } catch (error) {
    console.error("이미지 저장 중 오류 발생:", error);
    const errorMessage = error instanceof Error ? error.message : "이미지 저장 중 알 수 없는 오류가 발생했습니다";
    if (errorMessage.includes("too long")) {
      throw new Error("텍스트가 데이터베이스 제한을 초과했습니다. 프롬프트는 5000자, 네거티브 프롬프트는 2000자 이내로 작성해주세요.");
    }
    throw new Error(errorMessage);
  }
}

// Cloudflare 업로드 스케줄링 함수
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  try {
    console.log("백그라운드 Cloudflare 업로드 시작:", imageId);
    
    const image = await db.aIImage.findUnique({
      where: { id: imageId }
    });
    
    if (!image) return null;
    
    // Cloudflare 업로드 URL 요청
    const uploadResponse = await getImageUploadUrl();
    
    if (!uploadResponse || !uploadResponse.result || !uploadResponse.result.uploadURL) {
      throw new Error("Cloudflare 업로드 URL을 가져오는데 실패했습니다");
    }
    
    // 원본 이미지 다운로드
    const imageResponse = await fetch(originalUrl);
    if (!imageResponse.ok) {
      throw new Error("원본 이미지 다운로드에 실패했습니다");
    }
    
    const imageBlob = await imageResponse.blob();
    
    // Cloudflare에 업로드
    const cloudflareResponse = await fetch(uploadResponse.result.uploadURL, {
      method: 'POST',
      body: imageBlob
    });
    
    if (!cloudflareResponse.ok) {
      throw new Error("Cloudflare 업로드에 실패했습니다");
    }
    
    const cloudflareData = await cloudflareResponse.json();
    const cloudflareUrl = cloudflareData.result?.variants?.[0] || 
                          (cloudflareData.result?.variants ? cloudflareData.result.variants[0] : null) ||
                          cloudflareData.result?.id;
    
    if (!cloudflareUrl) {
      throw new Error("Cloudflare 응답에서 이미지 URL을 찾을 수 없습니다");
    }
    
    // DB 업데이트
    return await db.aIImage.update({
      where: { id: imageId },
      data: {
        fileUrl: cloudflareUrl,
        thumbnailUrl: cloudflareUrl,
        isPublic: true,
        isPermanent: true
      }
    });
  } catch (error) {
    console.error("Cloudflare 업로드 처리 중 오류:", error);
    return null;
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

// 이미지 정보를 DB에 저장 (영구 URL 포함)
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
}) {
  const session = await getCachedSession();
  if (!session || !session.id) throw new Error("로그인이 필요합니다");
  
  try {
    // 이미지 크기 기본값 설정
    const width = data.width || 768;
    const height = data.height || 768;
    
    // DB에 저장
    return await db.aIImage.create({
      data: {
        userId: session.id,
        prompt: data.prompt.substring(0, 1000),
        fileUrl: data.fileUrl,
        model: data.modelId,
        negativePrompt: data.negativePrompt?.substring(0, 1000),
        isPermanent: true,
        title: data.prompt.substring(0, 100),
        description: data.prompt,
        category: "AI",
        thumbnailUrl: data.fileUrl,
        width: width,
        height: height,
        format: "png"
      }
    });
  } catch (error: any) {
    console.error("이미지 저장 오류:", error);
    throw new Error(error.message || "이미지 정보 저장에 실패했습니다");
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
    // Cloudflare 업로드 시도
    await scheduleCloudflareUpload(imageId, image.fileUrl);
    
    // 공개 상태로 변경
    return await db.aIImage.update({
      where: { id: imageId },
      data: { isPublic: true }
    });
  } catch (error) {
    console.error("이미지 공개 중 오류:", error);
    
    // 업로드 실패해도 공개 상태로 변경
    return await db.aIImage.update({
      where: { id: imageId },
      data: { isPublic: true }
    });
  }
} 