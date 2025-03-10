import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    
    // 이미지 ID 가져오기
    const imageId = parseInt(params.id);
    
    if (isNaN(imageId)) {
      return NextResponse.json(
        { success: false, message: "유효하지 않은 이미지 ID입니다." },
        { status: 400 }
      );
    }
    
    // 데이터베이스에서 이미지 정보 가져오기
    const image = await db.aIImage.findUnique({
      where: { id: imageId },
      select: {
        id: true,
        title: true,
        description: true,
        prompt: true,
        negativePrompt: true,
        model: true,
        width: true,
        height: true,
        steps: true,
        cfgScale: true,
        sampler: true,
        vae: true,
        fileUrl: true,
        thumbnailUrl: true,
        userId: true,
        isPublic: true
      }
    });
    
    if (!image) {
      return NextResponse.json(
        { success: false, message: "이미지를 찾을 수 없습니다." },
        { status: 404 }
      );
    }
    
    // 이미지가 비공개인 경우 사용자 인증 확인
    if (!image.isPublic && (!session || session.id !== image.userId)) {
      return NextResponse.json(
        { success: false, message: "이 이미지에 접근할 권한이 없습니다." },
        { status: 403 }
      );
    }
    
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
      fileUrl: image.fileUrl,
      thumbnailUrl: image.thumbnailUrl,
      isOwner: session && session.id === image.userId
    };
    
    return NextResponse.json({ success: true, image: imageData });
  } catch (error) {
    console.error("[IMAGE_GET_ERROR]", error);
    return NextResponse.json(
      { success: false, message: "이미지 정보를 불러오는 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
} 