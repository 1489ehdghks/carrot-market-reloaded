import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { v4 as uuidv4 } from 'uuid';
import replicate from '@/lib/replicate';
import { uploadTempImage } from '@/lib/cloudflare';

// 인페인팅 API 라우트
export async function POST(req: Request) {
  try {
    // 세션 체크 (인증된 사용자만 접근 가능)
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: '인증이 필요합니다' },
        { status: 401 }
      );
    }

    // 요청 데이터 파싱
    const data = await req.json();
    const { imageUrl, maskDataUrl, prompt } = data;

    // 필수 데이터 검증
    if (!imageUrl || !maskDataUrl || !prompt) {
      return NextResponse.json(
        { success: false, error: '필수 매개변수가 누락되었습니다' },
        { status: 400 }
      );
    }

    // 마스크 이미지를 Cloudflare에 업로드
    const maskUrl = await uploadTempImage(maskDataUrl);
    if (!maskUrl) {
      return NextResponse.json(
        { success: false, error: '마스크 이미지 업로드에 실패했습니다' },
        { status: 500 }
      );
    }
    
    console.log('인페인팅 요청:', {
      imageUrl: imageUrl.slice(0, 30) + '...',
      maskUrl: maskUrl.slice(0, 30) + '...',
      prompt: prompt.slice(0, 30) + '...'
    });

    // Replicate API를 사용한 인페인팅 처리
    const output = await replicate.run(
      "stability-ai/stable-diffusion-inpainting:c28b92a7ecd66eee4aefcd8a94eb9e7f6c3805d5f06038165407fb5cb422a7fb",
      {
        input: {
          image: imageUrl,
          mask: maskUrl,
          prompt: prompt,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 25,
        },
      }
    );

    console.log('인페인팅 결과:', output);

    // 출력이 배열인지 확인하고 첫 번째 항목을 가져옴
    let generatedImageUrl = Array.isArray(output) && output.length > 0 
      ? output[0] 
      : (output as any)?.image || null;

    if (!generatedImageUrl) {
      return NextResponse.json(
        { success: false, error: '이미지 생성에 실패했습니다' },
        { status: 500 }
      );
    }

    // Cloudflare에 이미지 업로드 (선택적)
    // let finalImageUrl = generatedImageUrl;
    // try {
    //   const uploadedUrl = await uploadTempImage(generatedImageUrl);
    //   if (uploadedUrl) {
    //     finalImageUrl = uploadedUrl;
    //   }
    // } catch (error) {
    //   console.error('Cloudflare 업로드 실패, 원본 URL 사용:', error);
    // }

    // 이미지 정보 데이터베이스에 저장
    const imageId = uuidv4();
    await prisma.generatedImage.create({
      data: {
        id: imageId,
        imageUrl: generatedImageUrl,
        userId: session.user.id,
        prompt: prompt,
        isPublic: false,
        type: 'inpainting',
        settings: {
          originalImageUrl: imageUrl,
        },
      },
    });

    // 성공 응답 반환
    return NextResponse.json({
      success: true,
      imageUrl: generatedImageUrl,
      imageId: imageId,
    });
  } catch (error: any) {
    console.error('인페인팅 처리 오류:', error);
    return NextResponse.json(
      { success: false, error: error.message || '인페인팅 처리 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 