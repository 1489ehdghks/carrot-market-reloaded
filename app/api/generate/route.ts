import { NextResponse } from "next/server";
import { getImageSession } from "@/app/lib/imageSessionService";
import { db } from "@/lib/db";
import { z } from "zod";
import { getModelById, getDefaultModel, getModelApiInfo } from "@/app/(tabs)/image/data/models";

// 추가: Replicate 클라이언트 코드 (싱글톤 패턴)
import Replicate from "replicate";

// 싱글톤 패턴으로 Replicate 클라이언트 관리
let replicateClient: Replicate | null = null;

function getReplicateClient(): Replicate {
  if (!replicateClient) {
    replicateClient = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN as string,
    });
  }
  return replicateClient;
}

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

// Replicate API를 사용하여 이미지 생성 (run 메서드 사용)
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
}): Promise<{ success: boolean; imageUrl: string } | { success: boolean; error: string }> {
  try {
    // models.ts에서 모델 정보 가져오기
    let modelInfo = getModelById(params.modelId);
    
    if (!modelInfo) {
      console.warn(`모델을 찾을 수 없습니다: ${params.modelId}, 기본 모델을 사용합니다.`);
      modelInfo = getDefaultModel();
    }
    
    console.log("Replicate API 호출 준비:", {
      modelId: params.modelId,
      modelName: modelInfo.name,
      prompt: params.prompt.substring(0, 50) + "...",
      dimensions: `${params.width}x${params.height}`
    });
    
    // 모델의 apiModel을 직접 사용 (이미 올바른 형식으로 정의되어 있음)
    const apiModel = modelInfo.apiModel;
    
    // apiModel에서 버전 ID 추출 (형식: "owner/model:version" -> "version")
    // 예: "wglint/3_rv:f543bb04f1cf613c3df1cdb8219288c6b44abc2c39f006c188f8d22a9598bd47"
    let versionId = "";
    if (apiModel.includes(':')) {
      // 콜론(:) 이후 부분이 버전 ID
      versionId = apiModel.split(':')[1];
      console.log(`Replicate API 호출: 모델=${apiModel.split(':')[0]}, 버전=${versionId}`);
    } else {
      // 형식이 예상과 다른 경우 전체 문자열 사용 (오류 발생 가능성 있음)
      versionId = apiModel;
      console.error(`API 모델 형식 오류 - 콜론(:)이 없음: ${apiModel}`);
    }
    
    // API 호출 시작 시간 기록
    const apiCallStartTime = Date.now();
    console.time('Replicate-API-직접호출');
    
    // Replicate 클라이언트 가져오기
    const replicate = getReplicateClient();
    
    // Replicate 라이브러리의 predictions API를 사용하여 이미지 생성 요청
    const prediction = await replicate.predictions.create({
      version: versionId, // 버전 ID만 전달
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
    });
    
    console.timeEnd('Replicate-API-직접호출');
    console.time('Replicate-API-폴링');
    
    // 결과 대기 (폴링)
    const result = await replicate.wait(prediction);
    
    console.timeEnd('Replicate-API-폴링');
    
    // API 호출 종료 시간 및 총 소요 시간 계산
    const apiCallEndTime = Date.now();
    const apiCallDuration = apiCallEndTime - apiCallStartTime;
    console.log(`총 API 호출 소요 시간: ${apiCallDuration}ms (요청 ID: ${prediction.id})`);
    
    if (!result) {
      throw new Error("Replicate에서 이미지 결과를 받지 못했습니다");
    }
    
    // 결과 자세히 로깅
    console.log("Replicate API 결과 타입:", typeof result);
    console.log("Replicate API 결과 내용:", JSON.stringify(result).substring(0, 200) + "...");
    
    // 결과 처리 (안전하게 처리)
    let imageUrl = '';
    
    if (Array.isArray(result)) {
      // 배열인 경우 첫 번째 항목 사용
      const firstItem = result[0];
      imageUrl = typeof firstItem === 'string' ? firstItem : '';
      console.log("배열 결과 첫 항목:", typeof firstItem, firstItem);
    } else if (typeof result === 'string') {
      // 문자열인 경우 직접 사용
      imageUrl = result;
    } else if (result && typeof result === 'object') {
      // 객체인 경우 속성 탐색
      console.log("객체 결과 키:", Object.keys(result));
      
      try {
        // 타입 단언 없이 안전하게 속성 접근
        // @ts-ignore - 런타임에 실제 객체 구조 확인
        if (result.output && typeof result.output === 'string') {
          imageUrl = result.output;
          console.log("output 문자열에서 URL 찾음:", imageUrl.substring(0, 50) + "...");
        // @ts-ignore
        } else if (result.output && Array.isArray(result.output) && result.output.length > 0) {
          // @ts-ignore
          imageUrl = String(result.output[0] || '');
          console.log("output 배열에서 URL 찾음:", imageUrl.substring(0, 50) + "...");
        // @ts-ignore
        } else if (result.urls && result.urls.get && typeof result.urls.get === 'string') {
          // @ts-ignore
          imageUrl = result.urls.get;
          console.log("urls.get에서 URL 찾음:", imageUrl.substring(0, 50) + "...");
        } else {
          // 객체를 문자열로 변환 (마지막 수단)
          console.warn("기본 경로에서 URL을 찾을 수 없음, JSON으로 변환 시도");
          
          // 객체를 일시적으로 any 타입으로 변환하여 순회
          const resultObj = JSON.parse(JSON.stringify(result));
          for (const key in resultObj) {
            const value = resultObj[key];
            if (typeof value === 'string' && value.startsWith('http')) {
              imageUrl = value;
              console.log(`${key} 속성에서 URL 찾음:`, imageUrl.substring(0, 50) + "...");
              break;
            }
          }
        }
      } catch (error) {
        console.error("API 응답 처리 중 오류 발생:", error);
      }
    }
    
    // 이미지 URL 검증
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error("유효한 이미지 URL을 추출할 수 없음, 응답:", result);
      return {
        success: false,
        error: "이미지 URL을 생성하지 못했습니다."
      };
    }

    console.log("추출된 이미지 URL:", imageUrl);
    
    // URL이 올바른 형식인지 추가 검증
    try {
      new URL(imageUrl);
    } catch (e) {
      console.error("유효하지 않은 URL 형식:", imageUrl, e);
      return {
        success: false,
        error: "유효하지 않은 이미지 URL 형식"
      };
    }
    
    // 백그라운드 작업을 위한 URL 안전성 강화
    const safeImageUrl = imageUrl;
    
    console.log("Replicate 이미지 생성 완료:", safeImageUrl.substring(0, 50) + "...");
    
    // 이미지 URL이 유효한지 테스트
    try {
      const testResponse = await fetch(safeImageUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.error("이미지 URL에 접근할 수 없음:", testResponse.status, testResponse.statusText);
        return {
          success: false,
          error: `이미지를 읽을 수 없습니다 (${testResponse.status})`
        };
      }
    } catch (error) {
      console.error("이미지 URL 테스트 중 오류 발생:", error);
      // 오류가 있더라도 Cloudflare 업로드는 시도
    }
    
    return {
      success: true,
      imageUrl: safeImageUrl
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
    console.time('이미지생성');
    // 1. Replicate API로 이미지 생성 (성능 최적화된 버전)
    const imageGenerationResult = await generateImageWithReplicate(params);
    console.timeEnd('이미지생성');
    
    // 타입 가드 함수를 사용하여 imageUrl 속성이 있는지 확인
    function hasImageUrl(result: any): result is { success: boolean; imageUrl: string } {
      return result.success && 'imageUrl' in result;
    }
    
    // 성공하지 않았거나 imageUrl이 없는 경우
    if (!hasImageUrl(imageGenerationResult)) {
      const errorMessage = imageGenerationResult.error || "Replicate에서 이미지 생성 실패";
      throw new Error(errorMessage);
    }
    
    const replicateImageUrl = imageGenerationResult.imageUrl;
    console.log("이미지 생성 성공:", replicateImageUrl.substring(0, 30) + "...");
    
    // 2. 즉시 결과 반환 (병렬 처리를 위해)
    const result = {
      success: true,
      imageUrl: replicateImageUrl,
      cloudflareId: "pending",
      uploadStatus: "pending"
    };
    
    // 3. 백그라운드 작업: Cloudflare 업로드 및 DB 업데이트
    // 이 부분은 응답을 기다리지 않고 백그라운드에서 실행됨
    (async () => {
      try {
        // 3.1. Cloudflare 업로드는 별도 스레드로 처리
        console.time('Cloudflare업로드');
        const uploadPromise = uploadToCloudflare(replicateImageUrl);
        
        // 5초 타임아웃 설정
        const timeoutPromise = new Promise<any>(resolve => {
          setTimeout(() => {
            resolve({
              success: true,
              cloudflareId: "timeout",
              uploadStatus: "timeout"
            });
          }, 5000); // 5초 타임아웃으로 단축
        });
        
        // 타임아웃과 함께 실행
        const uploadResult = await Promise.race([uploadPromise, timeoutPromise]);
        console.timeEnd('Cloudflare업로드');
        
        // 업로드 결과 로깅만 수행 (DB 업데이트 등은 다른 백그라운드 작업으로 분리 가능)
        if (uploadResult.success && uploadResult.cloudflareUrl) {
          console.log(`✓ Cloudflare 업로드 성공: ${uploadResult.cloudflareUrl.substring(0, 30)}...`);
          
          // 여기서 DB 업데이트 등의 추가 작업을 수행할 수 있음
          // 그러나 이 작업도 응답 시간에는 영향을 주지 않음
        } else {
          console.log(`✗ Cloudflare 업로드 실패/타임아웃: ${uploadResult.uploadStatus}`);
        }
      } catch (err) {
        console.error('백그라운드 작업 오류:', err);
        // 백그라운드 오류는 사용자 응답에 영향을 주지 않음
      }
    })();
    
    // 이미지 URL만 즉시 반환 (사용자 경험 향상)
    return result;
  } catch (error) {
    console.error("이미지 생성 실패:", error);
    throw error;
  }
}

// Cloudflare 업로드 함수 분리
async function uploadToCloudflare(imageUrl: string) {
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  
  if (!apiKey || !accountId) {
    console.error("Cloudflare API 키 또는 계정 ID가 없습니다");
    return {
      success: true,
      cloudflareId: "no-credentials",
      uploadStatus: "no-credentials"
    };
  }
  
  try {
    // Replicate에서 이미지 직접 다운로드
    console.log("Replicate 이미지 다운로드 중...");
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.warn(`이미지 다운로드 실패 (${imageResponse.status}), 원본 URL 사용`);
      return {
        success: true,
        cloudflareId: "download-failed",
        uploadStatus: "download-failed"
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
        cloudflareId: "url-request-failed",
        uploadStatus: "url-request-failed"
      };
    }
    
    const uploadUrlData = await uploadUrlResponse.json();
    
    if (!uploadUrlData.success) {
      console.warn("Cloudflare 업로드 URL 응답 실패, 원본 URL 사용");
      return {
        success: true,
        cloudflareId: "url-response-failed",
        uploadStatus: "url-response-failed"
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
        cloudflareId: "upload-failed",
        uploadStatus: "upload-failed"
      };
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.warn("Cloudflare 업로드 결과 실패, 원본 URL 사용");
      return {
        success: true,
        cloudflareId: "result-failed",
        uploadStatus: "result-failed"
      };
    }
    
    console.log("Cloudflare 업로드 성공, 이미지 ID:", uploadResult.result.id);
    
    return {
      success: true,
      cloudflareId: uploadResult.result.id,
      cloudflareUrl: uploadResult.result.variants[0],
      variants: uploadResult.result.variants,
      uploadStatus: "success"
    };
  } catch (cloudflareError) {
    // Cloudflare 업로드 중 오류 발생 시 원본 URL 반환
    console.error("Cloudflare 업로드 중 오류:", cloudflareError);
    return {
      success: true,
      cloudflareId: "error",
      error: cloudflareError,
      uploadStatus: "error"
    };
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
    console.time('전체요청');
    // 세션 정보 가져오기
    const session = await getImageSession();
    
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // userId는 number 타입이어야 함 (schema.prisma 기준)
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);
    
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
      const { success, imageUrl } = await generateAndUploadImage({
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
      let thumbnailUrl = generatePublicVariantUrl(imageUrl);
      
      // DB 저장 시작 시간
      console.time('DB저장');
      
      // DB 저장 최적화: 필수 필드만 저장하여 응답 시간 단축
      const newImage = await db.aIImage.create({
        data: {
          userId,
          title: `AI 이미지 - ${prompt.substring(0, 30)}...`,
          description: prompt,
          category: "AI",
          prompt,
          negativePrompt: negativePrompt || "",
          width,
          height,
          model: modelId,
          steps,
          cfgScale,
          sampler,
          vae: vae || null,
          isPermanent: false,
          isPublic: false,
          fileUrl: imageUrl,
          thumbnailUrl,
          format: "png"
        },
        // 필요한 필드만 선택하여 쿼리 최적화
        select: {
          id: true,
          fileUrl: true
        }
      });
      
      console.timeEnd('DB저장');
      console.timeEnd('전체요청');
      
      return NextResponse.json({
        success: true,
        image: {
          id: newImage.id,
          url: newImage.fileUrl,
        }
      });
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      
      // 에러 메시지 최적화
      let errorMessage = "이미지 생성 중 오류가 발생했습니다";
      
      if (error.message?.includes("NSFW")) {
        errorMessage = "안전하지 않은 콘텐츠가 감지되었습니다. 다른 프롬프트를 사용해주세요.";
      }
      
      return NextResponse.json({ 
        success: false, 
        error: errorMessage,
        details: error.message
      }, { status: 500 });
    }
  } catch (error: any) {
    console.error("API 요청 처리 중 예외 발생:", error);
    return NextResponse.json({ 
      success: false, 
      error: "서버 오류가 발생했습니다"
    }, { status: 500 });
  }
} 