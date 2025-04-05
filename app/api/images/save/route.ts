import { NextRequest, NextResponse } from "next/server";
import { handleGlobalError, UserFacingError } from "../../../../shared/constants/lib/error-handling";
import { db } from "@/shared/lib/db";
import { getImageSession } from "@/shared/constants/lib/imageSessionService";
/**
 * 이미지 정보를 데이터베이스에 저장하는 API 엔드포인트
 * 
 * 요청:
 * - prompt: 이미지 생성에 사용된 프롬프트
 * - fileUrl: Cloudflare에 저장된 이미지 URL
 * - thumbnailUrl: 썸네일 URL (선택적)
 * - modelId: 사용된 AI 모델 ID
 * - negativePrompt: 제외 프롬프트 (선택적)
 * - width: 이미지 너비 (선택적)
 * - height: 이미지 높이 (선택적)
 * - settings: 추가 설정 정보 (선택적)
 * 
 * 응답:
 * - success: 성공 여부
 * - id: 저장된 이미지 ID
 * - url: 이미지 URL
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getImageSession();
    if (!session || !session.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }
    
    // userId는 number 타입이어야 함 (schema.prisma 기준)
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);
    
    // 요청 본문 파싱
    const body = await request.json();
    const {
      prompt,
      fileUrl,
      thumbnailUrl,
      modelId,
      negativePrompt,
      width = 768,
      height = 768,
      settings = {}
    } = body;
    
    console.log("이미지 DB 저장 요청:", {
      userId: userId,
      model: modelId,
      width,
      height,
      promptLength: prompt?.length || 0,
      hasNegative: !!negativePrompt
    });
    
    // 필수 필드 검증
    if (!prompt || !fileUrl) {
      return NextResponse.json(
        { success: false, error: "프롬프트와 이미지 URL은 필수 항목입니다" },
        { status: 400 }
      );
    }
    
    // 데이터베이스에 저장
    const savedImage = await db.aIImage.create({
      data: {
        userId: userId, // session.id 대신 변환된 userId 사용
        prompt: prompt.substring(0, 5000), // 길이 제한
        fileUrl: fileUrl,
        thumbnailUrl: thumbnailUrl || fileUrl,
        model: modelId || "unknown",
        negativePrompt: negativePrompt?.substring(0, 2000) || "", // 길이 제한
        title: prompt.substring(0, 100), // 제목으로 사용
        description: prompt.substring(0, 1000), // 설명으로 사용
        category: "AI",
        width: width,
        height: height,
        format: "png",
        isPermanent: true, // Cloudflare에 저장된 이미지는 영구적
        isPublic: false, // 기본적으로 비공개
        settings: JSON.stringify(settings).substring(0, 10000) // 설정 정보 JSON으로 저장 (길이 제한)
      }
    });
    
    console.log("이미지 저장 완료:", savedImage.id);
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      id: savedImage.id,
      url: fileUrl
    });
    
  } catch (error: any) {
    console.error("이미지 저장 중 오류:", error);
    
    // 전역 에러 핸들러에 에러 전달
    handleGlobalError(error);
    
    // 오류 응답
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "이미지 정보 저장 중 오류가 발생했습니다" 
      },
      { status: 500 }
    );
  }
} 