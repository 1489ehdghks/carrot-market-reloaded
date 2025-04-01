/**
 * 이미지 다운로드를 위한 유틸리티 함수
 */

interface DownloadOptions {
  filename?: string;
  format?: 'png' | 'jpg' | 'jpeg' | 'webp';
  quality?: number;
}

/**
 * 이미지를 다운로드합니다.
 * @param imageUrl - 다운로드할 이미지의 URL
 * @param options - 다운로드 옵션
 */
export async function downloadImage(imageUrl: string, options: DownloadOptions = {}) {
  try {
    // 기본 옵션 설정
    const {
      filename = `image-${Date.now()}`,
      format = 'png',
      quality = 0.9
    } = options;

    // 이미지 데이터 가져오기
    const response = await fetch(imageUrl);
    if (!response.ok) throw new Error('이미지 다운로드 실패');
    
    const blob = await response.blob();
    
    // 이미지 포맷 변환을 위한 캔버스 생성
    const img = new Image();
    img.src = URL.createObjectURL(blob);
    
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });
    
    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 컨텍스트 생성 실패');
    
    // 이미지 그리기
    ctx.drawImage(img, 0, 0);
    
    // 선택한 포맷으로 변환
    const mimeType = `image/${format}`;
    const dataUrl = canvas.toDataURL(mimeType, quality);
    
    // 다운로드 링크 생성
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = `${filename}.${format}`;
    
    // 다운로드 실행
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 메모리 정리
    URL.revokeObjectURL(img.src);
    
    return true;
  } catch (error) {
    console.error('이미지 다운로드 중 오류:', error);
    throw error;
  }
}

/**
 * 이미지 URL을 Blob으로 변환합니다.
 * @param imageUrl - 변환할 이미지 URL
 * @returns Promise<Blob>
 */
export async function imageUrlToBlob(imageUrl: string): Promise<Blob> {
  const response = await fetch(imageUrl);
  if (!response.ok) throw new Error('이미지 다운로드 실패');
  return response.blob();
}

/**
 * Blob을 Base64 문자열로 변환합니다.
 * @param blob - 변환할 Blob
 * @returns Promise<string>
 */
export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
} 