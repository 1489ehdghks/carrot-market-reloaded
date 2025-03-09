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

    if (!file) {
      return NextResponse.json({ error: '파일이 없습니다' }, { status: 400 });
    }

    // Cloudflare Images를 사용하여 파일 업로드
    const uploadResponse = await uploadToCloudflare(file);

    return NextResponse.json({ url: uploadResponse.url });
  } catch (error) {
    console.error('파일 업로드 오류:', error);
    return NextResponse.json({ error: '파일 업로드에 실패했습니다', details: error instanceof Error ? error.message : String(error) }, { status: 500 });
  }
}

// Cloudflare Images 업로드 함수
async function uploadToCloudflare(file: File) {
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
    
    // 3. 영구 URL 반환
    const permanentUrl = uploadResult.result.variants[0];
    return {
      success: true,
      url: permanentUrl,
      id: uploadResult.result.id
    };
  } catch (error) {
    console.error("Cloudflare 업로드 프로세스 오류:", error);
    throw error;
  }
} 