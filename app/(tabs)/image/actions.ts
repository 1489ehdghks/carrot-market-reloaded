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

// 매개변수 타입 정의
interface ImageGenerationParams {
  prompt: string;
  size?: string;
  modelId?: string;
  negativePrompt?: string;
  apiModel?: string;
  vae?: string;
  steps?: number;
  cfgScale?: number;
  additionalParams?: Record<string, any>;
}

// Text2Image (Stable Diffusion 모델 사용)
export async function generateImageWithText({
  prompt, 
  size = "768x768", 
  modelId = "Pony-Realism-v2.2", 
  negativePrompt = "low quality, bad anatomy, worst quality, low resolution, blurry, blur, out of focus, watermarks, logos, letters",
  apiModel = "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
  vae,
  steps = 28,
  cfgScale = 8.5,
  additionalParams = {}
}: ImageGenerationParams) {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    // 기본 검증만 수행 (프론트에서 이미 토큰 검증 완료)
    if (!prompt || prompt.trim() === "") {
      throw new Error("프롬프트는 필수입니다");
    }
    
    const [width, height] = size.split("x").map(Number);
    if (isNaN(width) || isNaN(height)) {
      throw new Error("유효하지 않은 크기 형식입니다");
    }
    
    // 기본값 설정으로 null 방지
    const safeNegativePrompt = negativePrompt || "low quality, bad anatomy, worst quality, low resolution, blurry, blur, out of focus, watermarks, logos, letters";
    
    // 입력 객체 구성
    const inputObj = {
      prompt: prompt,
      negative_prompt: safeNegativePrompt,
      width: width,
      height: height,
      num_inference_steps: steps,
      guidance_scale: cfgScale,
      stream: false, // 스트리밍 비활성화
      ...additionalParams // 모델별 추가 파라미터 적용
    };
    
    // 디버깅용 로그 - 모델 ID 정보 추가
    console.log("Replicate API 호출 입력:", {
      ...inputObj,
      selectedModelId: modelId,
      apiModelPath: apiModel
    });
    
    // apiModel이 유효한지 확인
    if (!apiModel || !apiModel.includes('/')) {
      console.error("유효하지 않은 API 모델 경로:", apiModel);
      throw new Error("선택한 모델을 처리할 수 없습니다. 다른 모델을 선택해주세요.");
    }
    
    console.log("실제 사용될 API 모델 경로:", apiModel);
    
    // VAE 처리 로직
    let selectedVae = "default";
    
    // VAE가 명시적으로 선택된 경우
    if (vae && vae.trim() !== "") {
      selectedVae = vae;
    } 
    // 모델 ID에 따라 자동으로 VAE 선택
    else if (modelId === "pony-realism-v2.2") {
      selectedVae = "Pony-Realism-v2.2";
    }
    
    console.log("선택된 VAE:", selectedVae);

    // Replicate API 호출 - 선택된 모델의 API 모델 경로 사용
    const output = await replicate.run(
      apiModel as `${string}/${string}:${string}`,
      {
        input: {
          ...inputObj,
          // 모델 ID를 명시적으로 전달
          model_id: modelId,
          // VAE 처리
          vae: selectedVae
        }
      }
    );
    
    console.log("API 응답:", output);
    
    // API 호출 결과 확인
    console.log(`Replicate API 호출 결과 타입: ${typeof output}`, 
      output instanceof ReadableStream ? 'ReadableStream' : 
      Array.isArray(output) ? 'Array' : 
      typeof output);
    
    // 응답 값의 세부 구조 확인 (가능한 경우)
    if (!(output instanceof ReadableStream)) {
      try {
        console.log('응답 구조:', JSON.stringify(output).substring(0, 500));
      } catch (e) {
        console.log('응답 구조 로깅 실패:', e);
      }
    }

    // 이미지 URL 초기화
    let imageUrl: string | undefined;

    // ReadableStream 처리
    if (output instanceof ReadableStream) {
      console.log('ReadableStream 처리 시작');
      const reader = output.getReader();
      let chunks: Uint8Array[] = [];
      let totalLength = 0;
      
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            console.log('ReadableStream 읽기 완료');
            break;
          }
          
          // 바이너리 데이터 수집
          if (value) {
            chunks.push(value);
            totalLength += value.length;
            
            // 현재 청크 디코딩 시도
            try {
              const text = new TextDecoder().decode(value);
              console.log(`청크 디코딩 (${value.length} 바이트):`, text.substring(0, 200));
              
              // 줄 단위로 분리하여 처리
              const lines = text.split('\n').filter(line => line.trim());
              
              for (const line of lines) {
                try {
                  console.log('JSON 파싱 시도:', line.substring(0, 100));
                  const data = JSON.parse(line);
                  console.log('파싱된 JSON:', JSON.stringify(data).substring(0, 200));
                  
                  if (data.output && Array.isArray(data.output)) {
                    imageUrl = data.output[0];
                    console.log('찾은 이미지 URL (output 배열):', imageUrl);
                    break;
                  } else if (typeof data === 'string' && data.startsWith('http')) {
                    imageUrl = data;
                    console.log('찾은 이미지 URL (string):', imageUrl);
                    break;
                  }
                } catch (e : any) {
                  console.log('JSON 파싱 실패:', e.message);
                  // URL 형식인지 확인
                  if (line.trim().startsWith('http')) {
                    imageUrl = line.trim();
                    console.log('URL 문자열 발견:', imageUrl);
                    break;
                  }
                }
              }
              
              if (imageUrl) break;
            } catch (decodeError) {
              console.log('청크 디코딩 실패:', decodeError);
            }
          }
        }
        
        // 모든 청크 합치기
        if (!imageUrl && chunks.length > 0) {
          console.log(`전체 응답 처리 (${totalLength} 바이트)`);
          const allData = new Uint8Array(totalLength);
          let offset = 0;
          for (const chunk of chunks) {
            allData.set(chunk, offset);
            offset += chunk.length;
          }
          
          try {
            const fullText = new TextDecoder().decode(allData);
            console.log('전체 응답 텍스트:', fullText.substring(0, 500));
            
            // URL 패턴 찾기
            const urlMatch = fullText.match(/(https?:\/\/[^\s"]+\.(?:png|jpg|jpeg|webp))/i);
            if (urlMatch) {
              imageUrl = urlMatch[0];
              console.log('전체 텍스트에서 URL 패턴 발견:', imageUrl);
            }
          } catch (fullDecodeError) {
            console.log('전체 응답 디코딩 실패:', fullDecodeError);
          }
        }
      } catch (error) {
        console.error("스트림 읽기 오류:", error);
      } finally {
        reader.releaseLock();
      }
    } else {
      // 기존 응답 처리 로직
      try {
        console.log('일반 응답 처리 시작');
        
        if (Array.isArray(output) && output.length > 0) {
          imageUrl = String(output[0]);
          console.log('배열에서 URL 추출:', imageUrl);
        } else if (output && typeof output === 'object') {
          const obj = output as Record<string, any>;
          console.log('객체 속성:', Object.keys(obj).join(', '));
          
          if (obj.output && Array.isArray(obj.output)) {
            imageUrl = String(obj.output[0]);
            console.log('output 배열에서 URL 추출:', imageUrl);
          } else if (obj.url) {
            imageUrl = String(obj.url);
            console.log('url 속성에서 URL 추출:', imageUrl);
          } else if (obj.image) {
            imageUrl = String(obj.image);
            console.log('image 속성에서 URL 추출:', imageUrl);
          }
        } else if (typeof output === 'string') {
          imageUrl = output;
          console.log('문자열 응답에서 URL 추출:', imageUrl);
        }
      } catch (parseError) {
        console.error("응답 파싱 오류:", parseError);
        console.log("원본 응답:", output);
        throw new Error("API 응답을 처리할 수 없습니다");
      }
    }
    
    console.log('최종 추출된 이미지 URL:', imageUrl);
    
    if (!imageUrl) {
      console.error("유효하지 않은 응답 형식:", output);
      throw new Error("이미지 URL을 가져오는데 실패했습니다. 응답 형식이 예상과 다릅니다.");
    }
    
    // DB에 저장
    if (session.id) {
      try {
        // 이미지 정보 저장
        return await saveImageToDatabase(
          prompt, 
          imageUrl, 
          session.id, 
          undefined, 
          modelId, 
          safeNegativePrompt,
          width,
          height,
          {
            steps, 
            cfgScale, 
            sampler: "DPM++ 2M SDE", 
            vae,
            additionalParams
          }
        );
      } catch (dbError) {
        console.error("DB 저장 오류:", dbError);
        // DB 저장 실패해도 임시 URL 반환
      }
    }
    
    // 임시 URL만 반환 (DB에 저장하지 않음)
    return {
      tempUrl: imageUrl,
      prompt, 
      negativePrompt,
      modelId,
      width,
      height
    };
  } catch (error) {
    console.error("이미지 생성 오류:", error);
    throw error;
  }
}

// Cloudflare 업로드를 별도로 스케줄링하는 함수
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  try {
    console.log("백그라운드 Cloudflare 업로드 시작:", imageId);
    
    const image = await db.aIImage.findUnique({
      where: { id: imageId }
    });
    
    if (!image) return null;
    
    const cloudflareUrl = await permanentlyStoreAIImage({
      tempUrl: originalUrl,
      fileUrl: "", // 임시값, 실제로는 이후 설정됨
      prompt: image.prompt || "",
      negativePrompt: image.negativePrompt || "",
      modelId: image.model || "default",
      width: image.width || 768,
      height: image.height || 768,
      steps: image.steps || 28,
      cfgScale: image.cfgScale || 7.5,
      sampler: image.sampler || "default",
      vae: image.vae || "default",
      additionalParams: ""
    });
    
    if (cloudflareUrl) {
      return await db.aIImage.update({
        where: { id: imageId },
        data: {
          fileUrl: typeof cloudflareUrl === 'string' ? cloudflareUrl : cloudflareUrl.fileUrl,
          thumbnailUrl: typeof cloudflareUrl === 'string' ? cloudflareUrl : cloudflareUrl.fileUrl,
          isPublic: true
        }
      });
    }
    
    return null;
  } catch (error) {
    console.error("Cloudflare 업로드 처리 중 오류:", error);
    return null;
  }
}

// Image2Image (Flux 모델 사용)
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength: number = 0.8,
  width: number = 768,
  height: number = 768
) {
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
          num_inference_steps: 30,
          width: width,
          height: height
        }
      }
    ) as string[];
    
    // 결과 처리
    if (!output || !Array.isArray(output) || output.length === 0) {
      throw new Error("이미지 생성에 실패했습니다");
    }
    
    // DB에 저장
    if (session.id) {
      try {
        return await saveImageToDatabase(
          prompt, 
          output[0], 
          session.id, 
          processedImageUrl, 
          "flux", 
          undefined,
          width,
          height
        );
      } catch (dbError) {
        console.error("DB 저장 오류:", dbError);
        // DB 저장 실패해도 임시 URL 반환
      }
    }
    
    // 임시 URL만 반환
    return {
      tempUrl: output[0],
      prompt,
      originalImage: processedImageUrl
    };
  } catch (error) {
    console.error("이미지 변환 오류:", error);
    throw error;
  }
}

// Cloudflare 이미지 업로드 URL 얻기
export async function getImageUploadUrl() {
  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  try {
    console.log("Cloudflare API 호출 시작...");
    console.log(`계정 ID: ${process.env.CLOUDFLARE_ACCOUNT_ID ? "설정됨" : "미설정"}`);
    console.log(`API 토큰: ${process.env.CLOUDFLARE_API_KEY ? "설정됨" : "미설정"}`);
    
    // Cloudflare API 호출하여 업로드 URL 받기
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    console.log(`Cloudflare API 응답 상태: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare 오류 응답:", errorText);
      throw new Error(`Cloudflare API 오류 (${response.status}): ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Cloudflare 응답 성공:", data.success ? "성공" : "실패");
    
    return data;
  } catch (error: any) {
    console.error("업로드 URL 가져오기 오류:", error);
    console.error("오류 스택:", error.stack);
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
  const session = await getSession();
  if (!session || !session.id) throw new Error("로그인이 필요합니다");
  
  try {
    // 이미지 크기 기본값 설정
    const width = data.width || 768;
    const height = data.height || 768;
    
    // DB에 한 번만 저장 (영구 URL로)
    const savedImage = await db.aIImage.create({
      data: {
        userId: session.id,
        prompt: data.prompt.substring(0, 1000), // 길이 제한
        fileUrl: data.fileUrl,
        model: data.modelId,
        negativePrompt: data.negativePrompt?.substring(0, 1000),
        isPermanent: true, // 이미 영구 URL이므로 true
        title: data.prompt.substring(0, 100), // 프롬프트의 처음 100자를 제목으로
        description: data.prompt, // 프롬프트 전체를 설명으로
        category: "AI", // 기본 카테고리
        thumbnailUrl: data.fileUrl, // 동일 URL 사용
        width: width,  // 전달받은 너비 사용
        height: height, // 전달받은 높이 사용
        format: "png"  // 기본 포맷
      }
    });
    
    return savedImage;
  } catch (error: any) {
    console.error("이미지 저장 오류:", error);
    throw new Error(error.message || "이미지 정보 저장에 실패했습니다");
  }
}

// saveImageToDatabase 함수 수정
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
    // Check token count instead of character count (approximate token count calculation)
    const calculateTokens = (text: string): number => {
      if (!text) return 0;
      const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
      const otherCharCount = text.length - koreanCharCount;
      return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
    };
    
    const promptTokens = calculateTokens(prompt);
    const negativeTokens = negativePrompt ? calculateTokens(negativePrompt) : 0;
    
    if (promptTokens > 1500) {
      console.warn(`Prompt tokens exceeded: ${promptTokens} (max 1500)`);
      throw new Error(`Prompt exceeds token limit (${promptTokens}/1500)`);
    }

    if (negativePrompt && negativeTokens > 500) {
      console.warn(`Negative prompt tokens exceeded: ${negativeTokens} (max 500)`);
      throw new Error(`Negative prompt exceeds token limit (${negativeTokens}/500)`);
    }

    // Truncate text based on character length (keep for database storage)
    const truncatedPrompt = prompt.substring(0, 5000);
    const truncatedNegativePrompt = negativePrompt ? negativePrompt.substring(0, 2000) : "";
    
    // Debug log
    console.log(`Prompt tokens: ${promptTokens}, Negative prompt tokens: ${negativeTokens}`);
    
    // Input validation
    if (!prompt || !fileUrl || !userId) {
      throw new Error("Required input values are missing");
    }

    // 1. First save with temporary URL to DB
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
        }).substring(0, 10000), // Limit settings JSON to 10000 chars
        userId: userId,
        isPublic: false,
        isAdult: false
      }
    });

    // 2. Background Cloudflare upload processing
    if (image?.id) {
      permanentlyStoreAIImage({
        tempUrl: fileUrl,
        fileUrl,
        prompt,
        negativePrompt: negativePrompt || "",
        modelId: modelName || "pony",
        width,
        height,
        steps: 28,
        cfgScale: 8.5,
        sampler: "DPM++ 2M Karras",
        vae: "sdxl-vae-fp16-fix"
      }).then(async (permanentUrl) => {
        if (permanentUrl) {
          try {
            await db.aIImage.update({
              where: { id: image.id },
              data: {
                isPublic: true,
                ...(permanentUrl ? {
                  fileUrl: typeof permanentUrl === 'string' ? permanentUrl : permanentUrl.fileUrl,
                  thumbnailUrl: typeof permanentUrl === 'string' ? permanentUrl : permanentUrl.fileUrl
                } : {})
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
    console.error("이미지 저장 중 오류 발생:", error);
    const errorMessage = error instanceof Error ? error.message : "이미지 저장 중 알 수 없는 오류가 발생했습니다";
    if (errorMessage.includes("too long")) {
      throw new Error("텍스트가 데이터베이스 제한을 초과했습니다. 프롬프트는 5000자, 네거티브 프롬프트는 2000자 이내로 작성해주세요.");
    }
    console.error("이미지 저장 실패:", errorMessage);
    throw new Error(errorMessage);
  }
}

// 이미지를 영구적으로 저장하는 함수 (Cloudflare 업로드 후 DB 저장)
interface PermanentlyStoreImageParams {
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

export async function permanentlyStoreAIImage({
  tempUrl,
  fileUrl,
  prompt,
  negativePrompt,
  modelId,
  width,
  height,
  steps,
  cfgScale,
  sampler,
  vae,
  additionalParams
}: PermanentlyStoreImageParams) {
  const session = await getSession();
  
  if (!session || !session.id) {
    throw new Error("로그인이 필요합니다");
  }
  
  // DB에 이미지 정보 저장
  try {
    // 이미지 정보 저장
    return await saveImageToDatabase(
      prompt, 
      fileUrl, 
      session.id, 
      tempUrl, 
      modelId, 
      negativePrompt,
      width,
      height,
      {
        steps, 
        cfgScale, 
        sampler, 
        vae,
        additionalParams
      }
    );
  } catch (dbError) {
    console.error("DB 저장 오류:", dbError);
    throw dbError;
  }
}

// 이미지 공개 함수 수정
export async function publishImage(imageId: number) {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    throw new Error("유효하지 않은 이미지 ID입니다.");
  }

  const session = await getSession();
  if (!session) throw new Error("로그인이 필요합니다");
  
  // 이미지 조회
  const image = await db.aIImage.findUnique({
    where: { id: imageId }
  });
  
  if (!image) throw new Error("이미지를 찾을 수 없습니다");
  if (image.userId !== session.id) throw new Error("권한이 없습니다");
  if (image.isPublic) return image; // 이미 공개 상태면 바로 반환
  
  try {
    // 이미지 영구 저장 시도 (Cloudflare로 이전)
    const permanentUrl = await permanentlyStoreAIImage({
      tempUrl: image.fileUrl || "",
      fileUrl: image.fileUrl || "",
      prompt: (image as any).prompt || "",
      negativePrompt: (image as any).negativePrompt || "",
      modelId: (image as any).model || "default",
      width: image.width || 768,
      height: image.height || 768,
      steps: (image as any).steps || 28,
      cfgScale: (image as any).cfgScale || 7.5,
      sampler: (image as any).sampler || "default",
      vae: (image as any).vae || "default",
      additionalParams: ""
    });
    
    // 이미지 정보 업데이트 (영구 URL 및 공개 상태)
    return await db.aIImage.update({
      where: { id: imageId },
      data: { 
        isPublic: true,
        ...(permanentUrl ? {
          fileUrl: typeof permanentUrl === 'string' ? permanentUrl : permanentUrl.fileUrl,
          thumbnailUrl: typeof permanentUrl === 'string' ? permanentUrl : permanentUrl.fileUrl
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