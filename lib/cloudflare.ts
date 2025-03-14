import { v4 as uuidv4 } from 'uuid';

/**
 * base64 이미지 데이터를 파일로 변환
 */
export async function base64ToFile(dataUrl: string): Promise<File> {
  // 데이터 URL에서 MIME 타입과 base64 데이터 추출
  const regex = /^data:([^;]+);base64,(.+)$/;
  const matches = dataUrl.match(regex);
  
  if (!matches || matches.length !== 3) {
    throw new Error('유효하지 않은 데이터 URL 형식입니다.');
  }
  
  const mimeType = matches[1];
  const base64Data = matches[2];
  const binaryString = atob(base64Data);
  
  // 바이너리 데이터를 Uint8Array로 변환
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  // Blob 생성
  const blob = new Blob([bytes], { type: mimeType });
  
  // 파일명 생성 (UUID와 확장자 사용)
  const extension = mimeType.split('/')[1] || 'png';
  const filename = `${uuidv4()}.${extension}`;
  
  // File 객체 생성 및 반환
  return new File([blob], filename, { type: mimeType });
}

/**
 * 임시 이미지를 Cloudflare에 업로드
 */
export async function uploadTempImage(imageDataOrUrl: string): Promise<string> {
  try {
    // URL인지 데이터 URL인지 확인
    const isDataUrl = imageDataOrUrl.startsWith('data:');
    
    if (isDataUrl) {
      // 데이터 URL을 파일로 변환
      const file = await base64ToFile(imageDataOrUrl);
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', file);
      
      // Cloudflare 업로드 API 호출
      const response = await fetch('/api/cloudflareUpload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('이미지 업로드에 실패했습니다');
      }
      
      const result = await response.json();
      return result.url;
    } else {
      // 이미 URL인 경우 그대로 반환
      return imageDataOrUrl;
    }
  } catch (error) {
    console.error('이미지 업로드 오류:', error);
    throw error;
  }
} 