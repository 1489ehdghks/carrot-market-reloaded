import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { formatToTimeAgo } from "@/lib/utils";

/**
 * 사용자가 최근에 생성한 AI 이미지를 가져오는 API
 * 페이지네이션을 지원하며 page와 limit 쿼리 파라미터를 받습니다.
 *
 * @param req - Next.js 요청 객체
 * @returns 최근 생성된 AI 이미지 목록
 */
export async function GET(req: Request) {
  try {
    // 세션 정보 가져오기
    const session = await getSession();
    
    if (!session || !session.id) {
      return NextResponse.json({ error: "인증되지 않은 사용자입니다" }, { status: 401 });
    }
    
    // URL 쿼리 파라미터 파싱
    const url = new URL(req.url);
    const pageParam = url.searchParams.get('page') || '1';
    const limitParam = url.searchParams.get('limit') || '10';
    
    // 페이지네이션 파라미터 변환
    const page = parseInt(pageParam, 10);
    const limit = parseInt(limitParam, 10);
    const skip = (page - 1) * limit;
    
    // 유효성 검사
    if (isNaN(page) || isNaN(limit) || page < 1 || limit < 1 || limit > 20) {
      return NextResponse.json({ error: "잘못된 페이지 또는 한계값입니다" }, { status: 400 });
    }
    
    // 최근 생성된 이미지 조회
    const recentAIImages = await db.aIImage.findMany({
      where: {
        userId: session.id, // 자신의 이미지만 조회
        isPermanent: true, // 영구 저장된 이미지만
      },
      select: {
        id: true,
        title: true,
        fileUrl: true,
        created_at: true,
        prompt: true,
        negativePrompt: true,
        model: true,
        width: true,
        height: true,
        steps: true,
        cfgScale: true,
        sampler: true,
        vae: true
      },
      orderBy: {
        created_at: "desc"
      },
      skip,
      take: limit
    });
    
    // 응답 데이터 포맷팅
    const formattedImages = recentAIImages.map(image => ({
      id: image.id,
      title: image.title || "제목 없음",
      fileUrl: image.fileUrl,
      createdAt: formatToTimeAgo(image.created_at),
      // 이미지 생성 설정 정보 추가
      settings: {
        prompt: image.prompt,
        negativePrompt: image.negativePrompt || "",
        model: image.model,
        size: `${image.width}x${image.height}`,
        steps: image.steps || 30,
        cfgScale: image.cfgScale || 7.0,
        sampler: image.sampler || "default",
        vae: image.vae || "default"
      }
    }));
    
    return NextResponse.json(formattedImages);
  } catch (error) {
    console.error("[최근_AI이미지_조회_오류]:", error);
    return NextResponse.json({ error: "최근 이미지를 불러오는데 실패했습니다" }, { status: 500 });
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