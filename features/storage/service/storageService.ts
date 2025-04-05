/**
 * 이미지 저장 서비스 모듈
 * 
 * 이 모듈은 생성된 이미지의 저장 및 관리를 담당합니다.
 * - 임시 저장소에서 영구 저장소로 이미지 이동
 * - 이미지 메타데이터 관리
 * - 업로드 프로세스 관리
 * 
 * @module features/storage/service/storageService
 */

import { db } from "@/shared/lib/db";
import { uploadToCloudflare, updateAIImagePermanentUrl } from "@/shared/api/cloudflare";

/**
 * 생성된 이미지를 데이터베이스에 저장
 * 
 * @param data 이미지 데이터
 * @returns 저장 결과
 */
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  userId?: number;
}): Promise<{
  success: boolean;
  imageId?: number;
  error?: string;
}> {
  try {
    // 사용자 ID 확인
    if (!data.userId) {
      return {
        success: false,
        error: '사용자 정보가 필요합니다.'
      };
    }
    
    // 필수 필드 확인
    if (!data.prompt || !data.fileUrl || !data.modelId) {
      return {
        success: false,
        error: '필수 정보가 누락되었습니다.'
      };
    }
    
    // 데이터베이스에 저장
    const image = await db.aIImage.create({
      data: {
        userId: data.userId,
        title: data.prompt.substring(0, 100), // 최대 100자로 제한
        description: data.prompt.substring(0, 500), // 최대 500자로 제한
        category: "AI",
        prompt: data.prompt,
        negativePrompt: data.negativePrompt || "",
        width: data.width || 768,
        height: data.height || 768,
        model: data.modelId,
        steps: 30, // 기본값
        cfgScale: 7, // 기본값
        sampler: "K_EULER_ANCESTRAL", // 기본값
        fileUrl: data.fileUrl,
        thumbnailUrl: data.fileUrl,
        isPermanent: false, // 임시 상태로 시작
        isPublic: false,
        format: "png"
      }
    });
    
    return {
      success: true,
      imageId: image.id
    };
  } catch (error) {
    console.error('이미지 저장 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 저장 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 임시 이미지 URL을 영구 저장소로 이동
 * 
 * Replicate에서 반환한 임시 URL을 Cloudflare로 업로드하고 
 * 데이터베이스 정보를 업데이트합니다.
 * 
 * @param imageId 이미지 ID
 * @param tempUrl 임시 이미지 URL
 * @returns 처리 결과
 */
export async function moveToPermamentStorage(imageId: number, tempUrl: string): Promise<{
  success: boolean;
  permanentUrl?: string;
  error?: string;
}> {
  try {
    // 이미지 정보 조회
    const imageRecord = await db.aIImage.findUnique({
      where: { id: imageId }
    });
    
    if (!imageRecord) {
      return {
        success: false,
        error: '이미지 정보를 찾을 수 없습니다.'
      };
    }
    
    // 이미 영구 저장된 이미지인 경우
    if (imageRecord.isPermanent) {
      return {
        success: true,
        permanentUrl: imageRecord.fileUrl
      };
    }
    
    // Cloudflare에 업로드
    const uploadResult = await uploadToCloudflare(tempUrl, {
      metadata: {
        userId: imageRecord.userId.toString(),
        prompt: imageRecord.prompt.substring(0, 255),
        model: imageRecord.model
      },
      imageId: imageId
    });
    
    if (!uploadResult.success) {
      console.error(`이미지 ID ${imageId}의 영구 저장 실패:`, uploadResult.error);
      return {
        success: false,
        error: uploadResult.error
      };
    }
    
    // 영구 URL 추출
    const permanentUrl = uploadResult.url || '';
    
    if (!permanentUrl) {
      return {
        success: false,
        error: '영구 URL을 생성하지 못했습니다.'
      };
    }
    
    // 데이터베이스 업데이트
    await updateAIImagePermanentUrl(imageId, permanentUrl);
    
    return {
      success: true,
      permanentUrl
    };
  } catch (error) {
    console.error('영구 저장소 이동 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '영구 저장소 이동 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 이미지 공개 상태 전환
 * 
 * @param imageId 이미지 ID
 * @returns 처리 결과
 */
export async function publishImage(imageId: number): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    await db.aIImage.update({
      where: { id: imageId },
      data: { isPublic: true }
    });
    
    return { success: true };
  } catch (error) {
    console.error('이미지 공개 상태 변경 실패:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '이미지 공개 상태 변경 중 오류가 발생했습니다.'
    };
  }
}

/**
 * 백그라운드에서 이미지 처리 실행
 * 
 * 비동기적으로 이미지를 영구 저장소로 이동시키는 프로세스를 시작합니다.
 * 
 * @param imageId 이미지 ID
 * @param tempUrl 임시 이미지 URL
 */
export async function processImageBackground(imageId: number, tempUrl: string): Promise<void> {
  try {
    console.log(`[Storage] 백그라운드 이미지 처리 시작 (ID: ${imageId})`);
    
    // 지연 시간 추가 (서버 부하 분산)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // 영구 저장소로 이동
    const result = await moveToPermamentStorage(imageId, tempUrl);
    
    if (result.success) {
      console.log(`[Storage] 이미지 영구 저장 완료 (ID: ${imageId}, URL: ${result.permanentUrl?.substring(0, 30)}...)`);
    } else {
      console.error(`[Storage] 이미지 영구 저장 실패 (ID: ${imageId}):`, result.error);
    }
  } catch (error) {
    console.error(`[Storage] 백그라운드 이미지 처리 중 오류 (ID: ${imageId}):`, error);
  }
} 