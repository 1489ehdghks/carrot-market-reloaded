/**
 * Cloudflare 이미지 저장소 API 모듈
 * 
 * 이 모듈은 Cloudflare Images API와의 상호작용을 담당합니다.
 * - 이미지 업로드
 * - 변형 URL 생성
 * - 업로드 상태 관리
 * - 다이렉트 업로드 URL 생성
 * 
 * @module shared/api/cloudflare
 */

import { db } from "@/shared/api/db";

/**
 * Cloudflare API 호출에 사용되는 기본 매개변수
 */
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';
const CLOUDFLARE_ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || '';

// API 호출 매개변수 유효성 검사
if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
  console.warn('Cloudflare API 설정이 누락되었습니다. 이미지 업로드 기능이 작동하지 않을 수 있습니다.');
}

/**
 * 업로드 추적을 위한 맵
 * 
 * 각 업로드의 상태를 추적하기 위한 메모리 내 맵으로, 중복 업로드 방지와 상태 확인에 사용
 */
const uploadTracker = new Map<string, {
  status: 'pending' | 'completed' | 'failed',
  timestamp: number,
  result?: any
}>();

/**
 * Cloudflare Images API에 이미지 업로드
 * 
 * 외부 URL에서 이미지를 가져와 Cloudflare Images에 업로드합니다.
 * 
 * @param imageUrl 업로드할 이미지의 URL
 * @param options 추가 옵션 (메타데이터, 요청자 정보 등)
 * @returns 업로드 결과 (성공 여부, 이미지 ID, URL 등)
 */
export async function uploadToCloudflare(
  imageUrl: string, 
  options?: {
    metadata?: Record<string, string>,
    requester?: string,
    imageId?: string | number
  }
): Promise<{
  success: boolean;
  imageId?: string;
  variants?: string[];
  error?: string;
  url?: string;
}> {
  try {
    const trackingKey = `${imageUrl}-${options?.imageId || 'unknown'}`;
    
    // 이미 진행 중인 업로드인지 확인
    const existingUpload = uploadTracker.get(trackingKey);
    if (existingUpload) {
      // 이미 완료된 업로드인 경우
      if (existingUpload.status === 'completed' && existingUpload.result) {
        return existingUpload.result;
      }
      
      // 진행 중인 업로드이고 10분 이내인 경우
      if (existingUpload.status === 'pending' && 
          Date.now() - existingUpload.timestamp < 10 * 60 * 1000) {
        return {
          success: false,
          error: '이미 처리 중인 이미지입니다. 잠시 후 다시 시도해주세요.'
        };
      }
      
      // 오래된 진행 중 상태는 리셋
      uploadTracker.delete(trackingKey);
    }
    
    // 새 업로드 추적 시작
    uploadTracker.set(trackingKey, {
      status: 'pending',
      timestamp: Date.now()
    });
    
    console.log(`[Cloudflare] 이미지 업로드 시작: ${imageUrl.substring(0, 30)}...`);
    
    // URL 유효성 검사
    try {
      new URL(imageUrl);
    } catch (error) {
      console.error('잘못된 이미지 URL 형식:', imageUrl);
      uploadTracker.set(trackingKey, {
        status: 'failed',
        timestamp: Date.now()
      });
      return {
        success: false,
        error: '유효하지 않은 이미지 URL입니다.'
      };
    }
    
    // 업로드 URL 구성
    const url = `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v1`;
    
    // 요청 헤더 구성
    const headers = {
      'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
      'Content-Type': 'application/json'
    };
    
    // 요청 본문 구성
    const body = {
      url: imageUrl,
      metadata: {
        source: 'ai-generated',
        ...(options?.metadata || {})
      },
      requester: options?.requester || 'app'
    };
    
    // Cloudflare API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    // 응답 처리
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudflare 이미지 업로드 실패:', errorData);
      
      uploadTracker.set(trackingKey, {
        status: 'failed',
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: errorData.errors?.[0]?.message || '이미지 업로드 중 오류가 발생했습니다.'
      };
    }
    
    // 성공 응답 처리
    const data = await response.json();
    
    if (!data.success || !data.result) {
      console.error('Cloudflare API 응답 형식 오류:', data);
      
      uploadTracker.set(trackingKey, {
        status: 'failed',
        timestamp: Date.now()
      });
      
      return {
        success: false,
        error: '이미지 서버 응답 처리 중 오류가 발생했습니다.'
      };
    }
    
    console.log(`[Cloudflare] 이미지 업로드 성공 (ID: ${data.result.id})`);
    
    // 결과 구성
    const result = {
      success: true,
      imageId: data.result.id,
      variants: data.result.variants,
      url: data.result.variants[0] || `https://imagedelivery.net/${process.env.CLOUDFLARE_HASH}/${data.result.id}/public`
    };
    
    // 업로드 상태 업데이트
    uploadTracker.set(trackingKey, {
      status: 'completed',
      timestamp: Date.now(),
      result
    });
    
    return result;
  } catch (error) {
    console.error('Cloudflare 이미지 업로드 중 예외 발생:', error);
    
    // 에러 상태 기록
    uploadTracker.set(`${imageUrl}-${options?.imageId || 'unknown'}`, {
      status: 'failed',
      timestamp: Date.now()
    });
    
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 업로드 중 알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * Cloudflare 이미지의 공개 변형 URL 생성
 * 
 * 주어진 이미지 ID로 공개 URL을 생성합니다.
 * 
 * @param imageId Cloudflare 이미지 ID
 * @param variant 이미지 변형 (public, thumbnail 등)
 * @returns 이미지 URL
 */
export function generatePublicVariantUrl(imageId: string, variant: string = 'public'): string {
  const cloudflareHash = process.env.CLOUDFLARE_HASH || '';
  
  if (!cloudflareHash) {
    console.warn('CLOUDFLARE_HASH 환경 변수가 정의되지 않았습니다.');
    return '';
  }
  
  return `https://imagedelivery.net/${cloudflareHash}/${imageId}/${variant}`;
}

/**
 * 이미지의 변형 선택
 * 
 * 제공된 변형 목록에서 특정 변형을 선택합니다.
 * 
 * @param variants 변형 URL 목록
 * @param preferredVariant 선호하는 변형 (public, thumbnail 등)
 * @returns 선택된 변형 URL
 */
export function selectVariant(variants: string[], preferredVariant: string = 'public'): string {
  if (!variants || variants.length === 0) {
    return '';
  }
  
  // 선호하는 변형 검색
  const matchingVariant = variants.find(v => v.includes(`/${preferredVariant}`));
  
  // 선호하는 변형이 있으면 반환, 없으면 첫 번째 변형 반환
  return matchingVariant || variants[0];
}

/**
 * 이미지 다이렉트 업로드 URL 생성
 * 
 * 클라이언트에서 직접 Cloudflare에 업로드할 수 있는 URL을 생성합니다.
 * 
 * @param userId 사용자 ID
 * @returns 업로드 URL과 관련 정보
 */
export async function getImageUploadUrl(userId?: number): Promise<{
  success: boolean;
  uploadUrl?: string;
  id?: string;
  expiry?: number;
  error?: string;
}> {
  try {
    if (!CLOUDFLARE_ACCOUNT_ID || !CLOUDFLARE_API_TOKEN) {
      return {
        success: false,
        error: 'Cloudflare API 설정이 누락되었습니다.'
      };
    }
    
    // 1단계: 다이렉트 업로드 URL 발급 요청
    const url = `${CLOUDFLARE_API_BASE}/accounts/${CLOUDFLARE_ACCOUNT_ID}/images/v2/direct_upload`;
    
    const metadata: Record<string, string> = {
      source: 'user-upload',
      uploader: `user-${userId || 'anonymous'}`
    };
    
    if (userId) {
      metadata.userId = userId.toString();
    }
    
    const reqBody = {
      metadata,
      requireSignedURLs: false, // 서명 없이 URL에 접근 가능
      expiry: Math.floor(Date.now() / 1000) + 30 * 60 // 30분 후 만료
    };
    
    // Cloudflare API 호출
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reqBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Cloudflare 다이렉트 업로드 URL 발급 실패:', errorData);
      return {
        success: false,
        error: errorData.errors?.[0]?.message || '업로드 URL 발급 중 오류가 발생했습니다.'
      };
    }
    
    // 성공 응답 처리
    const data = await response.json();
    
    if (!data.success || !data.result) {
      return {
        success: false,
        error: '업로드 URL 발급 응답 처리 중 오류가 발생했습니다.'
      };
    }
    
    return {
      success: true,
      uploadUrl: data.result.uploadURL,
      id: data.result.id,
      expiry: data.result.expiry
    };
  } catch (error) {
    console.error('다이렉트 업로드 URL 발급 중 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '업로드 URL 발급 중 알 수 없는 오류가 발생했습니다.'
    };
  }
}

/**
 * AI 이미지 정보 업데이트
 * 
 * 데이터베이스의 AI 이미지 정보를 영구 저장소 URL로 업데이트합니다.
 * 
 * @param imageId 이미지 ID
 * @param permanentUrl 영구 저장소 URL
 * @returns 업데이트 결과
 */
export async function updateAIImagePermanentUrl(imageId: number, permanentUrl: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    if (!imageId || !permanentUrl) {
      return {
        success: false,
        error: '이미지 ID와 영구 URL이 필요합니다.'
      };
    }
    
    // 데이터베이스 업데이트
    await db.aIImage.update({
      where: { id: imageId },
      data: {
        fileUrl: permanentUrl,
        thumbnailUrl: permanentUrl,
        isPermanent: true
      }
    });
    
    return { success: true };
  } catch (error) {
    console.error('이미지 영구 URL 업데이트 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 정보 업데이트 중 오류가 발생했습니다.'
    };
  }
} 