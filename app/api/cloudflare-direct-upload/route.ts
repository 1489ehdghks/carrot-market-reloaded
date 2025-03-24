import { NextRequest, NextResponse } from "next/server";
import { handleGlobalError, UserFacingError } from "../../lib/error-handling";
import { uploadLocalFile, selectVariantBySize, generateVariantUrls } from "@/lib/cloudflare";

/**
 * 로컬 이미지 파일을 Cloudflare Images에 직접 업로드하는 API 엔드포인트
 * 
 * 요청 본문:
 * - FormData with 'file' field
 * - width: 이미지 너비 (FormData에 추가 가능)
 * - height: 이미지 높이 (FormData에 추가 가능)
 * 
 * 응답:
 * - success: 성공 여부
 * - url: 영구 저장된 이미지 URL (적절한 variant 선택)
 * - thumbnailUrl: 썸네일 URL (항상 public variant)
 * - id: Cloudflare 이미지 ID
 */
export async function POST(request: NextRequest) {
  try {
    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    let width = parseInt(formData.get('width') as string || '0', 10) || undefined;
    let height = parseInt(formData.get('height') as string || '0', 10) || undefined;
    
    // 파일 검증
    if (!file) {
      return NextResponse.json(
        { success: false, error: "이미지 파일이 필요합니다" },
        { status: 400 }
      );
    }
    
    console.log("로컬 이미지 업로드 정보:", {
      fileName: file.name,
      fileSize: `${Math.round(file.size / 1024)} KB`, 
      fileType: file.type, 
      width, 
      height
    });
    
    // 이미지 크기 정보가 없는 경우 기본값 설정
    if (!width || !height) {
      console.log("이미지 크기 정보가 없음, 기본값 설정");
      width = width || 768;
      height = height || 768;
    }
    
    // cloudflare.ts의 uploadLocalFile 함수를 사용하여 파일 업로드
    const uploadResult = await uploadLocalFile(file, width, height);
    
    if (!uploadResult.success || !uploadResult.url) {
      throw new Error(uploadResult.error || "이미지 업로드에 실패했습니다");
    }
    
    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      id: uploadResult.id,
      variants: uploadResult.variants
    });
    
  } catch (error: any) {
    console.error("직접 업로드 중 오류:", error);
    
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