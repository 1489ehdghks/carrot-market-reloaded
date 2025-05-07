import React from 'react';
import { notFound } from 'next/navigation';
import { db } from "@/shared/lib/db";
import ImageDetailForm from "@/widgets/image/shared/imageDetailForm";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

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

export default async function AIImageDetailPage({ params }: PageProps) {
  // params를 비동기적으로 처리
  const resolvedParams = await params;
  const imageId = parseInt(resolvedParams.id);
  
  // 유효하지 않은 ID 처리
  if (isNaN(imageId)) {
    notFound();
  }
  
  // 이미지 데이터 조회
  const image = await db.aIImage.findUnique({
    where: {
      id: imageId,
    },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      prompt: true,
      negativePrompt: true,
      model: true,
      width: true, 
      height: true,
      steps: true,
      cfgScale: true,
      sampler: true,
      vae: true,
      created_at: true,
      userId: true,
    }
  });
  
  // 이미지가 없는 경우 404 페이지 표시
  if (!image) {
    notFound();
  }
  
  // 최적의 이미지 URL 선택
  const optimizedFileUrl = selectBestVariant(image.fileUrl, image.width, image.height);
  
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">이미지 상세</h1>
        <p className="text-neutral-400 mt-1">생성된 이미지와 설정 정보를 확인할 수 있습니다.</p>
      </div>
      
      <ImageDetailForm 
        image={{
          id: image.id,
          title: image.title || "제목 없음",
          fileUrl: optimizedFileUrl,
          thumbnailUrl: optimizedFileUrl,
          settings: {
            prompt: image.prompt,
            negativePrompt: image.negativePrompt || "",
            model: image.model,
            size: `${image.width}x${image.height}`,
            steps: image.steps || 30,
            cfgScale: image.cfgScale || 7,
            sampler: image.sampler || "default",
            vae: image.vae || "default"
          },
          createdAt: new Date(image.created_at).toISOString()
        }}
      />
    </div>
  );
} 