"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_KEY || "",
  fetch: (url, options = {}) => {
    return fetch(url, {
      ...options,
      signal: AbortSignal.timeout(60000) // 60초 이상 자동 중지
    });
  }
});

// Text2Image (Stable Diffusion 모델 사용)
export async function generateImageWithPony(
  prompt: string, 
  size: string = "1024x1024", 
  modelId: string = "stable-diffusion", 
  negativePrompt: string = "low quality, bad anatomy, worst quality, low resolution, watermarks, logos, letters",
  apiModel: string = "charlesmccarthy/pony-sdxl:b070dedae81324788c3c933a5d9e1270093dc74636214b9815dae044b4b3a58a",
  selectedVae : string = "default VAE"
) {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    // 입력값 검증
    if (!prompt || prompt.trim() === "") {
      throw new Error("프롬프트는 필수입니다");
    }

    // API 호출을 위한 프롬프트 길이 제한
    const limitedPrompt = prompt.substring(0, 500);
    const limitedNegativePrompt = negativePrompt.substring(0, 500);
    
    if (prompt.length > 1000) {
      console.warn("프롬프트가 1000자를 초과하여 잘렸습니다.");
    }
    
    const [width, height] = size.split("x").map(Number);
    if (isNaN(width) || isNaN(height)) {
      throw new Error("유효하지 않은 크기 형식입니다");
    }
    
    // 기본값 설정으로 null 방지
    const safeNegativePrompt = limitedNegativePrompt || "low quality, bad anatomy, worst quality, low resolution, watermarks, logos, letters";
    
    // 입력 객체 구성
    const inputObj = {
      prompt: limitedPrompt,
      negative_prompt: safeNegativePrompt,
      width: width,
      height: height
    };
    
    // 디버깅용 로그
    console.log("Replicate API 호출 입력:", inputObj);
    
    // Replicate API 호출 - 선택된 모델 사용
    const output = await replicate.run(
      apiModel as `${string}/${string}:${string}`,
      {
        input: inputObj
      }
    );
    
    console.log("API 응답:", output);
    
    // 응답 처리 로직 단순화
    let imageUrl = "";

    // ReadableStream 처리
    if (output instanceof ReadableStream) {
      const reader = output.getReader();
      const { value } = await reader.read();
      imageUrl = String(value);
    } else {
      // 기존 응답 처리 로직
      try {
        if (Array.isArray(output) && output.length > 0) {
          imageUrl = String(output[0]); // 강제로 문자열 변환
        } else if (output && typeof output === 'object') {
          const obj = output as Record<string, any>;
          if (obj.output && Array.isArray(obj.output) && obj.output.length > 0) {
            imageUrl = String(obj.output[0]);
          } else if (obj.url) {
            imageUrl = String(obj.url);
          } else if (obj.image) {
            imageUrl = String(obj.image);
          }
        } else if (typeof output === 'string') {
          imageUrl = output;
        }
      } catch (parseError) {
        console.error("응답 파싱 오류:", parseError);
        console.log("원본 응답:", output);
        throw new Error("API 응답을 처리할 수 없습니다");
      }
    }
    
    if (!imageUrl) {
      console.error("유효하지 않은 응답 형식:", output);
      throw new Error("이미지 URL을 가져오는데 실패했습니다. 응답 형식이 예상과 다릅니다.");
    }
    
    // 데이터베이스에 이미지 정보 저장
    const savedImage = await saveImageToDatabase(
      prompt, 
      imageUrl, 
      session.id, 
      undefined, 
      modelId, 
      negativePrompt
    );
    
    return savedImage;
  } catch (error) {
    console.error("이미지 생성 오류:", error);
    throw error;
  }
}

// Image2Image (Flux 모델 사용)
export async function generateImageWithFlux(prompt: string, imageUrl: string, strength: number = 0.8) {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    // 이미지 URL이 data:image/... 형식인 경우 처리
    let processedImageUrl = imageUrl;
    
    // base64 이미지를 Replicate API가 처리할 수 있는 형식으로 변환
    if (imageUrl.startsWith('data:image')) {
      // 임시 이미지 업로드 서버에 업로드하여 URL 얻기
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
    
    // Replicate SDK를 사용하여 Flux 모델 호출
    const output = await replicate.run(
      "black-forest-labs/flux-schnell:7575ea6892c48502f04d92e473cc6e246b8507f7e3b6320d4f1a2f90858c73b0",
      {
        input: {
          image: processedImageUrl,
          prompt: prompt,
          strength: strength,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      }
    ) as string[];
    
    // 결과 이미지 URL 가져오기
    const resultImageUrl = output[0];
    
    // 데이터베이스에 이미지 정보 저장
    const savedImage = await saveImageToDatabase(prompt, resultImageUrl, session.id, processedImageUrl);
    
    return savedImage;
  } catch (error) {
    console.error("이미지 변환 오류:", error);
    throw error;
  }
}

// Cloudflare 이미지 업로드 URL 가져오기
async function getImageUploadUrl() {
  const response = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.CLOUDFLARE_API_TOKEN}`
      }
    }
  );
  
  if (!response.ok) {
    throw new Error("Cloudflare 업로드 URL을 가져오는데 실패했습니다");
  }
  
  const { result, success } = await response.json();
  return { success, result };
}

// saveImageToDatabase 함수 수정
async function saveImageToDatabase(
  prompt: string, 
  fileUrl: string, 
  userId: number, 
  originalImageUrl?: string,
  modelName?: string,
  negativePrompt?: string
) {
  try {
    // 입력값 검증
    if (!prompt || !fileUrl || !userId) {
      throw new Error("필수 입력값이 누락되었습니다");
    }

    // 텍스트 길이 제한
    const truncatedPrompt = prompt.substring(0, 1500); // 프롬프트 500자 제한
    const truncatedTitle = truncatedPrompt.substring(0, 50); // 제목 50자 제한
    const truncatedDescription = truncatedPrompt.substring(0, 1000); // 설명 1000자 제한
    const truncatedNegativePrompt = (negativePrompt || "").substring(0, 500); // 네거티브 프롬프트 500자 제한

    // 1. 먼저 임시 URL로 DB에 저장
    const image = await db.aIImage.create({
      data: {
        title: truncatedTitle,
        description: truncatedDescription,
        prompt: truncatedPrompt,
        negativePrompt: truncatedNegativePrompt,
        fileUrl: fileUrl,
        thumbnailUrl: fileUrl,
        category: "generated",
        model: originalImageUrl ? "flux" : (modelName || "pony"),
        width: 1024,
        height: 1024,
        format: "png",
        settings: JSON.stringify({
          originalImage: originalImageUrl || "",
          modelName: modelName || "ponyRealism21.safetensors",
          negativePrompt: truncatedNegativePrompt
        }).substring(0, 3000), // settings JSON도 1000자로 제한
        userId: userId,
        isPublic: false,
        isAdult: false
      }
    });

    // 2. 백그라운드에서 Cloudflare 업로드 처리
    if (image?.id) {
      permanentlyStoreAIImage(fileUrl).then(async (permanentUrl) => {
        if (permanentUrl) {
          try {
            await db.aIImage.update({
              where: { id: image.id },
              data: {
                fileUrl: permanentUrl,
                thumbnailUrl: permanentUrl
              }
            });
          } catch (updateError) {
            console.error("이미지 URL 업데이트 실패:", updateError instanceof Error ? updateError.message : "알 수 없는 오류");
          }
        }
      }).catch(uploadError => {
        console.error("백그라운드 이미지 저장 실패:", uploadError instanceof Error ? uploadError.message : "알 수 없는 오류");
      });
    }
    
    return image;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "이미지 저장 중 알 수 없는 오류가 발생했습니다";
    if (errorMessage.includes("too long")) {
      throw new Error("입력된 텍스트가 너무 깁니다. 더 짧게 작성해주세요.");
    }
    console.error("이미지 저장 실패:", errorMessage);
    throw new Error(errorMessage);
  }
}

// AI 이미지를 영구 저장하는 함수 최적화
export async function permanentlyStoreAIImage(imageUrl: string): Promise<string | null> {
  try {
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_TOKEN || !process.env.CLOUDFLARE_ACCOUNT_HASH) {
      console.warn('Cloudflare 환경 변수가 설정되지 않았습니다');
      return null;
    }

    // 1. 이미지 다운로드와 업로드 URL 요청을 병렬로 처리
    const [imageResponse, uploadUrlResponse] = await Promise.all([
      fetch(imageUrl),
      getImageUploadUrl()
    ]);

    if (!imageResponse.ok) {
      console.error('이미지 다운로드 실패');
      return null;
    }
    
    const blob = await imageResponse.blob();
    
    const { success, result } = uploadUrlResponse;
    if (!success || !result?.uploadURL) {
      console.error('업로드 URL을 가져오는데 실패했습니다');
      return null;
    }
    
    // 2. 이미지 업로드
    const formData = new FormData();
    formData.append('file', blob);
    
    const uploadResponse = await fetch(result.uploadURL, {
      method: 'POST',
      body: formData,
    });
    
    if (!uploadResponse.ok) {
      console.error('이미지 업로드에 실패했습니다');
      return null;
    }
    
    const uploadResult = await uploadResponse.json();
    if (!uploadResult.success) {
      console.error('업로드 응답이 유효하지 않습니다');
      return null;
    }
    
    const imageId = uploadResult.result.id;
    return `https://imagedelivery.net/${process.env.CLOUDFLARE_ACCOUNT_HASH}/${imageId}/public`;
  } catch (error) {
    console.error('이미지 영구 저장 실패:', error);
    return null;  // 에러 발생 시 null 반환
  }
}

// 이미지 공개 함수 수정
export async function publishImage(imageId: number) {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  // 이미지 조회
  const image = await db.aIImage.findUnique({
    where: { id: imageId },
    select: { userId: true, fileUrl: true, isPublic: true }
  });
  
  if (!image) throw new Error("이미지를 찾을 수 없습니다");
  if (image.userId !== session.id) throw new Error("권한이 없습니다");
  if (image.isPublic) return image; // 이미 공개 상태면 바로 반환
  
  try {
    // 이미지 영구 저장 시도 (Cloudflare로 이전)
    const permanentUrl = await permanentlyStoreAIImage(image.fileUrl);
    
    // 이미지 정보 업데이트 (영구 URL 및 공개 상태)
    return await db.aIImage.update({
      where: { id: imageId },
      data: { 
        isPublic: true,
        ...(permanentUrl ? {
          fileUrl: permanentUrl,
          thumbnailUrl: permanentUrl
        } : {})
      }
    });
  } catch (error) {
    // Cloudflare 업로드 실패 시에도 공개 상태로 변경
    return await db.aIImage.update({
      where: { id: imageId },
      data: { 
        isPublic: true
      }
    });
  }
} 