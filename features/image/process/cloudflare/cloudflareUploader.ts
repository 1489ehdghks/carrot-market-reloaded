import { db } from "@/shared/lib/db";
import { selectVariant } from "../utils";

// 최적화된 Cloudflare 업로드 함수 (이미지 업로드 → 변형 생성)
export async function optimizedUploadToCloudflare(imageUrl: string, title: string = '') {
  if (!imageUrl) {
    return { success: false, error: "업로드할 이미지 URL이 없습니다." };
  }

  try {
    console.log(`[Cloudflare 업로드] 시작 (${new Date().toISOString()}): 이미지 URL ${imageUrl.substring(0, 30)}...`);
    
    // 1. 환경 변수 검증
    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_API_KEY) {
      console.error('[Cloudflare 업로드] 환경 변수 없음: CLOUDFLARE_ACCOUNT_ID 또는 CLOUDFLARE_API_KEY');
      return { success: false, error: "Cloudflare API 자격 증명이 설정되지 않았습니다." };
    }
    
    // 2. 이미지 URL에서 이미지 데이터 가져오기
    console.log('[Cloudflare 업로드] 이미지 다운로드 시도 중...');
    let imageResponse;
    try {
      imageResponse = await fetch(imageUrl);
      if (!imageResponse.ok) {
        console.error(`[Cloudflare 업로드] 이미지 다운로드 실패: HTTP ${imageResponse.status}`);
        return { success: false, error: `이미지 다운로드 실패: HTTP ${imageResponse.status}` };
      }
    } catch (fetchError: unknown) {
      console.error('[Cloudflare 업로드] 이미지 다운로드 실패:', fetchError);
      return { success: false, error: `이미지 다운로드 중 오류: ${fetchError instanceof Error ? fetchError.message : String(fetchError)}` };
    }
    
    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    console.log(`[Cloudflare 업로드] 이미지 다운로드 완료: ${imageBuffer.length} 바이트`);
    
    // 3. FormData 준비
    const formData = new FormData();
    const blob = new Blob([imageBuffer], { type: 'image/png' });
    // title을 파일명으로 사용 (확장자 추가)
    formData.append('file', blob, `${title || 'image'}.png`);
    
    if (title) {
      formData.append('metadata', JSON.stringify({ title }));
    }
    
    // 4. Cloudflare Images API 호출
    console.log('[Cloudflare 업로드] API 호출 준비 완료, 요청 보내는 중...');
    const uploadResponse = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_API_KEY}`
          // Content-Type은 FormData에서 자동으로 설정
        },
        body: formData
      }
    );
    
    // 5. 응답 확인
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error(`[Cloudflare 업로드] API 오류 응답: HTTP ${uploadResponse.status}`, errorText);
      return { success: false, error: `Cloudflare API 오류: ${errorText}` };
    }
    
    // 6. 응답 처리
    const result = await uploadResponse.json();
    console.log('[Cloudflare 업로드] 응답 수신:', JSON.stringify(result, null, 2));
    
    if (!result.success) {
      console.error('[Cloudflare 업로드] API 응답에 success=false:', result.errors);
      return { success: false, error: result.errors?.[0]?.message || "알 수 없는 Cloudflare API 오류" };
    }
    
    // 7. 결과에서 URL 및 ID 추출
    const cloudflareId = result.result?.id;
    const cloudflareUrl = result.result?.variants?.[0] || '';
    
    if (!cloudflareUrl) {
      console.error('[Cloudflare 업로드] URL이 없는 응답:', result);
      return { success: false, error: "Cloudflare에서 이미지 URL을 반환하지 않았습니다." };
    }
    
    console.log(`[Cloudflare 업로드] 성공 (${new Date().toISOString()}): ID=${cloudflareId}, URL=${cloudflareUrl.substring(0, 30)}...`);
    
    // 8. 성공 결과 반환
    return {
      success: true,
      cloudflareId,
      cloudflareUrl,
      variants: result.result?.variants || [],
      uploadStatus: "success"
    };
  } catch (error) {
    console.error("Cloudflare 업로드 중 오류:", error);
    return { success: false, error: error instanceof Error ? error.message : "알 수 없는 오류" };
  }
}

// Cloudflare 업로드 스케줄링 함수 (최적화 버전)
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    throw new Error("유효하지 않은 이미지 ID입니다.");
  }

  if (!originalUrl) {
    throw new Error("업로드할 이미지 URL이 제공되지 않았습니다.");
  }

  try {
    console.log(`[Cloudflare 업로드 스케줄링] 이미지 ID ${imageId} 처리 시작 (비동기)`);
    
    // 즉시 응답을 위한 리턴 객체 준비
    const response = {
      success: true,
      imageId,
      status: 'scheduled',
      message: `이미지 ID ${imageId} 업로드가 백그라운드에서 진행 중입니다.`,
      originalUrl
    };
    
    // 백그라운드 처리 시작 (await 하지 않음)
    processImageBackground(imageId, originalUrl).catch(error => {
      console.error(`[Cloudflare 업로드 스케줄링] 백그라운드 처리 실패:`, error);
    });
    
    // 즉시 응답 반환
    return response;
  } catch (error) {
    console.error(`[Cloudflare 업로드 스케줄링] 이미지 ID ${imageId} 스케줄링 오류:`, error);
    return {
      success: false,
      imageId,
      status: 'error',
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// Cloudflare 이미지 업로드 URL 얻기
export async function getImageUploadUrl() {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/images/v1/direct_upload`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          "Content-Type": "application/json"
        },
        cache: 'no-store' // 캐싱 방지
      }
    );
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Cloudflare API 오류 (${response.status}): ${errorText}`);
    }
    
    return await response.json();
  } catch (error: any) {
    console.error("업로드 URL 가져오기 오류:", error);
    throw new Error(error.message || "업로드 URL을 가져오는데 실패했습니다");
  }
}

/**
 * 백그라운드에서 이미지를 Cloudflare에 업로드하고 DB를 업데이트하는 함수
 * 즉시 반환되며 백그라운드에서 작업을 계속합니다.
 * 
 * @param {number} imageId - 이미지 ID
 * @param {string} originalUrl - 원본 이미지 URL
 * @returns {Promise<void>}
 */
export async function processImageBackground(imageId: number, originalUrl: string): Promise<void> {
  if (!imageId || isNaN(imageId) || imageId <= 0) {
    console.error("[백그라운드 처리] 유효하지 않은 이미지 ID:", imageId);
    return;
  }

  if (!originalUrl) {
    console.error("[백그라운드 처리] 업로드할 이미지 URL이 없습니다");
    return;
  }

  try {
    console.log(`[백그라운드 처리] 이미지 ID ${imageId} 처리 시작 (${new Date().toISOString()})`);
    
    // 이미지 정보 가져오기 (너비/높이 정보 필요)
    const image = await db.aIImage.findUnique({
      where: { id: imageId }
    });
    
    if (!image) {
      console.error(`[백그라운드 처리] 이미지 ID ${imageId}를 찾을 수 없습니다`);
      return;
    }
    
    // DB 상태 업데이트 - 처리 중으로 표시
    await db.aIImage.update({
      where: { id: imageId },
      data: { 
        status: 'PROCESSING' 
      }
    });
    
    // 이미지 타이틀 설정 - text-image-[id] 형식으로
    // 만약 이미 타이틀이 설정되어 있다면 그대로 사용
    const imageTitle = image.title || `text-image-${imageId}`;
    console.log(`[백그라운드 처리] 사용할 이미지 타이틀: ${imageTitle}`);
    
    // 최적화된 Cloudflare 업로드 함수 사용 (타이틀 추가)
    console.log(`[백그라운드 처리] Cloudflare 업로드 시작: ${imageId}, URL: ${originalUrl.substring(0, 30)}...`);
    
    // 함수 호출 직접 테스트 - 오류 상황을 더 자세히 확인하기 위함
    let uploadResult;
    try {
      uploadResult = await optimizedUploadToCloudflare(originalUrl, imageTitle);
      console.log(`[백그라운드 처리] Cloudflare 업로드 결과:`, uploadResult);
    } catch (uploadError) {
      console.error(`[백그라운드 처리] Cloudflare 업로드 오류:`, uploadError);
      
      // 오류 발생 시 DB 상태 업데이트
      await db.aIImage.update({
        where: { id: imageId },
        data: { 
          status: 'ERROR',
        }
      });
      
      throw uploadError;
    }
    
    // 업로드 실패 시
    if (!uploadResult?.success) {
      console.error(`[백그라운드 처리] 이미지 ID ${imageId} Cloudflare 업로드 실패:`, uploadResult?.error || '알 수 없는 오류');
      
      // 실패 상태 DB에 기록
      await db.aIImage.update({
        where: { id: imageId },
        data: { 
          status: 'ERROR',
        }
      });
      
      return;
    }
    
    // 업로드 성공 시 DB 업데이트
    if (uploadResult.cloudflareUrl) {
      try {
        // 이미지 원본 크기에 따라 적절한 변형자 선택
        const fileUrl = selectVariant(
          image.width, 
          image.height, 
          uploadResult.variants || [], 
          false // 원본용
        ) || uploadResult.cloudflareUrl;
        
        // 썸네일용 변형자 선택 (public 우선)
        const thumbnailUrl = selectVariant(
          image.width, 
          image.height, 
          uploadResult.variants || [], 
          true // 썸네일용
        ) || uploadResult.cloudflareUrl;
        
        await db.aIImage.update({
          where: { id: imageId },
          data: {
            fileUrl,
            thumbnailUrl,
            isPermanent: true,
            status: 'COMPLETED',
            title: imageTitle // 타이틀 업데이트 (설정되지 않은 경우를 위해)
          }
        });
        
        console.log(`[백그라운드 처리] 이미지 ID ${imageId} DB 업데이트 완료:
          title: ${imageTitle},
          fileUrl: ${fileUrl.substring(0, 30)}...,
          thumbnailUrl: ${thumbnailUrl.substring(0, 30)}...`);
      } catch (dbError) {
        console.error(`[백그라운드 처리] 이미지 ID ${imageId} DB 업데이트 실패:`, dbError);
        
        // DB 업데이트 실패 시 상태 업데이트
        await db.aIImage.update({
          where: { id: imageId },
          data: { 
            status: 'ERROR',
          }
        }).catch(err => console.error(`[백그라운드 처리] 상태 업데이트 실패:`, err));
      }
    }
  } catch (error) {
    console.error(`[백그라운드 처리] 이미지 ID ${imageId} 처리 중 오류:`, error);
  }
} 