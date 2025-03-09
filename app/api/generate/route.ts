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
 *   "vae": "VAE 모델명"      // VAE 모델 (선택사항)
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

// Cloudflare 이미지 업로드 URL 얻기
async function getCloudflareUploadUrl() {
  try {
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
    
    if (!response.ok) {
      throw new Error(`Cloudflare API 오류 (${response.status})`);
    }
    
    return await response.json();
  } catch (error) {
    console.error("Cloudflare 업로드 URL 요청 오류:", error);
    throw error;
  }
}

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
    
    // 모델 ID에 버전이 함께 있는 경우 (예: "example/model:version")
    if (apiModel.includes(":")) {
      const parts = apiModel.split(":");
      modelId = parts[0];
      versionId = parts[1];
      console.log(`모델 ID(${modelId})와 버전(${versionId}) 분리 완료`);
    } else {
      // 버전 없이 모델 ID만 있는 경우 (예: "example/model")
      modelId = apiModel;
      console.log(`모델 ID: ${modelId}, 버전 정보 없음`);
      
      // 하드코딩된 버전 테이블에서 조회
      const modelVersions: Record<string, string> = {
        "stability-ai/sdxl": "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        "charlesmccarthy/pony-sdxl": "b070dedae81324788c3c933a5d9e1270093dc74636214b9815dae044b4b3a58a",
        "aisha-ai-official/pony-realism-v2.2": "142ae19de7553e50fe729910b35734eb233d8267661b8355be5a7ab0b457db1c",
        "delta-lock/ponynai3": "ea38949bfddea2db315b598620110edfa76ddaf6313a18e6cbc6a98f496a34e9",
        "cjwbw/anything-v3-better-vae": "09a6c1d3bf850a37c26f5c1c148ce3343b1cb10f21c961563387996a6df20cb5"
      };
      
      versionId = modelVersions[modelId] || "";
      
      if (versionId) {
        console.log(`버전 테이블에서 찾음: ${versionId}`);
      } else {
        console.log(`버전 정보 없음, Stability AI API로 대체`);
        return await generateWithStabilityAI(params, modelInfo);
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
      
      // 이 모델에 대한 Replicate API 호출이 실패하면 대체 방법으로 Stability AI 시도
      if (modelInfo.modelTags.base === 'SD') {
        console.log("Replicate API 호출 실패, Stability AI API로 대체 시도");
        return await generateWithStabilityAI(params, modelInfo);
      }
      
      throw new Error(`Replicate API 오류 (${response.status}): ${errorData}`);
    }
    
    const prediction = await response.json();
    console.log("Replicate 예측 생성 시작:", prediction.id);
    
    // 예측 상태 확인하며 대기
    let result;
    let status = prediction.status;
    
    // 최대 60초 동안 결과 대기 (20번 폴링, 각 3초)
    for (let i = 0; i < 20; i++) {
      if (status === "succeeded") {
        result = prediction.output;
        break;
      } else if (status === "failed" || status === "canceled") {
        throw new Error(`Replicate 예측 실패: ${prediction.error || "알 수 없는 오류"}`);
      }
      
      // 3초 대기
      await new Promise(resolve => setTimeout(resolve, 3000));
      
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
      throw new Error("Replicate에서 이미지 URL을 받지 못했습니다");
    }
    
    const imageUrl = Array.isArray(result) ? result[0] : result;
    console.log("Replicate 이미지 생성 완료:", imageUrl);
    
    return {
      success: true,
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error("이미지 생성 실패:", error);
    throw error;
  }
}

// Stability AI API를 사용한 대체 이미지 생성 방법
async function generateWithStabilityAI(params: any, modelInfo: any) {
  try {
    console.log("Stability AI API 호출 시작");
    
    // 테스트 환경에서는 임시 이미지로 대체 (실제 환경에서는 Stability AI API 호출 코드로 변경)
    // 아래 코드는 실제 API 호출 예시입니다
    
    const response = await fetch("https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${process.env.STABILITY_API_KEY}`
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: params.prompt,
            weight: 1.0
          },
          {
            text: params.negativePrompt || "",
            weight: -1.0
          }
        ],
        cfg_scale: params.cfgScale,
        height: params.height,
        width: params.width,
        samples: 1,
        steps: params.steps
      })
    });
    
    if (!response.ok) {
      throw new Error(`Stability AI API 오류: ${response.status}`);
    }
    
    const responseData = await response.json();
    const base64Image = responseData.artifacts[0].base64;
    
    // base64 이미지를 Blob으로 변환하고 임시 URL 생성
    const binary = atob(base64Image);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: 'image/png' });
    const imageUrl = URL.createObjectURL(blob);

    return {
      success: true,
      imageUrl: imageUrl
    };
  } catch (error) {
    console.error("Stability AI 이미지 생성 실패:", error);
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
    // 1. Cloudflare 업로드 URL 요청 (병렬 처리)
    const cloudflarePromise = getCloudflareUploadUrl();
    
    // 2. Replicate API로 이미지 생성 (병렬 처리)
    const imagePromise = generateImageWithReplicate(params);
    
    // 두 작업 동시 처리
    const [cloudflareData, imageData] = await Promise.all([cloudflarePromise, imagePromise]);
    
    if (!cloudflareData.success || !imageData.success) {
      throw new Error("이미지 생성 또는 업로드 URL 요청 실패");
    }
    
    // 3. Replicate에서 생성된 이미지 다운로드 후 Cloudflare에 업로드
    const imageResponse = await fetch(imageData.imageUrl);
    if (!imageResponse.ok) {
      throw new Error("생성된 이미지 다운로드 실패");
    }
    
    const imageBlob = await imageResponse.blob();
    
    // 4. Cloudflare에 업로드
    const formData = new FormData();
    formData.append("file", imageBlob);
    
    const uploadResponse = await fetch(cloudflareData.result.uploadURL, {
      method: "POST",
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error("Cloudflare 업로드 실패");
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      throw new Error("업로드 결과가 실패 상태입니다");
    }
    
    // 5. 영구 URL 반환
    const permanentUrl = uploadResult.result.variants[0];
    
    return {
      success: true,
      cloudflareId: uploadResult.result.id,
      imageUrl: permanentUrl
    };
  } catch (error) {
    console.error("이미지 생성 및 업로드 실패:", error);
    throw error;
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
      return NextResponse.json({ error: "유효하지 않은 요청 형식입니다", details: validationResult.error.format() }, { status: 400 });
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
      const { success, cloudflareId, imageUrl } = await generateAndUploadImage({
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
          thumbnailUrl: imageUrl,
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
      
      // 오류 발생 시 테스트용 임시 이미지 생성 (개발 환경 전용)
      if (process.env.NODE_ENV === "development") {
        const fallbackUrl = `https://placehold.co/${width}x${height}/png?text=Error:+${uploadError.message?.substring(0, 20) || "Unknown"}`;
        
        const newImage = await db.aIImage.create({
          data: {
            userId: session.id,
            title: `[오류] AI 생성 이미지 - ${prompt.substring(0, 30)}...`,
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
            isPermanent: false,
            isPublic: false,
            fileUrl: fallbackUrl,
            thumbnailUrl: fallbackUrl,
            format: "png",
          }
        });
        
        return NextResponse.json({
          success: false,
          warning: "이미지 생성 중 오류가 발생했습니다. 임시 이미지가 제공됩니다.",
          error: uploadError.message,
          image: {
            id: newImage.id,
            url: fallbackUrl,
          }
        });
      }
      
      throw uploadError;
    }
  } catch (error: any) {
    console.error("[GENERATE_API_ERROR]", error);
    return NextResponse.json({ 
      error: "이미지 생성 중 오류가 발생했습니다", 
      message: error.message 
    }, { status: 500 });
  }
} 