import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { db } from "@/lib/db";
import { z } from "zod";
import { getModelById, getDefaultModel } from "@/app/(tabs)/image/data/models";

/**
 * 이미지 생성 API 엔드포인트
 * 
 * 프롬프트와 다양한 생성 설정을 받아 AI 이미지를 생성하고 
 * 데이터베이스에 저장한 후 URL을 반환합니다.
 * 
 * [요청 형식]
 * POST /api/generate
 * 
 * [요청 본문]
 * {
 *   "prompt": "아름다운 풍경",  // (필수) 이미지 생성 프롬프트
 *   "negativePrompt": "저품질",  // (선택) 네거티브 프롬프트 
 *   "modelId": "모델명",      // 사용할 AI 모델 ID
 *   "width": 512,           // 이미지 너비 (픽셀)
 *   "height": 512,          // 이미지 높이 (픽셀)
 *   "steps": 30,            // 생성 스텝 수
 *   "cfgScale": 7,          // CFG 스케일
 *   "sampler": "샘플러",     // 샘플러 이름
 *   "vae": "VAE 모델명",    // VAE 모델 (선택사항)
 *   "variantPreference": "auto" // Cloudflare 변형자 선택 옵션 추가
 * }
 * 
 * [응답 형식]
 * {
 *   "success": true,
 *   "image": {
 *     "id": "이미지ID",
 *     "url": "이미지URL"
 *   }
 * }
 */

// 이미지 생성 요청 스키마
const generateImageSchema = z.object({
  prompt: z.string().min(1, "프롬프트는 필수입니다."),
  negativePrompt: z.string().optional(),
  modelId: z.string().default("realistic-vision-v5.1"),
  width: z.number().int().min(256).max(1024).default(512),
  height: z.number().int().min(256).max(1024).default(512),
  steps: z.number().int().min(20).max(50).default(30),
  cfgScale: z.number().min(1).max(20).default(7),
  sampler: z.string().default("DPM++ 2M Karras"),
  vae: z.string().optional(),
});

// Replicate API를 사용하여 이미지 생성
async function generateImageWithReplicate(params: {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  modelId: string;
  sampler: string;
  vae?: string;
}) {
  try {
    // models.ts에서 모델 정보 가져오기
    let modelInfo = getModelById(params.modelId);
    
    if (!modelInfo) {
      console.warn(`모델을 찾을 수 없습니다: ${params.modelId}, 기본 모델을 사용합니다.`);
      modelInfo = getDefaultModel();
    }
    
    // apiModel 필드에서 모델 ID와 버전 추출
    const apiModel = modelInfo.apiModel;
    
    console.log("Replicate API 호출 준비:", {
      modelId: params.modelId,
      modelName: modelInfo.name,
      apiModel: apiModel,
      prompt: params.prompt.substring(0, 50) + "...",
      dimensions: `${params.width}x${params.height}`
    });
    
    // 모델 ID와 버전 분리
    let modelId = "";
    let versionId = "";
    
    // 하드코딩된 버전 테이블
    const modelVersions: Record<string, string> = {
      "aisha-ai-official/pony-realism-v2.2": "aisha-ai-official/pony-realism-v2.2:142ae19de7553e50fe729910b35734eb233d8267661b8355be5a7ab0b457db1c", // stable-diffusion을 기본 모델로 매핑
      "stability-ai/sdxl": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
      "charlesmccarthy/pony-sdxl": "b070dedae81324788c3c933a5d9e1270093dc74636214b9815dae044b4b3a58a",
      "delta-lock/ponynai3": "ea38949bfddea2db315b598620110edfa76ddaf6313a18e6cbc6a98f496a34e9",
      "cjwbw/anything-v3-better-vae": "09a6c1d3bf850a37c26f5c1c148ce3343b1cb10f21c961563387996a6df20cb5",
      "xlabs-ai/flux-dev-realism" : "39b3434f194f87a900d1bc2b6d4b983e90f0dde1d5022c27b52c143d670758fa"
    };
    
    // 먼저 custom mapping에서 모델 ID 확인
    const customMapping = modelVersions[params.modelId];
    if (customMapping) {
      // 커스텀 매핑이 있는 경우
      if (customMapping.includes(":")) {
        // 완전한 모델ID:버전 형식
        const parts = customMapping.split(":");
        modelId = parts[0];
        versionId = parts[1];
        console.log(`특수 모델 ID '${params.modelId}'를 '${modelId}'와 버전 '${versionId}'로 매핑`);
      } else {
        // 버전만 있는 경우
        modelId = params.modelId;
        versionId = customMapping;
        console.log(`모델 ID '${modelId}'의 버전 찾음: ${versionId}`);
      }
    } else {
      // apiModel에서 정보 추출
      if (apiModel.includes(":")) {
        // 모델 ID와 버전이 함께 있는 경우 (예: "example/model:version")
        const parts = apiModel.split(":");
        modelId = parts[0];
        versionId = parts[1];
        console.log(`모델 ID(${modelId})와 버전(${versionId}) 분리 완료`);
      } else {
        // 버전 없이 모델 ID만 있는 경우 (예: "example/model")
        modelId = apiModel;
        console.log(`모델 ID: ${modelId}, 버전 정보 없음`);
        
        // 버전 테이블에서 검색
        versionId = modelVersions[modelId] || "";
        
        if (versionId) {
          console.log(`버전 테이블에서 찾음: ${versionId}`);
        } else {
          console.log(`버전 정보를 찾을 수 없습니다. 모델 ID: ${modelId}`);
          throw new Error(`모델 '${modelId}'의 버전 정보를 찾을 수 없습니다`);
        }
      }
    }
    
    console.log(`최종 Replicate API 호출 정보: 모델=${modelId}, 버전=${versionId}`);
    
    // Replicate API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        version: versionId,
        input: {
          prompt: params.prompt,
          negative_prompt: params.negativePrompt || "",
          width: params.width,
          height: params.height,
          num_inference_steps: params.steps,
          guidance_scale: params.cfgScale,
          scheduler: params.sampler,
          seed: Math.floor(Math.random() * 1000000)
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Replicate API 응답 오류:", errorData);
      throw new Error(`Replicate API 오류 (${response.status}): ${errorData}`);
    }
    
    const prediction = await response.json();
    console.log("Replicate 예측 생성 시작:", prediction.id);
    
    // 예측 상태 확인하며 대기
    let result;
    let status = prediction.status;
    
    // 최대 120초 동안 결과 대기 (30번 폴링, 각 4초)
    for (let i = 0; i < 30; i++) {
      if (status === "succeeded") {
        result = prediction.output;
        break;
      } else if (status === "failed" || status === "canceled") {
        throw new Error(`Replicate 예측 실패: ${prediction.error || "알 수 없는 오류"}`);
      }
      
      // 4초 대기
      await new Promise(resolve => setTimeout(resolve, 4000));
      
      // 상태 확인
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, {
        headers: {
          "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
          "Content-Type": "application/json"
        }
      });
      
      if (!statusResponse.ok) {
        throw new Error("Replicate 상태 확인 실패");
      }
      
      const updatedPrediction = await statusResponse.json();
      status = updatedPrediction.status;
      
      if (status === "succeeded") {
        result = updatedPrediction.output;
        break;
      }
    }
    
    if (!result || (Array.isArray(result) && !result[0])) {
      console.error("Replicate 응답 결과:", result);
      console.error("마지막 예측 상태:", status);
      throw new Error("Replicate에서 이미지 URL을 받지 못했습니다");
    }
    
    const imageUrl = Array.isArray(result) ? result[0] : result;
    console.log("Replicate 이미지 생성 완료:", imageUrl.substring(0, 30) + "...");
    
    return {
      success: true,
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error("이미지 생성 실패:", error);
    throw error;
  }
}

// 이미지 생성부터 Cloudflare 업로드까지 원스텝으로 처리
async function generateAndUploadImage(params: {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  modelId: string;
  sampler: string;
  vae?: string;
}) {
  try {
    // 1. Replicate API로 이미지 생성
    const imageGenerationResult = await generateImageWithReplicate(params);
    
    if (!imageGenerationResult.success || !imageGenerationResult.imageUrl) {
      throw new Error("Replicate에서 이미지 생성 실패");
    }
    
    const replicateImageUrl = imageGenerationResult.imageUrl;
    console.log("이미지 URL 생성 완료:", replicateImageUrl.substring(0, 30) + "...");
    
    // 2. Cloudflare Images API로 업로드
    const apiKey = process.env.CLOUDFLARE_API_KEY;
    const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    
    if (!apiKey || !accountId) {
      console.error("Cloudflare API 키 또는 계정 ID가 없습니다");
      // API 키가 없어도 Replicate 이미지 URL 반환
      return {
        success: true,
        cloudflareId: "direct",
        imageUrl: replicateImageUrl
      };
    }
    
    try {
      // Replicate에서 이미지 직접 다운로드
      console.log("Replicate 이미지 다운로드 중...");
      const imageResponse = await fetch(replicateImageUrl);
      
      if (!imageResponse.ok) {
        console.warn(`이미지 다운로드 실패 (${imageResponse.status}), 원본 URL 사용`);
        return {
          success: true,
          cloudflareId: "direct",
          imageUrl: replicateImageUrl
        };
      }
      
      // 이미지 데이터를 ArrayBuffer로 가져옴
      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);
      
      // Cloudflare 직접 업로드 URL 요청
      console.log("Cloudflare 업로드 URL 요청 중...");
      const uploadUrlResponse = await fetch(
        `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/direct_upload`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      if (!uploadUrlResponse.ok) {
        console.warn(`Cloudflare 업로드 URL 요청 실패 (${uploadUrlResponse.status}), 원본 URL 사용`);
        return {
          success: true,
          cloudflareId: "direct",
          imageUrl: replicateImageUrl
        };
      }
      
      const uploadUrlData = await uploadUrlResponse.json();
      
      if (!uploadUrlData.success) {
        console.warn("Cloudflare 업로드 URL 응답 실패, 원본 URL 사용");
        return {
          success: true,
          cloudflareId: "direct",
          imageUrl: replicateImageUrl
        };
      }
      
      // FormData 생성 및 이미지 첨부
      const formData = new FormData();
      const filename = `ai-image-${Date.now()}.png`;
      const blob = new Blob([imageBuffer], { type: "image/png" });
      const file = new File([blob], filename, { type: "image/png" });
      formData.append("file", file);
      
      // Cloudflare로 이미지 업로드
      console.log("Cloudflare에 이미지 업로드 중...");
      const uploadResponse = await fetch(uploadUrlData.result.uploadURL, {
        method: "POST",
        body: formData
      });
      
      if (!uploadResponse.ok) {
        console.warn(`Cloudflare 이미지 업로드 실패 (${uploadResponse.status}), 원본 URL 사용`);
        return {
          success: true,
          cloudflareId: "direct",
          imageUrl: replicateImageUrl
        };
      }
      
      const uploadResult = await uploadResponse.json();
      
      if (!uploadResult.success) {
        console.warn("Cloudflare 업로드 결과 실패, 원본 URL 사용");
        return {
          success: true,
          cloudflareId: "direct",
          imageUrl: replicateImageUrl
        };
      }
      
      console.log("Cloudflare 업로드 성공, 이미지 ID:", uploadResult.result.id);
      
      return {
        success: true,
        cloudflareId: uploadResult.result.id,
        imageUrl: uploadResult.result.variants[0],
        variants: uploadResult.result.variants
      };
    } catch (cloudflareError) {
      // Cloudflare 업로드 중 오류 발생 시 원본 URL 반환
      console.error("Cloudflare 업로드 중 오류:", cloudflareError);
      return {
        success: true,
        cloudflareId: "direct",
        imageUrl: replicateImageUrl
      };
    }
  } catch (error) {
    console.error("이미지 생성 및 업로드 실패:", error);
    throw error;
  }
}

// 기존 변형자를 public 변형자로 교체하는 함수
function generatePublicVariantUrl(originalUrl: string): string {
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

export async function POST(request: Request) {
  try {
    // 세션 정보 가져오기
    const session = await getSession();
    
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // API 요청 로깅 - 설정 정보 확인용
    console.log("이미지 생성 요청 받음:", {
      modelId: body.modelId,
      prompt: body.prompt?.substring(0, 50) + "...",
      width: body.width,
      height: body.height,
      steps: body.steps,
      cfgScale: body.cfgScale,
      sampler: body.sampler,
      vae: body.vae
    });
    
    // 스키마 검증
    const validationResult = generateImageSchema.safeParse(body);
    
    if (!validationResult.success) {
      console.error("유효성 검사 실패:", validationResult.error.format());
      return NextResponse.json({ 
        success: false,
        error: "유효하지 않은 요청 형식입니다", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const {
      prompt,
      negativePrompt,
      modelId,
      width,
      height,
      steps,
      cfgScale,
      sampler,
      vae,
    } = validationResult.data;
    
    try {
      // 이미지 생성과 Cloudflare 업로드를 단일 프로세스로 처리
      const { success, cloudflareId, imageUrl, variants } = await generateAndUploadImage({
        prompt,
        negativePrompt,
        width,
        height,
        steps,
        cfgScale,
        modelId,
        sampler,
        vae,
      });
      
      if (!success || !imageUrl) {
        throw new Error("이미지 생성 또는 업로드 실패");
      }
      
      // 썸네일용 public URL 생성 (원본 URL에서 변형자 교체)
      const thumbnailUrl = generatePublicVariantUrl(imageUrl);
      
      // 데이터베이스에 이미지 정보 저장
      const newImage = await db.aIImage.create({
        data: {
          userId: session.id,
          title: `AI 생성 이미지 - ${prompt.substring(0, 30)}...`,
          description: prompt,
          category: "AI",
          prompt,
          negativePrompt: negativePrompt || "",
          width,
          height,
          model: modelId,
          steps: steps,
          cfgScale: cfgScale,
          sampler: sampler,
          vae: vae || null,
          isPermanent: true,
          isPublic: false,
          fileUrl: imageUrl,
          thumbnailUrl: thumbnailUrl, // 작은 용량을 위해 public 변형자 사용
          format: "png",
        }
      });
      
      return NextResponse.json({
        success: true,
        image: {
          id: newImage.id,
          url: newImage.fileUrl,
        }
      });
    } catch (uploadError: any) {
      console.error("이미지 생성/업로드 오류:", uploadError);
      
      // 더 자세한 에러 메시지 구성
      let errorMessage = "이미지 생성 중 오류가 발생했습니다";
      let errorDetails = "";
      
      if (uploadError.message) {
        if (uploadError.message.includes("NSFW")) {
          errorMessage = "NSFW 콘텐츠가 감지되었습니다. 다른 프롬프트를 사용해주세요.";
          errorDetails = "안전하지 않은 콘텐츠";
        } else if (uploadError.message.includes("Cloudflare")) {
          errorMessage = "이미지 업로드 중 오류가 발생했습니다.";
          errorDetails = uploadError.message;
        } else if (uploadError.message.includes("Replicate")) {
          errorMessage = "이미지 생성 API에서 오류가 발생했습니다.";
          errorDetails = uploadError.message;
        } else {
          errorDetails = uploadError.message;
        }
      }
      
      // 명확한 에러 반환
      return NextResponse.json({ 
        success: false, 
        error: errorMessage, 
        details: errorDetails
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API 요청 처리 중 예외 발생:", error);
    return NextResponse.json({ 
      success: false, 
      error: "서버 내부 오류가 발생했습니다", 
      details: error.message || "Unknown error"
    }, { status: 500 });
  }
} 