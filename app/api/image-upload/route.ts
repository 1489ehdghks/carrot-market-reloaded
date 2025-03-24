import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadLocalFile } from '@/lib/cloudflare';

/**
 * 이미지 업로드를 처리하는 API 엔드포인트
 * 
 * 요청 본문:
 * - FormData with 'file' field
 * 
 * 응답:
 * - success: 성공 여부
 * - fileUrl: 이미지 URL (Cloudflare 또는 임시 경로)
 * - fileKey: 이미지 식별 키
 */
export async function POST(request: NextRequest) {
  try {
    // 세션 확인 (인증된 사용자만 업로드 가능)
    const session = await getSession();
    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: '로그인이 필요합니다' },
        { status: 401 }
      );
    }

    // FormData 파싱
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    
    // 파일 검증
    if (!file) {
      return NextResponse.json(
        { success: false, error: '이미지 파일이 필요합니다' },
        { status: 400 }
      );
    }
    
    // 파일 타입 검사
    if (!file.type.startsWith('image/')) {
      return NextResponse.json(
        { success: false, error: '이미지 파일만 업로드할 수 있습니다' },
        { status: 400 }
      );
    }
    
    console.log('이미지 업로드 요청:', {
      fileName: file.name,
      fileSize: `${Math.round(file.size / 1024)}KB`,
      fileType: file.type
    });
    
    // 이미지 크기 추출 (formData에서)
    let width = parseInt(formData.get('width') as string || '0', 10) || undefined;
    let height = parseInt(formData.get('height') as string || '0', 10) || undefined;
    
    // Cloudflare 유틸리티 함수를 사용하여 파일 업로드
    const uploadResult = await uploadLocalFile(file, width, height);
    
    if (!uploadResult.success || !uploadResult.url) {
      console.error('Cloudflare 업로드 실패:', uploadResult.error);
      return NextResponse.json(
        { success: false, error: uploadResult.error || '이미지 업로드 실패' },
        { status: 500 }
      );
    }
    
    // 최종 결과 반환
    return NextResponse.json({
      success: true,
      fileUrl: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      fileKey: uploadResult.id // 이미지 ID를 키로 반환
    });
    
  } catch (error: any) {
    console.error('이미지 업로드 중 오류:', error.message || '알 수 없는 오류');
    
    return NextResponse.json(
      { success: false, error: error.message || '이미지 업로드 중 오류가 발생했습니다' },
      { status: 500 }
    );
  }
} 