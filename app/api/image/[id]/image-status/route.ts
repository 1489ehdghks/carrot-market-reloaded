import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/shared/lib/db';
import getSession from '@/shared/lib/session';

/**
 * 이미지 업로드 상태 확인 API 엔드포인트
 * 
 * @param request - 요청 객체
 * @param params - URL 파라미터 (이미지 ID 포함)
 * @returns 이미지 상태 정보
 */
export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    // params.id를 변수에 먼저 할당하여 동기적으로 처리
    const params = await context.params;
    const imageIdParam = params.id;
    console.log(`[API] 이미지 상태 확인 요청: ID=${imageIdParam}`);
    
    // 세션 확인 (인증이 필요한 경우 활성화)
    const session = await getSession();
    if (!session?.id) {
      console.log(`[API] 인증 실패: 세션 없음`);
      return NextResponse.json(
        { error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    if (!imageIdParam || isNaN(Number(imageIdParam))) {
      console.log(`[API] 잘못된 ID 형식: ${imageIdParam}`);
      return NextResponse.json(
        { error: '유효하지 않은 이미지 ID입니다' },
        { status: 400 }
      );
    }

    const imageId = Number(imageIdParam);
    console.log(`[API] 이미지 조회 시도: ID=${imageId}, 사용자 ID=${session.id}`);

    // DB에서 이미지 정보 조회
    const image = await db.aIImage.findUnique({
      where: { 
        id: imageId,
        userId: session.id // 자신의 이미지만 조회 가능
      }
    });

    if (!image) {
      console.log(`[API] 이미지 없음: ID=${imageId}, 사용자 ID=${session.id}`);
      return NextResponse.json(
        { error: '이미지를 찾을 수 없거나 접근 권한이 없습니다' },
        { status: 404 }
      );
    }

    console.log(`[API] 이미지 조회 성공: ID=${imageId}, isPermanent=${image.isPermanent}, status=${image.status}`);
    
    // 업로드 상태 정보 반환
    return NextResponse.json({
      id: image.id,
      isPermanent: image.isPermanent,
      fileUrl: image.fileUrl,
      thumbnailUrl: image.thumbnailUrl,
      status: image.status,
      createdAt: image.created_at,
      updatedAt: image.updated_at
    });
  } catch (error) {
    console.error('[API] 이미지 상태 확인 중 오류:', error);
    return NextResponse.json(
      { error: '이미지 상태 확인 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 