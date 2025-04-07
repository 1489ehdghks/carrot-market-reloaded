import { NextRequest, NextResponse } from "next/server";
import { getImageSession } from '@/features/image/process/imageSessionService';
import { db } from '@/shared/lib/db';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getImageSession();
    if (!session?.id) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const image = await db.aIImage.findUnique({
      where: { 
        id: Number(params.id),
        userId: session.id
      },
      include: {
        user: {
          select: {
            username: true,
            avatar: true
          }
        }
      }
    });

    if (!image) {
      return NextResponse.json({ error: '이미지를 찾을 수 없습니다' }, { status: 404 });
    }

    return NextResponse.json(image);
  } catch (error) {
    console.error('이미지 정보 조회 중 오류:', error);
    return NextResponse.json({ error: '서버 오류가 발생했습니다' }, { status: 500 });
  }
} 