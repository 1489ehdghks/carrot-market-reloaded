import { NextResponse } from "next/server";
import getSession from "@/shared/lib/session";
import { z } from "zod";
import { getSpecialModelById } from "@/shared/models/image/specialModels";

/**
 * Face Swap API 엔드포인트
 * 
 * 소스 이미지의 얼굴을 타겟 이미지에 적용합니다.
 * 다양한 Face Swap 모델을 지원합니다.
 * 
 * [요청 형식]
 * POST /api/face-swap
 * 
 * [요청 본문]
 * {
 *   "model_id": "face-swap",                             // 사용할 Face Swap 모델 ID (선택적, 기본값: "face-swap")
 *   "target_image": "https://..." 또는 "data:image/...",  // 얼굴을 바꿀 대상 이미지 URL 또는 base64
 *   "source_image": "https://..." 또는 "data:image/...",  // 얼굴 소스 이미지 URL 또는 base64
 *   "strength": 0.8,                                     // 적용 강도 (0.1 ~ 1.0)
 *   ...모델별 추가 매개변수
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

// 기본 요청 스키마 검증 (동적 필드를 위해 먼저 기본 필드만 검증)
const baseFaceSwapSchema = z.object({
  model_id: z.string().optional().default('face-swap'),
  target_image: z.string().refine(isValidImage, "유효한 타겟 이미지 URL이나 base64 데이터가 필요합니다."),
  source_image: z.string().refine(isValidImage, "유효한 소스 이미지 URL이나 base64 데이터가 필요합니다."),
  strength: z.number().min(0.1).max(1.0).default(0.8)
}).passthrough(); // 추가 필드 허용

export async function POST(request: Request) {
  try {
    // 세션 확인 (인증된 사용자만 허용)
    const session = await getSession();
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // 요청 본문 파싱
    const body = await request.json();
    
    // 기본 스키마 검증
    const validationResult = baseFaceSwapSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json({ 
        error: "유효하지 않은 요청 형식입니다", 
        details: validationResult.error.format() 
      }, { status: 400 });
    }
    
    const { model_id = 'face-swap', target_image, source_image, strength, ...additionalParams } = validationResult.data;
    
    // 모델 정보 가져오기
    const modelInfo = getSpecialModelById(model_id);
    if (!modelInfo || modelInfo.category !== 'faceswap') {
      return NextResponse.json({ 
        error: `유효하지 않은 Face Swap 모델 ID: ${model_id}` 
      }, { status: 400 });
    }
    
    // 로깅
    console.log("Face Swap 요청:", {
      modelId: model_id,
      targetImage: target_image?.substring(0, 50) + "...",
      sourceImage: source_image?.substring(0, 50) + "...",
      strength,
      additionalParams: Object.keys(additionalParams).length > 0 ? '있음' : '없음'
    });
    
    // 모델 API 정보 추출 (owner/model:version 형식 또는 버전 없는 형식)
    let versionId = '';
    const apiModel = modelInfo.apiModel;
    
    if (apiModel.includes(':')) {
      const [_, version] = apiModel.split(':');
      versionId = version;
    } else {
      // 모델 정보에 버전이 없는 경우 오류 반환
      return NextResponse.json({ 
        error: `모델 정보에 버전 ID가 없습니다: ${apiModel}` 
      }, { status: 500 });
    }
    
    // 모델별 입력 파라미터 구성
    const modelInputs: Record<string, any> = {
      input_image: target_image,
      swap_image: source_image,
      strength
    };
    
    // 추가 매개변수 병합 (모델별 설정)
    if (Object.keys(additionalParams).length > 0) {
      Object.entries(additionalParams).forEach(([key, value]) => {
        // 네이밍 규칙에 따라 변환 (예: faceDetectionConfidence -> face_detection_confidence)
        const apiKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
        modelInputs[apiKey] = value;
      });
    }
    
    // Replicate API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        // 모델 버전 지정
        version: versionId,
        input: modelInputs
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
      imageUrl,
      modelUsed: model_id
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