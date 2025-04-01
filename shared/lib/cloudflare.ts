import { v4 as uuidv4 } from 'uuid';

/**
 * Cloudflare 환경 변수 및 설정 인터페이스
 */
export interface CloudflareConfig {
  accountId: string;
  apiKey: string;
  accountHash: string;
  imageDeliveryUrl?: string;
}

/**
 * Cloudflare 업로드 결과 인터페이스
 */
export interface CloudflareUploadResult {
  success: boolean;
  url: string | null;
  thumbnailUrl?: string | null;
  id: string | null;
  error: string | null;
  variants?: {
    original: string;
    height: string;
    width: string;
    normal: string;
    public: string;
  } | null;
}

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
 * Cloudflare 환경 변수 확인 함수
 */
export function getCloudflareConfig(): CloudflareConfig {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiKey = process.env.CLOUDFLARE_API_KEY;
  const accountHash = process.env.CLOUDFLARE_ACCOUNT_HASH;
  const imageDeliveryUrl = process.env.CLOUDFLARE_IMAGE_DELIVERY_URL;
  
  if (!accountId || !apiKey || !accountHash) {
    throw new Error('Cloudflare 환경 변수가 설정되지 않았습니다');
  }
  
  return {
    accountId,
    apiKey,
    accountHash,
    imageDeliveryUrl
  };
}

/**
 * Cloudflare Direct Upload URL 획득 함수
 */
export async function getCloudflareDirectUploadUrl(): Promise<{ uploadURL: string; id: string }> {
  const { accountId, apiKey } = getCloudflareConfig();
  
  // API URL 생성
  const apiUrl = `https://api.cloudflare.com/client/v4/accounts/${accountId}/images/v1/direct_upload`;
  
  // Direct Upload URL 요청
  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      requireSignedURLs: false,
      metadata: {
        source: "carrot-market-app",
        type: "upload",
      },
    }),
  });
  
  if (!response.ok) {
    let errorDetail = "";
    try {
      const errorData = await response.json();
      errorDetail = JSON.stringify(errorData);
    } catch (e) {
      errorDetail = await response.text().catch(() => '응답 없음');
    }
    
    throw new Error(`Cloudflare 업로드 URL을 생성하는데 실패했습니다: ${response.status} ${response.statusText}`);
  }
  
  const data = await response.json();
  
  if (!data.success || !data.result || !data.result.uploadURL) {
    throw new Error('Cloudflare API 응답이 유효하지 않습니다');
  }
  
  return {
    uploadURL: data.result.uploadURL,
    id: data.result.id
  };
}

/**
 * 이미지 크기에 따라 적절한 Cloudflare variant 선택
 */
export function selectVariantBySize(width?: number, height?: number): string {
  // 기본 variant
  let variant = 'normal';
  
  if (width && height) {
    if (width === height) {
      variant = 'normal';
    } else if (width > height) {
      variant = 'width';
    } else {
      variant = 'height';
    }
    
    // 작은 이미지는 public variant 사용
    if (width < 251 && height < 251) {
      variant = 'public';
    }
  }
  
  return variant;
}

/**
 * Cloudflare 이미지 ID로부터 각 variant URL 생성
 */
export function generateVariantUrls(imageId: string): {
  original: string;
  height: string;
  width: string;
  normal: string;
  public: string;
} {
  const { accountHash, imageDeliveryUrl } = getCloudflareConfig();
  
  // 기본 Cloudflare 이미지 URL 생성
  const baseDeliveryUrl = imageDeliveryUrl || `https://imagedelivery.net/${accountHash}`;
  const cloudflareDeliveryUrl = `${baseDeliveryUrl}/${imageId}`;
  
  return {
    original: cloudflareDeliveryUrl,
    height: `${cloudflareDeliveryUrl}/height`,
    width: `${cloudflareDeliveryUrl}/width`,
    normal: `${cloudflareDeliveryUrl}/normal`,
    public: `${cloudflareDeliveryUrl}/public`
  };
}

/**
 * 임시 이미지를 Cloudflare에 업로드 (레거시 코드 - 호환성 유지)
 */
export async function uploadTempImage(imageDataOrUrl: string): Promise<string> {
  try {
    // URL인지 데이터 URL인지 확인
    const isDataUrl = imageDataOrUrl.startsWith('data:');
    
    if (isDataUrl) {
      // 데이터 URL을 파일로 변환
      const file = await base64ToFile(imageDataOrUrl);
      
      // 업로드 함수 호출
      const result = await uploadLocalFile(file);
      
      if (!result.success || !result.url) {
        throw new Error('이미지 업로드에 실패했습니다');
      }
      
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

/**
 * 로컬 파일을 Cloudflare에 업로드
 */
export async function uploadLocalFile(
  file: File,
  width?: number,
  height?: number
): Promise<CloudflareUploadResult> {
  try {
    // 파일 검증
    if (!file) {
      throw new Error('업로드할 파일이 제공되지 않았습니다');
    }
    
    if (!file.type.startsWith('image/')) {
      throw new Error('이미지 파일만 업로드할 수 있습니다');
    }
    
    // Direct Upload URL 획득
    const { uploadURL } = await getCloudflareDirectUploadUrl();
    
    // 업로드할 FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    
    // 이미지 크기 정보가 있으면 추가
    if (width) formData.append('width', width.toString());
    if (height) formData.append('height', height.toString());
    
    // 업로드 요청
    const response = await fetch(uploadURL, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) {
      throw new Error(`Cloudflare 업로드 실패: ${response.status} ${response.statusText}`);
    }
    
    // 업로드 응답 처리
    const uploadResult = await response.json();
    
    if (!uploadResult.success || !uploadResult.result || !uploadResult.result.id) {
      throw new Error('Cloudflare 업로드 응답 형식이 유효하지 않습니다');
    }
    
    // Cloudflare 이미지 ID 획득
    const cloudflareImageId = uploadResult.result.id;
    
    // 바리언트 URL 생성
    const variants = generateVariantUrls(cloudflareImageId);
    
    // 이미지 크기에 따라 적절한 variant 선택
    const variant = selectVariantBySize(width, height);
    
    return {
      success: true,
      url: variants[variant as keyof typeof variants],
      thumbnailUrl: variants.public,
      id: cloudflareImageId,
      variants,
      error: null
    };
    
  } catch (error: any) {
    console.error('Cloudflare 파일 업로드 오류:', error);
    
    return {
      success: false,
      url: null,
      thumbnailUrl: null,
      id: null,
      variants: null,
      error: error.message || '이미지 업로드 중 오류가 발생했습니다'
    };
  }
}

/**
 * URL로부터 이미지를 가져와 Cloudflare에 업로드
 */
export async function uploadImageFromUrl(
  imageUrl: string,
  width?: number,
  height?: number
): Promise<CloudflareUploadResult> {
  try {
    // URL 유효성 검사
    if (!imageUrl || imageUrl === "pending" || imageUrl === "null") {
      throw new Error('유효한 이미지 URL이 아닙니다');
    }
    
    // URL 형식 확인 (http 또는 https로 시작하는지)
    if (!imageUrl.startsWith('http')) {
      throw new Error('올바른 이미지 URL 형식이 아닙니다');
    }
    
    // Direct Upload URL 획득
    const { uploadURL } = await getCloudflareDirectUploadUrl();
    
    // 이미지 가져오기
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`이미지 가져오기 실패: ${imageResponse.status} ${imageResponse.statusText}`);
    }
    
    const imageBlob = await imageResponse.blob();
    
    // 파일명 생성
    const filename = `image-${Date.now()}.${imageBlob.type.split('/')[1] || 'png'}`;
    const file = new File([imageBlob], filename, { type: imageBlob.type });
    
    // FormData 생성
    const formData = new FormData();
    formData.append('file', file);
    
    // 이미지 크기 정보가 있으면 추가
    if (width) formData.append('width', width.toString());
    if (height) formData.append('height', height.toString());
    
    // 업로드
    const uploadResponse = await fetch(uploadURL, {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error(`Cloudflare 업로드 실패: ${uploadResponse.status} ${uploadResponse.statusText}`);
    }
    
    // 업로드 응답 처리
    const uploadResult = await uploadResponse.json();
    
    if (!uploadResult.success || !uploadResult.result || !uploadResult.result.id) {
      throw new Error('Cloudflare 업로드 응답 형식이 유효하지 않습니다');
    }
    
    // Cloudflare 이미지 ID 획득
    const cloudflareImageId = uploadResult.result.id;
    
    // 바리언트 URL 생성
    const variants = generateVariantUrls(cloudflareImageId);
    
    // 이미지 크기에 따라 적절한 variant 선택
    const variant = selectVariantBySize(width, height);
    
    return {
      success: true,
      url: variants[variant as keyof typeof variants],
      thumbnailUrl: variants.public,
      id: cloudflareImageId,
      variants,
      error: null
    };
    
  } catch (error: any) {
    console.error('URL 이미지 업로드 오류:', error);
    
    return {
      success: false,
      url: null,
      thumbnailUrl: null,
      id: null,
      variants: null,
      error: error.message || '이미지 업로드 중 오류가 발생했습니다'
    };
  }
} 