import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: '로그인이 필요합니다' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const width = formData.get('width') ? Number(formData.get('width')) : undefined;
    const height = formData.get('height') ? Number(formData.get('height')) : undefined;
    const usePublicVariant = formData.get('usePublicVariant') === 'true';

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    // Cloudflare Images를 사용하여 파일 업로드
    const uploadResponse = await uploadToCloudflare(file, {
      width,
      height,
      usePublicVariant
    });

    return NextResponse.json({ url: uploadResponse.url });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json({ error: '파일 업로드에 실패했습니다', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// 크기 기반 변형자 선택 함수
function selectVariantBySize(
  allVariants: string[], 
  options: { 
    width?: number; 
    height?: number; 
    usePublicVariant?: boolean;
  }
) {
  const { width, height, usePublicVariant } = options;
  
  // 작은 이미지 기준 (작은 이미지는 public 변형자 사용)
  const SMALL_IMAGE_THRESHOLD = 600; // 600px 이하면 작은 이미지로 간주
  
  // usePublicVariant 플래그가 명시적으로 true면 public 변형자 사용
  if (usePublicVariant) {
    const publicVariant = allVariants.find(v => v.includes('/public'));
    if (publicVariant) return publicVariant;
  }

  // 크기에 따른 변형자 선택
  if (width && height) {
    // 작은 이미지면 public 사용
    if (width <= SMALL_IMAGE_THRESHOLD && height <= SMALL_IMAGE_THRESHOLD) {
      const publicVariant = allVariants.find(v => v.includes('/public'));
      if (publicVariant) return publicVariant;
    }
    
    // 가로가 더 긴 이미지는 width 변형자 사용
    if (width > height) {
      const widthVariant = allVariants.find(v => v.includes('/width'));
      if (widthVariant) return widthVariant;
    } 
    // 세로가 더 긴 이미지는 height 변형자 사용
    else if (height > width) {
      const heightVariant = allVariants.find(v => v.includes('/height'));
      if (heightVariant) return heightVariant;
    }
  }
  
  // 기본값: normal 변형자 (일반적인 크기 조정)
  const normalVariant = allVariants.find(v => v.includes('/normal'));
  if (normalVariant) return normalVariant;
  
  // 마지막 대안: 첫 번째 변형자 반환
  return allVariants[0];
}

// Cloudflare Images 업로드 함수
async function uploadToCloudflare(
  file: File, 
  options: { 
    width?: number; 
    height?: number; 
    usePublicVariant?: boolean;
  } = {}
) {
  try {
    console.log("Cloudflare 업로드 프로세스 시작...");
    
    // 1. Cloudflare 다이렉트 업로드 URL 받기
    const uploadUrlResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    if (!uploadUrlResponse.ok) {
      const errorText = await uploadUrlResponse.text();
      console.error("Cloudflare 업로드 URL 응답 오류:", uploadUrlResponse.status, errorText);
      throw new Error(`Cloudflare 업로드 URL 요청 실패: ${uploadUrlResponse.status}`);
    }
    
    const uploadUrlData = await uploadUrlResponse.json();
    
    if (!uploadUrlData.success) {
      console.error("Cloudflare 업로드 URL 응답 실패:", uploadUrlData);
      throw new Error("Cloudflare 업로드 URL 요청이 실패했습니다");
    }
    
    console.log("Cloudflare 업로드 URL 받기 성공");
    
    // 2. 다이렉트 업로드 URL에 파일 업로드
    const formData = new FormData();
    formData.append('file', file);
    
    const uploadURL = uploadUrlData.result.uploadURL;
    console.log("업로드 URL:", uploadURL);
    
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error("Cloudflare 파일 업로드 오류:", uploadResponse.status, errorText);
      throw new Error(`Cloudflare 파일 업로드 실패: ${uploadResponse.status}`);
    }
    
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success) {
      console.error("Cloudflare 파일 업로드 응답 실패:", uploadResult);
      throw new Error("Cloudflare 파일 업로드가 실패했습니다");
    }
    
    console.log("Cloudflare 파일 업로드 성공");
    
    // 3. 크기 기반 변형자 선택
    const variants = uploadResult.result.variants;
    const selectedVariant = selectVariantBySize(variants, options);
    
    return {
      success: true,
      url: selectedVariant,
      id: uploadResult.result.id
    };
  } catch (error) {
    console.error("Cloudflare 업로드 프로세스 오류:", error);
    throw error;
  }
} 