import { NextResponse } from "next/server";
import { getImageSession } from "@/app/lib/imageSessionService";
import { db } from "@/shared/lib/db";
import { z } from "zod";

// 서비스 레이어에서 필요한 함수들 가져오기 (유틸리티 함수만 사용)
import {
  generateImageWithReplicate,
  uploadToCloudflare,
  generatePublicVariantUrl,
  selectVariant,
  processImageBackground
} from "@/app/lib/imageService";

/**
 * 이미지 생성 API 엔드포인트 (단일 진입점)
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
  trackingId: z.string().optional(), // 클라이언트에서 추적용 ID (선택사항)
});

// 문자열 해시 함수
function hashString(str: string): string {
  // 매번 다른 이미지가 생성되도록 현재 시간과 무작위 값을 추가
  const randomComponent = `${Date.now()}-${Math.floor(Math.random() * 1000000)}`;
  const strWithRandom = str + randomComponent;
  
  let hash = 0;
  for (let i = 0; i < strWithRandom.length; i++) {
    const char = strWithRandom.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash.toString(16);
}

export async function POST(request: Request) {
  try {
    console.time('전체요청');
    
    // 세션 정보 가져오기
    const session = await getImageSession();
    
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // userId는 number 타입이어야 함
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 스키마 검증
    const validationResult = generateImageSchema.safeParse(body);
    
    if (!validationResult.success) {
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
      trackingId,
    } = validationResult.data;
    
    // 이미지 생성을 위한 임시 ID 생성
    console.log(`[API] 이미지 생성 프로세스 시작`);
    const tempId = `api-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // 항상 새로운 해시 생성 (기본 설정)
    const promptHash = hashString(`${userId}-${prompt}-${modelId}-${width}-${height}`);
    
    // 시드 생성
    const randomSeed = Math.floor(Math.random() * 2147483647); // 2^31-1, 최대 정수 범위
    console.log(`[API] Replicate API 호출 (시드: ${randomSeed}, 프롬프트: ${prompt.substring(0, 30)}...)`);
    
    // 이미지 생성 직접 호출 (비동기 대기)
    const imageResult = await generateImageWithReplicate({
      prompt: prompt,
      negativePrompt: negativePrompt,
      width: width,
      height: height,
      steps: steps,
      cfgScale: cfgScale,
      modelId: modelId,
      sampler: sampler,
      vae: vae,
      seed: randomSeed
    });
    
    // 실패 시 처리
    if (!imageResult.success || !imageResult.imageUrl) {
      console.error(`[API] 이미지 생성 실패: ${imageResult.error}`);
      return NextResponse.json({ 
        success: false,
        error: imageResult.error || "이미지 생성에 실패했습니다"
      }, { status: 500 });
    }
    
    const replicateImageUrl = imageResult.imageUrl;
    console.log(`[API] Replicate 이미지 생성 완료: ${replicateImageUrl.substring(0, 30)}...`);
    
    // DB에 저장할 설정 JSON 생성 (크기 제한)
    const settingsObj = {
      replicateUrl: replicateImageUrl.substring(0, 255), // URL 길이 제한
      tempId: tempId,
      promptHash: promptHash,
      trackingId: trackingId?.substring(0, 100) || null, // trackingId 길이 제한
      seed: randomSeed,
      source: "api-endpoint"
    };
    
    // 설정 JSON을 문자열로 변환
    const settingsJson = JSON.stringify(settingsObj);
    
    // DB에 이미지 저장 (길이 제한 적용)
    const imageData = {
      userId: userId,
      title: prompt.substring(0, 100), // 최대 100자로 제한
      description: prompt.substring(0, 500), // 최대 500자로 제한
      category: "AI",
      prompt: prompt.substring(0, 1000), // 최대 1000자로 제한
      negativePrompt: (negativePrompt || "").substring(0, 500), // 최대 500자로 제한
      width: width,
      height: height,
      model: modelId.substring(0, 100), // 모델 ID 길이 제한
      steps: steps,
      cfgScale: cfgScale,
      sampler: sampler.substring(0, 100), // 샘플러 길이 제한
      vae: vae ? vae.substring(0, 100) : null, // VAE 길이 제한
      fileUrl: replicateImageUrl.substring(0, 500), // URL 길이 제한
      thumbnailUrl: replicateImageUrl.substring(0, 500), // URL 길이 제한
      isPermanent: false, // 임시 상태
      isPublic: false,
      format: "png",
      settings: settingsJson.substring(0, 1000) // 설정 길이 제한
    };
    
    // 이미지 기본 정보만 빠르게 DB에 저장
    let savedImage = null;
    try {
      console.log(`[API] DB에 기본 이미지 정보 저장 중`);
      savedImage = await db.aIImage.create({ data: imageData });
      console.log(`[API] DB 저장 완료 (ID: ${savedImage.id})`);
    } catch (dbError) {
      // DB 저장 실패 시 자세한 에러 정보 로깅
      const dbErrorMsg = dbError instanceof Error ? dbError.message : "알 수 없는 DB 오류";
      console.log(`[API] DB 저장 실패: ${dbErrorMsg}`);
      
      // 에러 타입 로깅
      console.log(`[API] 에러 타입:`, typeof dbError);
      if (dbError && typeof dbError === 'object') {
        try {
          console.log(`[API] 에러 상세:`, JSON.stringify(dbError, null, 2));
        } catch (jsonError) {
          console.log(`[API] 에러 객체를 문자열로 변환할 수 없습니다`);
        }
      }
      
      // DB 저장 실패해도 Replicate URL을 반환하고 계속 진행
      console.timeEnd('전체요청');
      return NextResponse.json({
        success: true,
        image: {
          id: tempId,
          url: replicateImageUrl,
          tempUrl: replicateImageUrl // 임시 URL 추가
        }
      });
    }
    
    // 백그라운드에서 Cloudflare 업로드 및 DB 업데이트 진행 (비동기 처리)
    if (savedImage) {
      console.log(`[API] Cloudflare 백그라운드 업로드 스케줄링`);
      
      // 백그라운드 처리 시작 (await 없이 진행)
      processImageBackground(savedImage.id, replicateImageUrl).catch(error => {
        console.error(`[API] 백그라운드 처리 오류:`, error);
      });
    }
    
    // 응답 시간 로깅 및 응답 반환 (즉시 리턴)
    console.timeEnd('전체요청');
    return NextResponse.json({
      success: true,
      image: {
        id: savedImage ? savedImage.id : tempId,
        url: replicateImageUrl,
        tempUrl: replicateImageUrl, // 임시 URL도 함께 제공
        width,
        height
      }
    });
  } catch (error) {
    // 예외 발생 시 오류 로깅 및 에러 반환
    const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류";
    console.error(`[API] 요청 처리 중 예외 발생: ${errorMessage}`);
    
    return NextResponse.json({ 
      success: false, 
      error: errorMessage
    }, { status: 500 });
  }
}

// 이미지 상태 확인 API - 폴링 제거로 더 이상 필요 없음
// GET 메서드 제거 