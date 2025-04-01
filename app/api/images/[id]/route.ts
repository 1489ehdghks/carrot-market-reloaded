import { NextRequest, NextResponse } from "next/server";
import { db } from "@/shared/lib/db";
import { getImageSession } from "@/app/lib/imageSessionService"; // 이미지 서비스용 세션 사용

// Cloudflare 이미지 URL에서 최적의 변형자를 선택하는 함수
function selectBestVariant(fileUrl: string, width: number, height: number): string {
  if (!fileUrl) return '';
  
  // 기본 URL에서 변형자가 있다면 제거
  const baseUrl = fileUrl.split('/').slice(0, -1).join('/');
  
  // 이미지 크기에 따라 최적의 변형자 선택
  const SMALL_IMAGE_THRESHOLD = 600; // 600px 이하면 작은 이미지로 간주
  
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
 * 특정 ID의 이미지 정보를 조회하는 API 엔드포인트
 * 
 * 파라미터:
 * - id: 이미지 ID
 * 
 * 응답:
 * - image 객체: 이미지 정보
 * - success: 성공 여부
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    
    // 이미지 ID 파싱
    const imageId = params.id;
    if (!imageId) {
      return NextResponse.json(
        { success: false, error: "이미지 ID가 필요합니다" },
        { status: 400 }
      );
    }
    
    // 이미지 정보 조회 - 타입 오류 해결: string 타입 ID를 사용할 수 있도록 수정
    const image = await db.aIImage.findFirst({
      where: {
        id: parseInt(imageId, 10), // 문자열 ID를 숫자로 변환
        userId: userId // session.id 대신 변환된 userId 사용
      }
    });
    
    if (!image) {
      return NextResponse.json(
        { success: false, error: "이미지를 찾을 수 없습니다" },
        { status: 404 }
      );
    }
    
    // 최적의 이미지 URL 선택
    const optimizedFileUrl = selectBestVariant(image.fileUrl, image.width, image.height);
    const optimizedThumbnailUrl = image.thumbnailUrl 
      ? selectBestVariant(image.thumbnailUrl, image.width, image.height)
      : optimizedFileUrl;
    
    // 응답 데이터 구성
    const imageData = {
      id: image.id,
      title: image.title,
      description: image.description,
      settings: {
        prompt: image.prompt,
        negativePrompt: image.negativePrompt || "",
        modelId: image.model,
        width: image.width,
        height: image.height,
        steps: image.steps || 30,
        cfgScale: image.cfgScale || 7,
        sampler: image.sampler || "DPM++ 2M Karras",
        vae: image.vae || ""
      },
      fileUrl: optimizedFileUrl,
      thumbnailUrl: optimizedThumbnailUrl,
      isOwner: session && userId === image.userId
    };
    
    return NextResponse.json({
      success: true,
      image: {
        ...imageData,
        settings: image.settings ? JSON.parse(image.settings as string) : {}
      }
    });
    
  } catch (error) {
    console.error("이미지 정보 조회 중 오류:", error);
    
    return NextResponse.json(
      { success: false, error: "이미지 정보 조회 중 오류가 발생했습니다" },
      { status: 500 }
    );
  }
} 