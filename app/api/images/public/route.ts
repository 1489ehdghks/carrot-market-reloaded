import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const publicImages = await db.aIImage.findMany({
      where: {
        isPublic: true
      },
      orderBy: {
        created_at: 'desc'
      },
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        fileUrl: true,
        created_at: true
      },
      take: 20 // 최근 20개만 가져오기
    });

    return NextResponse.json(publicImages);
  } catch (error) {
    console.error('Failed to fetch public images:', error);
    return NextResponse.json(
      { error: 'Failed to fetch public images' },
      { status: 500 }
    );
  }
} 