import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getImageSession } from "@/app/lib/imageSessionService"; // 이미지 서비스용 세션 사용


// Cloudflare 이미지 URL에서 최적의 변형자를 선택하는 함수
function selectBestVariant(fileUrl: string, width: number, height: number): string {
  if (!fileUrl) return '';
  
  // 기본 URL에서 변형자가 있다면 제거
  const baseUrl = fileUrl.split('/').slice(0, -1).join('/');
  
  // 이미지 크기에 따라 최적의 변형자 선택
  const SMALL_IMAGE_THRESHOLD = 400; // 400px 이하면 작은 이미지로 간주
  
  // 작은 이미지면 public 사용
  if (width <= SMALL_IMAGE_THRESHOLD && height <= SMALL_IMAGE_THRESHOLD) {
    return `${baseUrl}/public`;
  }
  
  // 가로가 더 긴 이미지는 width 변형자 사용
  if (width > height) {
    return `${baseUrl}/width`;
  } 
  // 세로가 더 긴 이미지는 height 변형자 사용
  else if (height > width) {
    return `${baseUrl}/height`;
  }
  
  // 기본값: normal 변형자
  return `${baseUrl}/normal`;
}

/**
 * 사용자의 최근 생성한 이미지 목록을 가져오는 API 엔드포인트
 * 
 * 쿼리 파라미터:
 * - limit: 가져올 최대 이미지 수 (기본값: 10)
 * - public: 공개 이미지만 가져올지 여부 (기본값: false)
 * 
 * 응답:
 * - images: 이미지 배열
 * - success: 성공 여부
 */
export async function GET(request: NextRequest) {
  try {
    // 세션 확인
    const session = await getImageSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: "로그인이 필요합니다" },
        { status: 401 }
      );
    }
    
    // userId는 number 타입이어야 함 (schema.prisma 기준)
    const userId = typeof session.id === 'number' ? session.id : parseInt(String(session.id), 10);
    
    // 쿼리 파라미터 가져오기
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get("limit");
    const publicOnly = searchParams.get("public") === "true";
    
    // 파라미터 유효성 검사 및 기본값 설정
    const limit = limitParam ? parseInt(limitParam) : 10;
    
    // 최근 이미지 조회
    const images = await db.aIImage.findMany({
      where: {
        userId: userId, // session.id 대신 변환된 userId 사용
        ...(publicOnly ? { isPublic: true } : {})
      },
      orderBy: {
        created_at: "desc"
      },
      take: limit,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        fileUrl: true,
        created_at: true,
        width: true,
        height: true,
        isPublic: true
      }
    });
    
    // 성공 응답
    return NextResponse.json({
      success: true,
      images
    });
    
  } catch (error) {
    console.error("최근 이미지 조회 중 오류:", error);
    
    return NextResponse.json(
      { success: false, error: "이미지 목록 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
}

/**
 * 날짜를 상대적 시간 형식으로 변환하는 함수
 * 
 * @param date - 변환할 날짜
 * @returns 상대적 시간 문자열 (예: "방금 전", "5분 전", "3일 전")
 */
function formatDateToRelativeTime(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return "방금 전";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes}분 전`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours}시간 전`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days}일 전`;
  } else {
    // 날짜 형식으로 표시
    return date.toLocaleDateString('ko-KR', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
} 