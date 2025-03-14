import { NextResponse } from "next/server";
import { getImageUploadUrl } from "../../lib/imageService";

export async function GET() {
  try {
    // 세션 유효성 검사는 imageService 내부에서 처리
    const uploadUrlData = await getImageUploadUrl();
    
    if (!uploadUrlData || !uploadUrlData.result) {
      return NextResponse.json(
        { success: false, error: "Cloudflare 업로드 URL을 가져오는데 실패했습니다" },
        { status: 500 }
      );
    }
    
    return NextResponse.json(uploadUrlData);
  } catch (error: any) {
    console.error("Cloudflare URL 가져오기 오류:", error);
    
    return NextResponse.json(
      { success: false, error: error.message || "알 수 없는 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 