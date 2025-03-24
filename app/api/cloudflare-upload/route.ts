import { NextRequest, NextResponse } from "next/server";
import { handleGlobalError, UserFacingError } from "../../lib/error-handling";
import { getImageSession } from '@/app/lib/imageSessionService';
import { uploadImageFromUrl } from "@/lib/cloudflare";

/**
 * 임시 이미지 URL을 Cloudflare Images에 업로드하고 영구 URL을 반환하는 API 엔드포인트
 * 
 * 요청 본문:
 * - imageUrl: 임시 이미지 URL 또는 Base64 데이터 URL
 * - imageId: 생성된 이미지 ID
 * - width: 이미지 너비 (선택)
 * - height: 이미지 높이 (선택)
 * 
 * 응답:
 * - success: 성공 여부
 * - url: 영구 저장된 이미지 URL (적절한 variant 선택)
 * - thumbnailUrl: 썸네일 URL (항상 public variant)
 * - id: Cloudflare 이미지 ID
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 정보 확인 (로그인 필요)
    const session = await getImageSession();
    if (!session?.id) {
      console.log('[Cloudflare 업로드] 인증되지 않은 요청');
      return NextResponse.json({ success: false, error: '로그인이 필요합니다' }, { status: 401 });
    }
    
    // userId는 number 타입이어야 함 (schema.prisma 기준)
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);

    // 요청 본문 파싱
    const body = await request.json();
    const { imageUrl, imageId = `img-${Date.now()}` } = body;
    const { width, height } = body;
    
    console.log("Cloudflare 업로드 요청:", {
      userId,
      imageId,
      width, 
      height,
      hasImageUrl: !!imageUrl,
      imageUrlPreview: imageUrl ? imageUrl.substring(0, 50) + '...' : 'none'
    });
    
    // 이미지 URL 유효성 검사
    if (!imageUrl) {
      return NextResponse.json(
        { success: false, error: '이미지 URL이 필요합니다' },
        { status: 400 }
      );
    }
    
    // 유틸리티 함수를 사용하여 URL 이미지 업로드
    const uploadResult = await uploadImageFromUrl(imageUrl, width, height);
    
    if (!uploadResult.success || !uploadResult.url) {
      console.error("이미지 업로드 실패:", uploadResult.error);
      throw new Error(uploadResult.error || "이미지 업로드에 실패했습니다");
    }
    
    console.log("이미지 업로드 성공:", {
      id: uploadResult.id,
      url: uploadResult.url?.substring(0, 50) + "...",
      thumbnailUrl: uploadResult.thumbnailUrl?.substring(0, 50) + "..."
    });
    
    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      id: uploadResult.id,
      variants: uploadResult.variants
    });
    
  } catch (error: any) {
    console.error("URL 업로드 중 오류:", error);
    
    // 전역 에러 핸들러에 에러 전달
    handleGlobalError(error);
    
    // 오류 응답 반환
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : "이미지 업로드 중 오류가 발생했습니다" 
      },
      { status: 500 }
    );
  }
} 