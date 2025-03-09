import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { z } from "zod";

/**
 * Face Swap API 엔드포인트
 * 
 * 소스 이미지의 얼굴을 타겟 이미지에 적용합니다.
 * cdingram/face-swap Replicate 모델 사용
 * 
 * [요청 형식]
 * POST /api/face-swap
 * 
 * [요청 본문]
 * {
 *   "target_image": "https://..." 또는 "data:image/...",  // 얼굴을 바꿀 대상 이미지 URL 또는 base64
 *   "source_image": "https://..." 또는 "data:image/...",  // 얼굴 소스 이미지 URL 또는 base64
 *   "strength": 0.8                                      // 적용 강도 (0.1 ~ 1.0)
 * }
 * 
 * [응답 형식]
 * {
 *   "success": true,
 *   "imageUrl": "https://..."      // 얼굴이 교체된 이미지 URL
 * }
 */

// 이미지 값 검증 함수 (URL 또는 base64)
const isValidImage = (value: string) => {
  return value.startsWith('http') || value.startsWith('data:image/');
};

// 요청 스키마 검증
const faceSwapSchema = z.object({
  target_image: z.string().refine(isValidImage, "유효한 타겟 이미지 URL이나 base64 데이터가 필요합니다."),
  source_image: z.string().refine(isValidImage, "유효한 소스 이미지 URL이나 base64 데이터가 필요합니다."),
  strength: z.number().min(0.1).max(1.0).default(0.8)
});

export async function POST(request: Request) {
  try {
    // 세션 확인 (인증된 사용자만 허용)
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 로깅
    console.log("Face Swap 요청:", {
      targetImage: body.target_image?.substring(0, 50) + "...",
      sourceImage: body.source_image?.substring(0, 50) + "...",
      strength: body.strength
    });
    
    // 스키마 검증
    const validationResult = faceSwapSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "유효하지 않은 요청 형식입니다", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { target_image, source_image, strength } = validationResult.data;
    
    // Replicate API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // 모델 버전 지정
        version: "d1d6ea8c8be89d664a07a457526f7128109dee7030fdac424788d762c71ed111",
        input: {
          input_image: target_image,
          swap_image: source_image,
          strength
        }
      })
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error("Replicate API 응답 오류:", errorData);
      throw new Error(`Face Swap API 오류 (${response.status})`);
    }
    
    const prediction = await response.json();
    console.log("Face Swap 예측 생성 시작:", prediction.id);
    
    // 예측 상태 확인하며 대기
    let result;
    let status = prediction.status;
    
    // 최대 60초 동안 결과 대기 (20번 폴링, 각 3초)
    for (let i = 0; i < 20; i++) {
      if (status === "succeeded") {
        result = prediction.output;
        break;
      } else if (status === "failed" || status === "canceled") {
        throw new Error(`Face Swap 예측 실패: ${prediction.error || "알 수 없는 오류"}`);
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
    
    if (!result) {
      throw new Error("Face Swap에서 이미지 URL을 받지 못했습니다");
    }
    
    // Face Swap 모델은 output으로 이미지 URL을 직접 반환
    const imageUrl = result;
    console.log("Face Swap 완료:", imageUrl.substring(0, 50) + "...");
    
    return NextResponse.json({
      success: true,
      imageUrl
    });
    
  } catch (error: any) {
    console.error("[FACE_SWAP_API_ERROR]", error);
    return NextResponse.json({ 
      success: false,
      error: "Face Swap 처리 중 오류가 발생했습니다", 
      message: error.message 
    }, { status: 500 });
  }
} 