import { NextResponse } from 'next/server';
import { getSession } from '@/shared/lib/auth';
import { db } from '@/shared/lib/db';

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { error: '로그인이 필요합니다.' },
        { status: 401 }
      );
    }

    const { id } = params;
    const body = await req.json();
    const { status, fileUrl, thumbnailUrl } = body;

    // 이미지 존재 여부 및 소유권 확인
    const image = await db.aIImage.findUnique({
      where: { id: parseInt(id) }
    });

    if (!image) {
      return NextResponse.json(
        { error: '이미지를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    if (image.userId !== session.id) {
      return NextResponse.json(
        { error: '권한이 없습니다.' },
        { status: 403 }
      );
    }

    // 이미지 상태 업데이트
    const updatedImage = await db.aIImage.update({
      where: { id: parseInt(id) },
      data: {
        status,
        ...(fileUrl && { fileUrl }),
        ...(thumbnailUrl && { thumbnailUrl })
      }
    });

    return NextResponse.json(updatedImage);
  } catch (error) {
    console.error('이미지 상태 업데이트 오류:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : '이미지 상태 업데이트 중 오류가 발생했습니다.',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    );
  }
} 