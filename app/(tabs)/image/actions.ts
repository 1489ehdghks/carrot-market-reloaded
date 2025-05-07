"use server";
import {
  generateImageWithText as genImageWithText,
  scheduleCloudflareUpload as scheduleUpload,
  getImageUploadUrl as getUploadUrl,
  saveGeneratedImage as saveImage,
  publishImage as publish,
  type ImageGenerationParams,
  type ImageGenerationResult,
  generateImageWithImage as serviceImageWithImage
} from "@/features/image/lib/imageService";
import { db } from '@/shared/lib/db';
import getSession from "@/shared/lib/session";
import { revalidatePath } from 'next/cache';
import { ImageCategory } from '@/features/image/image-category-types';
import { getImageModelById } from '@/shared/models/image/imageModels';
import { getEditModelById , filterEditModelsByCategory } from '@/shared/models/image/editModels';

/**
 * 빠른 응답을 위해 Replicate API 호출 후 즉시 결과를 반환하며,
 * Cloudflare 업로드, DB 저장은 백그라운드에서 저장됩니다.
 * 
 * @param {object} params - 이미지 생성 매개변수
 * @param {string} params.prompt - 이미지 생성을 위한 프롬프트
 * @param {string} [params.modelId] - 사용할 모델 ID
 * @param {string} [params.negativePrompt] - 부정적 프롬프트
 * @param {number} [params.width] - 이미지 너비
 * @param {number} [params.height] - 이미지 높이
 * @param {number} [params.steps] - 생성 단계 수
 * @param {number} [params.cfgScale] - CFG 스케일
 * @param {string} [params.sampler] - 샘플러
 * @param {string} [params.vae] - VAE 모델
 * @returns {Promise<{success: boolean, image?: any, error?: string, tempUrl?: string}>}
 */
export async function generateImage(params: {
  prompt: string,
  modelId?: string,
  negativePrompt?: string,
  width?: number,
  height?: number,
  steps?: number,
  cfgScale?: number,
  sampler?: string,
  vae?: string,
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    const result = await genImageWithText({
      prompt: params.prompt,
      modelId: params.modelId || 'realistic-vision-v5.1',
      width: params.width,
      height: params.height,
      steps: params.steps,
      cfgScale: params.cfgScale,
      sampler: params.sampler,
      vae: params.vae,
      negativePrompt: params.negativePrompt,
      userId: session.id
    });
    
    if (!result.success) {
      return { success: false, error: result.error || '이미지 생성 실패' };
    }
    
    return {
      success: true,
      image: {
        id: result.id,
        url: result.imageUrl
      },
      tempUrl: result.imageUrl
    };
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류'
    };
  }
}

// Image2Image 함수 - 외부로 노출할 서버 액션
/**
 * 기존 이미지를 기반으로 새 이미지를 생성합니다.
 * 
 * @param {string} prompt - 이미지 생성을 위한 프롬프트
 * @param {string} imageUrl - 기준 이미지 URL
 * @param {number} [strength] - 변형 강도
 * @param {number} [width] - 이미지 너비
 * @param {number} [height] - 이미지 높이
 * @returns {Promise<ImageGenerationResult>} 생성된 이미지 결과
 */
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string | File, 
  strength?: number,
  width?: number,
  height?: number,
  num_inference_steps?: number,
  guidance_scale?: number,
  scheduler?: string
): Promise<ImageGenerationResult> {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: '로그인이 필요합니다.', imageUrl: '' };
    }

    // 이미지를 base64로 변환
    let base64Image: string;
    if (imageUrl instanceof File) {
      // File 객체인 경우
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(imageUrl);
      });
    } else if (imageUrl.startsWith('data:')) {
      // 이미 base64인 경우
      base64Image = imageUrl;
    } else if (imageUrl.startsWith('blob:')) {
      // Blob URL인 경우
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    } else {
      // 일반 URL인 경우
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      base64Image = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }

    // API 요청 파라미터 설정
    const params = {
      prompt,
      image: base64Image,
      num_inference_steps: num_inference_steps,
      guidance_scale: guidance_scale,
      scheduler: scheduler,
      strength: strength,
      width: width,
      height: height
    };

    // API 호출
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: "asiryan/realism-xl:ff26a1f71bc27f43de016f109135183e0e4902d7cdabbcbb177f4f8817112219",
        input: params
      })
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.detail || '이미지 생성에 실패했습니다.', imageUrl: '' };
    }

    const prediction = await response.json();
    
    // 결과 이미지 URL 반환
    return {
      success: true,
      imageUrl: prediction.output[0],
      id: prediction.id
    };
  } catch (error) {
    console.error('이미지 생성 오류:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      imageUrl: ''
    };
  }
}

// Cloudflare 업로드 스케줄링 - 외부로 노출할 서버 액션
/**
 * 이미지를 Cloudflare에 업로드하도록 예약합니다.
 * 백그라운드에서 비동기적으로 처리됩니다.
 * 
 * @param {number} imageId - 이미지 ID
 * @param {string} originalUrl - 원본 이미지 URL
 * @returns {Promise<any>} 업로드 스케줄링 결과
 */
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  return await scheduleUpload(imageId, originalUrl);
}

// Cloudflare 이미지 업로드 URL 얻기 - 외부로 노출할 서버 액션
/**
 * Cloudflare 이미지 직접 업로드 URL을 가져옵니다.
 * 
 * @returns {Promise<any>} Cloudflare 업로드 URL 정보
 */
export async function getImageUploadUrl() {
  return await getUploadUrl();
}

// 이미지 정보를 DB에 저장 (영구 URL 포함) - 외부로 노출할 서버 액션
/**
 * 생성된 이미지 정보를 데이터베이스에 저장합니다.
 * 
 * @param {object} data - 이미지 데이터
 * @param {string} data.prompt - 이미지 생성 프롬프트
 * @param {string} data.fileUrl - 이미지 파일 URL
 * @param {string} data.modelId - 사용된 모델 ID
 * @param {string} [data.negativePrompt] - 부정적 프롬프트
 * @param {number} [data.width] - 이미지 너비
 * @param {number} [data.height] - 이미지 높이
 * @returns {Promise<ImageGenerationResult>} 저장 결과
 */
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  settings?: string;
}) {
  return await saveImage(data);
}

// 이미지 공개 함수 - 외부로 노출할 서버 액션
/**
 * 생성된 이미지를 공개 상태로 변경합니다.
 * 
 * @param {number} imageId - 공개할 이미지 ID
 * @returns {Promise<any>} 공개 처리 결과
 */
export async function publishImage(imageId: number) {
  return await publish(imageId);
}

/**
 * 이미지 공개 및 제목 업데이트 함수
 */
export async function publishImageWithTitle(
  imageId: number, 
  title: string,
  category: ImageCategory,
  isAdult: boolean = false,
): Promise<{ success: boolean; error?: string }> {
  try {
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: '로그인이 필요합니다' };
    }

    const image = await db.aIImage.findUnique({
      where: {
        id: imageId,
        userId: session.id
      }
    });

    if (!image) {
      return { success: false, error: '이미지를 찾을 수 없거나 접근 권한이 없습니다' };
    }

    // 이미지 제목과 카테고리 업데이트 및 공개 처리
    await db.aIImage.update({
      where: { id: imageId },
      data: { 
        title, 
        isPublic: true,
        category,
        isAdult
      }
    });

    return { success: true };
  } catch (error) {
    console.error('이미지 공개 오류:', error);
    return { success: false, error: '이미지 공개 중 서버 오류가 발생했습니다' };
  }
}

/**
 * 이미지 생성 서버 액션 - 간소화 버전
 * Face Swap 기능 제거 및 로직 간소화
 */
export async function generateImageAction({
  prompt,
  modelId,
  width,
  height,
  steps,
  cfgScale,
  sampler,
  vae,
  negativePrompt,
  sourceImage,
  faceImage
}: {
  prompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae: string;
  negativePrompt?: string;
  sourceImage?: File | undefined;
  faceImage?: File | undefined;
}) {
  try {
    const session = await getSession();
    if (!session?.id) {
      return {
        success: false,
        error: '로그인이 필요합니다.'
      };
    }

    console.log(`[이미지 생성] 요청 시작: "${prompt.substring(0, 30)}..." (모델: ${modelId})`);

    // 이미지 생성 요청
    const result = await genImageWithText({
      prompt,
      modelId,
      width,
      height,
      steps,
      cfgScale,
      sampler,
      vae,
      negativePrompt,
      userId: Number(session.id)
    });

    if (!result.success || !result.imageUrl) {
      console.error(`[이미지 생성] 실패: ${result.error || '알 수 없는 오류'}`);
      return {
        success: false,
        error: result.error || '이미지 생성에 실패했습니다.'
      };
    }

    console.log(`[이미지 생성] 성공: URL=${result.imageUrl.substring(0, 30)}..., ID=${result.id}`);

    // 결과 이미지가 있고 ID가 있으면 Cloudflare 업로드 처리
    if (result.id) {
      // 1. 타이틀 설정 - text-image-[id] 형식으로
      const title = `text-image-${result.id}`;
      
      try {
        // 2. DB 타이틀 업데이트 - 유효성 검사 추가
        if (isNaN(result.id) || result.id <= 0) {
          console.error(`[이미지 생성] 유효하지 않은 이미지 ID: ${result.id}`);
        } else {
          await db.aIImage.update({
            where: { id: result.id },
            data: { 
              title,
              // isPermanent 필드를 명시적으로 false로 설정
              isPermanent: false
            }
          });
          console.log(`[이미지 생성] 타이틀 설정 완료: ${title}`);
        }
        
        // 3. Cloudflare 업로드 스케줄링 (비동기로 실행)
        console.log(`[이미지 생성] Cloudflare 업로드 시작 (ID: ${result.id})`);
        
        // 백그라운드 프로세스 실행 확인을 위한 즉시 실행 함수
        (async () => {
          try {
            if (!result.imageUrl) {
              console.error('[이미지 생성] Cloudflare 업로드 실패: 이미지 URL이 없습니다');
              return;
            }
            
            const uploadResult = await scheduleCloudflareUpload(result.id!, result.imageUrl);
            console.log(`[이미지 생성] Cloudflare 업로드 시작됨:`, 
              uploadResult.success ? '성공' : '실패',
              uploadResult.status
            );
            
            // 업로드 시작 후 5초 뒤에 실제 처리 상태 확인
            setTimeout(async () => {
              try {
                if (isNaN(result.id!) || result.id! <= 0) {
                  console.error(`[이미지 생성] 상태 확인 실패: 유효하지 않은 ID ${result.id}`);
                  return;
                }
                
                const imageStatus = await db.aIImage.findUnique({
                  where: { id: result.id! }
                });
                
                if (!imageStatus) {
                  console.error(`[이미지 생성] 상태 확인 실패: ID ${result.id}의 이미지를 찾을 수 없음`);
                  return;
                }
                
                console.log(`[이미지 생성] 5초 후 상태 확인: ID=${result.id}, isPermanent=${imageStatus.isPermanent}, fileUrl=${imageStatus.fileUrl ? 'exists' : 'none'}`);
              } catch (err) {
                console.error('[이미지 생성] 상태 확인 실패:', err);
              }
            }, 5000);
          } catch (err) {
            console.error('[이미지 생성] Cloudflare 업로드 스케줄링 실패:', err);
          }
        })();
      } catch (dbError) {
        console.error('[이미지 생성] DB 업데이트 실패:', dbError);
        // DB 업데이트 실패해도 이미지 생성은 성공했으므로 계속 진행
      }
    } else {
      console.warn('[이미지 생성] 이미지 ID가 없습니다. Cloudflare 업로드를 건너뜁니다.');
    }

    return {
      success: true,
      imageUrl: result.imageUrl,
      imageId: result.id
    };

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
    console.error('[이미지 생성] 치명적 오류:', errorMessage);
    
    return {
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 사용자의 이미지 목록을 가져오는 함수
 * 
 * @param options 이미지 조회 옵션
 * @returns 이미지 목록
 */
export async function getUserImages({
  page = 1,
  limit = 12,
  category,
  orderBy = 'created_at',
  direction = 'desc',
}: {
  page?: number;
  limit?: number;
  category?: string;
  orderBy?: 'created_at' | 'views' | 'downloads' | 'title';
  direction?: 'asc' | 'desc';
}) {
  try {
    // 세션 확인
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: '로그인이 필요합니다', images: [] };
    }

    // 페이지네이션 계산
    const skip = (page - 1) * limit;
    
    // 카테고리 필터 적용 여부 확인
    const whereClause: any = {
      userId: session.id
    };
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }

    // 정렬 방향 설정
    const orderDirection = direction === 'asc' ? 'asc' : 'desc';

    // 전체 이미지 수 조회 (페이지네이션 정보용)
    const totalCount = await db.aIImage.count({
      where: whereClause
    });

    // 이미지 목록 조회
    const images = await db.aIImage.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        fileUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        isPermanent: true,
        isPublic: true,
        category: true,
        created_at: true,
        updated_at: true,
        views: true,
        downloads: true
      },
      orderBy: {
        [orderBy]: orderDirection
      },
      skip,
      take: limit
    });

    // 이미지 목록 반환
    return {
      success: true,
      images,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('[이미지 목록 조회 오류]', error);
    return {
      success: false,
      error: '이미지 목록을 불러오는 중 오류가 발생했습니다',
      images: []
    };
  }
}

/**
 * 공개된 이미지 목록을 가져오는 함수
 * 
 * @param options 이미지 조회 옵션
 * @returns 이미지 목록
 */
export async function getPublicImages({
  page = 1,
  limit = 20,
  category,
  orderBy = 'created_at',
  direction = 'desc',
  showAdult = false,
}: {
  page?: number;
  limit?: number;
  category?: string;
  orderBy?: 'created_at' | 'views' | 'downloads' | 'title';
  direction?: 'asc' | 'desc';
  showAdult?: boolean;
}) {
  try {
    // 페이지네이션 계산
    const skip = (page - 1) * limit;
    
    // 조회 조건 설정 (공개된 이미지만)
    const whereClause: any = {
      isPublic: true
    };
    
    if (category && category !== 'all') {
      whereClause.category = category;
    }
    
    // 성인 컨텐츠 필터링
    if (!showAdult) {
      whereClause.isAdult = false;
    }

    // 정렬 방향 설정
    const orderDirection = direction === 'asc' ? 'asc' : 'desc';

    // 전체 이미지 수 조회 (페이지네이션 정보용)
    const totalCount = await db.aIImage.count({
      where: whereClause
    });

    // 이미지 목록 조회
    const images = await db.aIImage.findMany({
      where: whereClause,
      select: {
        id: true,
        title: true,
        fileUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        category: true,
        created_at: true,
        views: true,
        downloads: true,
        user: {
          select: {
            id: true,
            username: true,
            aiImages: true
          }
        }
      },
      orderBy: {
        [orderBy]: orderDirection
      },
      skip,
      take: limit
    });

    // 이미지 목록 반환
    return {
      success: true,
      images,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit)
      }
    };
  } catch (error) {
    console.error('[공개 이미지 목록 조회 오류]', error);
    return {
      success: false,
      error: '이미지 목록을 불러오는 중 오류가 발생했습니다',
      images: []
    };
  }
}

// 이미지 생성 응답 타입 정의
export type ImageGenerationResponse = 
  | { success: true; id?: string | number; url: string }
  | { success: false; error: string };

export async function imageGenerateImage(formData: FormData): Promise<ImageGenerationResponse> {
  const session = await getSession();

  if (!session?.id) {
    return { success: false, error: "로그인이 필요합니다." };
  }

  const imageUrl = formData.get("imageUrl") as string;
  const prompt = formData.get("prompt") as string;
  const negativePrompt = formData.get("negativePrompt") as string;
  const width = parseInt(formData.get("width") as string) || 512;
  const height = parseInt(formData.get("height") as string) || 512;
  const num_inference_steps = parseInt(formData.get("num_inference_steps") as string) || 30;
  const guidance_scale = parseFloat(formData.get("guidance_scale") as string) || 7.5;
  const scheduler = (formData.get("scheduler") as string) || "K_EULER";
  const strength = parseFloat(formData.get("strength") as string) || 0.75;
  const model = formData.get("model") as string;

  if (!imageUrl || !prompt || !model) {
    return { success: false, error: "이미지, 프롬프트, 모델이 필요합니다." };
  }

  try {
    // 모델 정보 가져오기
    const modelInfo = getImageModelById(model);
    if (!modelInfo) {
      return { success: false, error: "유효하지 않은 모델입니다." };
    }

    // API 요청 준비
    const apiVersion = modelInfo.version || modelInfo.apiModel;
    console.log(`[imageGenerateImage] API 호출 시작: 모델=${model}, 버전=${apiVersion}`);

    // API 요청 파라미터 준비
    const params = {
      prompt,
      negative_prompt: negativePrompt,
      image: imageUrl,
      width,
      height,
      num_inference_steps,
      guidance_scale,
      scheduler,
      strength,
      ...(modelInfo.additionalParams || {})
    };

    // Replicate API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Authorization": `Token ${process.env.REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        version: apiVersion,
        input: params,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error("[imageGenerateImage] API 오류:", error);
      return { success: false, error: error.detail || "이미지 생성에 실패했습니다" };
    }

    const data = await response.json();
    if (!data.id) {
      return { success: false, error: "이미지 생성 ID를 받지 못했습니다" };
    }

    // 결과 URL을 얻을 때까지 폴링
    let resultUrl = null;
    let attempts = 0;
    const maxAttempts = 30;

    while (!resultUrl && attempts < maxAttempts) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${data.id}`, {
        headers: {
          'Authorization': `Token ${process.env.REPLICATE_API_TOKEN}`,
        },
      });


      const statusData = await statusResponse.json();
      console.log(`[imageGenerateImage] 상태: ${statusData.status}`);

      if (statusData.status === 'succeeded') {
        resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
        break;
      } else if (statusData.status === 'failed') {
        console.error("[imageGenerateImage] 생성 실패:", statusData.error);
        return { success: false, error: "이미지 생성에 실패했습니다: " + statusData.error };
      }

    }

    if (!resultUrl) {
      return { success: false, error: "이미지 생성 시간이 초과되었습니다" };
    }

    console.log(`[imageGenerateImage] 성공: URL=${resultUrl.substring(0, 30)}...`);

    // 이미지 생성 기록 DB에 저장
    const imageGeneration = await db.aIImage.create({
      data: {
        userId: session.id,
        title: `image-${Date.now()}`,
        prompt,
        negativePrompt: negativePrompt || "",
        model,
        status: "completed",
        fileUrl: resultUrl,
        thumbnailUrl: resultUrl,
        width,
        height,
        format: "png",
        isPermanent: false,
        isPublic: false,
        category: "other",
      },
    });

    console.log(`[imageGenerateImage] DB 저장 완료: ID=${imageGeneration.id}`);

    // Cloudflare 업로드 예약 (비동기로 실행)
    (async () => {
      try {
        console.log(`[imageGenerateImage] Cloudflare 업로드 시작: ID=${imageGeneration.id}, URL=${resultUrl.substring(0, 30)}...`);
        const uploadResult = await scheduleCloudflareUpload(imageGeneration.id, resultUrl);
        
        if (uploadResult.success) {
          console.log(`[imageGenerateImage] Cloudflare 업로드 요청 성공: 상태=${uploadResult.status}`);
        } else {
          console.error(`[imageGenerateImage] Cloudflare 업로드 요청 실패: '알 수 없는 오류'}`);
          
          // 5초 후 다시 시도
          setTimeout(async () => {
            try {
              console.log(`[imageGenerateImage] Cloudflare 업로드 재시도: ID=${imageGeneration.id}`);
              const retryResult = await scheduleCloudflareUpload(imageGeneration.id, resultUrl);
              console.log(`[imageGenerateImage] 업로드 재시도 결과:`, 
                retryResult.success ? '성공' : '실패',
                retryResult.status
              );
            } catch (retryErr) {
              console.error('[imageGenerateImage] Cloudflare 업로드 재시도 실패:', retryErr);
            }
          }, 5000);
        }
      } catch (err) {
        console.error('[imageGenerateImage] Cloudflare 업로드 스케줄링 실패:', err);
      }
    })();

    return {
      success: true,
      url: resultUrl,
      id: imageGeneration.id
    };
  } catch (error) {
    console.error('[imageGenerateImage] 예외 발생:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "이미지 처리 중 오류가 발생했습니다" 
    };
  }
}


/**
 * 이미지 인페인팅(마스킹 영역 수정) 기능을 수행하는 함수
 * 
 * @param {object} params - 인페인팅 매개변수
 * @param {string} params.prompt - 생성할 내용에 대한 설명
 * @param {string|File} params.image - 원본 이미지(URL 또는 File 객체)
 * @param {string|File} params.mask - 마스크 이미지(URL 또는 File 객체)
 * @param {string} params.modelId - 사용할 인페인팅 모델 ID
 * @param {string} [params.negativePrompt] - 피하고 싶은 요소에 대한 설명
 * @param {number} [params.strength] - 마스크 영역의 변화 강도 (0.0-1.0)
 * @param {number} [params.steps] - 생성 단계 수
 * @param {number} [params.guidanceScale] - 프롬프트 충실도
 * @param {string} [params.scheduler] - 샘플러 종류
 * @returns {Promise<ImageGenerationResult>} 이미지 생성 결과
 */
export async function generateImageWithInpainting({
  prompt,
  image,
  mask,
  modelId = "realistic-vision-v5-inpainting",
  negativePrompt,
  strength,
  steps,
  guidanceScale,
  scheduler
}: {
  prompt: string;
  image: string | File;
  mask: string | File;
  modelId?: string;
  negativePrompt?: string;
  strength?: number;
  steps?: number;
  guidanceScale?: number;
  scheduler?: string;
}): Promise<ImageGenerationResult> {
  try {
    const session = await getSession();
    if (!session?.id) {
      throw new Error("인증 정보가 없습니다. 로그인이 필요합니다.");
    }

    // 모델 정보 가져오기
    const model = getEditModelById(modelId);
    if (!model || model.category !== 'inpainting') {
      console.error(`[인페인팅] 유효하지 않은 모델 ID: ${modelId}`);
      throw new Error("유효한 인페인팅 모델이 아닙니다.");
    }

    console.log(`[인페인팅] 요청 시작: "${prompt.substring(0, 30)}..." (모델: ${modelId}, API: ${model.apiModel})`);

    // 이미지 및 마스크 데이터 준비
    let imageBase64: string | undefined;
    let maskBase64: string | undefined;

    // 이미지 처리
    if (typeof image === 'string') {
      // URL인 경우 바로 사용
      // 상대 URL인 경우 절대 URL로 변환
      if (image.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/image';
        image = `${baseUrl}${image}`;
      }
    } else if (image instanceof File) {
      // File 객체인 경우 Base64로 변환
      imageBase64 = await fileToBase64(image);
    }

    // 마스크 처리
    if (typeof mask === 'string') {
      // URL인 경우 바로 사용
      // 상대 URL인 경우 절대 URL로 변환
      if (mask.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/image';
        mask = `${baseUrl}${mask}`;
      }
    } else if (mask instanceof File) {
      // File 객체인 경우 Base64로 변환
      maskBase64 = await fileToBase64(mask);
    }

    // API 요청 데이터 구성 - 모델별 옵션 고려
    const requestData: any = {
      prompt,
      negative_prompt: negativePrompt
    };
    
    // 모델별 필수 파라미터 및 기본값 설정
    if (model.id === "realistic-vision-v5-inpainting") {
      // Realistic Vision v5 Inpainting 모델 설정
      requestData.strength = strength;
      requestData.num_inference_steps = steps;
      requestData.guidance_scale = guidanceScale;
      requestData.scheduler = scheduler;
    } else if (model.id === "realisitic-vision-v3-inpainting") {
      // realisitic-vision-v3-inpainting 모델 설정
      // 이 모델은 다른 파라미터 이름을 사용할 수 있음
      requestData.strength = strength;
      requestData.steps = steps; // 주의: 다른 모델과 파라미터 이름이 다를 수 있음
      requestData.guidance_scale = guidanceScale;
      // 다른 필수 파라미터가 있다면 추가
    } else {
      // 기본/일반 인페인팅 모델 설정
      requestData.strength = strength;
      requestData.num_inference_steps = steps;
      requestData.guidance_scale = guidanceScale;
      requestData.scheduler = scheduler;
    }

    // 이미지 데이터 설정
    if (imageBase64) {
      requestData.image = imageBase64;
    } else if (typeof image === 'string') {
      requestData.image = image;
    }

    // 마스크 데이터 설정
    if (maskBase64) {
      requestData.mask = maskBase64;
    } else if (typeof mask === 'string') {
      requestData.mask = mask;
    }

    // 모델 추가 설정 적용 (configOptions에서 가져옴)
    if (model.configOptions) {
      Object.entries(model.configOptions).forEach(([key, config]) => {
        // 사용자 입력값이 없다면 기본값 사용
        if (!(key in requestData) && 'default' in config) {
          requestData[key] = config.default;
        }
      });
    }

    // API 요청 전 최종 데이터 로깅
    console.log(`[인페인팅] 요청 파라미터:`, {
      modelId: model.id,
      apiModel: model.apiModel,
      version: model.version,
      promptLength: prompt.length,
      imageType: typeof image,
      maskType: typeof mask,
      // 민감한 데이터는 길이만 표시
      requestDataKeys: Object.keys(requestData)
    });

    // Replicate API에 요청
    const API_KEY = process.env.REPLICATE_API_TOKEN;
    const apiUrl = `https://api.replicate.com/v1/predictions`;

    console.log(`[인페인팅] API 요청 준비: 모델=${model.apiModel}, 버전=${model.version || '최신'}`);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${API_KEY}`
      },
      body: JSON.stringify({
        version: model.version,
        input: requestData
      })
    });

    if (!response.ok) {
      let errorMessage = `API 요청 실패 (${response.status}): ${response.statusText}`;
      try {
        const errorData = await response.json();
        if (errorData.detail) {
          if (typeof errorData.detail === 'string') {
            errorMessage = `API 오류: ${errorData.detail}`;
          } else if (errorData.detail.input) {
            errorMessage = `API 입력 오류: ${JSON.stringify(errorData.detail.input)}`;
          }
        }
      } catch (parseError) {
        // JSON 파싱 실패 시 텍스트 응답 가져오기
        const errorText = await response.text();
        errorMessage = `API 오류: ${errorText.substring(0, 200)}`;
      }
      console.error(`[인페인팅] ${errorMessage}`);
      throw new Error(errorMessage);
    }

    const predictionData = await response.json();
    const predictionId = predictionData.id;
    
    console.log(`[인페인팅] 예측 ID: ${predictionId}`);
    
    // 결과 폴링
    let result = await pollReplicateResult(predictionId);
    
    // 결과 로그 추가 - Replicate API 응답 확인
    console.log(`[인페인팅] Replicate API 응답:`, {
      status: result.status,
      outputType: result.output ? typeof result.output : 'undefined',
      outputArray: result.output && Array.isArray(result.output) ? result.output.length : 'not array',
      outputFirstItem: result.output && Array.isArray(result.output) && result.output.length > 0 
        ? typeof result.output[0] : 'no items',
      rawOutput: result.output
    });

    // URL 검증 및 처리 강화
    let imageUrl = "";

    // 두 가지 경우 모두 처리 - 배열 또는 문자열
    if (result.output) {
      if (typeof result.output === 'string') {
        // 문자열 형태로 직접 URL이 반환된 경우
        imageUrl = result.output;
        console.log(`[인페인팅] 문자열 형태의 URL 추출: ${imageUrl.substring(0, 50)}...`);
      } else if (Array.isArray(result.output) && result.output.length > 0) {
        // 배열 형태로 URL이 반환된 경우
        imageUrl = result.output[0];
        console.log(`[인페인팅] 배열에서 URL 추출: ${imageUrl.substring(0, 50)}...`);
      } else {
        console.error(`[인페인팅] 지원되지 않는 output 형식:`, result.output);
        throw new Error("API가 지원되지 않는 형식으로 응답했습니다");
      }
    } else {
      console.error(`[인페인팅] API 응답에 output이 없음:`, result);
      throw new Error("API 응답에 이미지 URL을 찾을 수 없습니다");
    }

    // URL 형식 검증
    if (!imageUrl || typeof imageUrl !== 'string') {
      console.error(`[인페인팅] 유효하지 않은 URL 형식:`, imageUrl);
      throw new Error("유효하지 않은 URL 형식입니다");
    }

    // URL 프로토콜 확인 및 수정
    if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) {
      console.warn(`[인페인팅] URL에 프로토콜이 없음: ${imageUrl.substring(0, 30)}`);
      
      // http 프로토콜 추가
      imageUrl = `https://${imageUrl}`;
      console.log(`[인페인팅] 프로토콜 추가 후 URL: ${imageUrl.substring(0, 50)}...`);
    }

    console.log(`[인페인팅] 최종 이미지 URL: ${imageUrl.substring(0, 50)}...`);
    
    // 임시 ID 생성 - 실제 저장 후 업데이트됨
    const temporaryId = `inpainting-${Date.now()}`;
    
    // settings 필드에 인페인팅 정보 저장
    const settingsData = JSON.stringify({
      type: 'inpainting',
      strength: strength,
      steps: steps,
      guidance_scale: guidanceScale,
      scheduler: scheduler
    });
    
    // 이미지 메타데이터 가져오기 시도
    let imageWidth = 512;
    let imageHeight = 512;

    try {
      // API 응답에서 이미지 크기 정보 추출 시도
      if (result.output && Array.isArray(result.output) && result.output.length > 1) {
        // 일부 모델은 두 번째 요소에 메타데이터를 포함
        const metadataOutput = result.output[1];
        if (metadataOutput && typeof metadataOutput === 'object') {
          imageWidth = metadataOutput.width || imageWidth;
          imageHeight = metadataOutput.height || imageHeight;
          console.log(`[인페인팅] API 응답에서 이미지 크기 추출: ${imageWidth}x${imageHeight}`);
        }
      } else if (result.meta && result.meta.image) {
        // 일부 모델은 meta 필드에 정보 제공
        imageWidth = result.meta.image.width || imageWidth;
        imageHeight = result.meta.image.height || imageHeight;
        console.log(`[인페인팅] API 메타데이터에서 이미지 크기 추출: ${imageWidth}x${imageHeight}`);
      } else if (result.metrics && result.metrics.predict_time) {
        // 응답에서 메타데이터를 찾을 수 없으면 원본 이미지 처리
        console.log(`[인페인팅] API 응답에 이미지 크기 정보 없음, 기본값 사용: ${imageWidth}x${imageHeight}`);
      }
      
      // 클라이언트에서만 작동하는 이미지 로드 시도 (서버에서는 실행되지 않음)
      if (typeof window !== 'undefined') {
        const metadata = await getImageMetadata(imageUrl);
        if (metadata) {
          imageWidth = metadata.width;
          imageHeight = metadata.height;
          console.log(`[인페인팅] 이미지 로드 통해 크기 확인: ${imageWidth}x${imageHeight}`);
        }
      }
    } catch (metadataError) {
      console.error('이미지 메타데이터 추출 오류, 기본값 사용:', metadataError);
      // 기본값인 512x512 사용
    }
    
    // 비정상적인 값 필터링
    if (!imageWidth || imageWidth < 64 || imageWidth > 4096) imageWidth = 768;
    if (!imageHeight || imageHeight < 64 || imageHeight > 4096) imageHeight = 768;
    
    // 이미지 정보 저장
    const saveData = {
      userId: Number(session.id),
      title: temporaryId, // 임시 제목 (나중에 ID로 업데이트)
      description: `인페인팅으로 이미지 편집: ${prompt.substring(0, 50)}`,
      category: "other", // 기본 카테고리
      prompt: prompt,
      negativePrompt: negativePrompt || "",
      fileUrl: imageUrl,
      thumbnailUrl: imageUrl,
      model: modelId,
      width: imageWidth,
      height: imageHeight,
      format: "png", // 일반적으로 PNG로 설정
      settings: settingsData,
      status: "completed",
      isPublic: false,
      isAdult: false,
      steps: steps,
      cfgScale: guidanceScale,
      sampler: scheduler,
      vae: null,
      tags: "",
      isPermanent: false,
      isFeatured: false
    };
    
    // 데이터베이스에 저장
    const savedImage = await db.aIImage.create({
      data: saveData
    });
    
    // 제목 업데이트 - ID 포함
    const finalTitle = `inpainting-${savedImage.id}`;
    await db.aIImage.update({
      where: { id: savedImage.id },
      data: { title: finalTitle }
    });
    
    console.log(`[인페인팅] 이미지 저장 완료: ID=${savedImage.id}, 제목=${finalTitle}`);
    
    // 결과 반환 전 Cloudflare 업로드 스케줄링
    try {
      // URL 자세한 디버깅 로그 추가
      console.log('[인페인팅] 업로드할 이미지 URL 정보:', {
        urlValue: imageUrl,
        urlType: typeof imageUrl,
        urlLength: imageUrl ? imageUrl.length : 0,
        urlStart: imageUrl ? imageUrl.substring(0, 30) : 'undefined'
      });
      
      // URL 유효성 검사 강화
      if (imageUrl && 
          typeof imageUrl === 'string' && 
          imageUrl.length > 15 && 
          (imageUrl.startsWith('http://') || imageUrl.startsWith('https://'))) {
        
        console.log(`[인페인팅] Cloudflare 업로드 시작: ID=${savedImage.id}, URL=${imageUrl.substring(0, 50)}...`);
        
        // 클라우드플레어 업로드 스케줄링 (백그라운드로 실행)
        await scheduleCloudflareUpload(savedImage.id, imageUrl);
      } else {
        // 자세한 오류 정보 출력
        let errorReason = '';
        if (!imageUrl) errorReason = '이미지 URL이 없음';
        else if (typeof imageUrl !== 'string') errorReason = `URL이 문자열이 아님 (${typeof imageUrl})`;
        else if (imageUrl.length <= 15) errorReason = `URL이 너무 짧음 (${imageUrl.length}자)`;
        else if (!imageUrl.startsWith('http://') && !imageUrl.startsWith('https://')) 
          errorReason = `HTTP/HTTPS URL이 아님 (${imageUrl.substring(0, 10)}...)`;
        else errorReason = '알 수 없는 이유';
        
        console.warn(`[인페인팅] Cloudflare 업로드 건너뜀 - ${errorReason}: `, 
          imageUrl ? `"${imageUrl.substring(0, 50)}..."` : '없음');
      }
    } catch (uploadError) {
      console.error('[인페인팅] Cloudflare 업로드 처리 중 오류:', uploadError);
      // 업로드 실패해도 이미지 생성은 성공했으므로 계속 진행
    }
    
    // 결과 반환
    return {
      success: true,
      id: savedImage.id,
      imageUrl: imageUrl, 
      error: undefined,
      prompt,
      negativePrompt: negativePrompt || "",
      model: modelId,
      source: "Replicate"
    };
    
  } catch (error: any) {
    console.error('[인페인팅 오류]', error);
    return { 
      success: false, 
      id: undefined, 
      imageUrl: "", 
      error: error.message || "인페인팅 처리 중 오류가 발생했습니다.", 
      prompt: prompt,
      negativePrompt: negativePrompt || "",
      model: modelId,
      source: "Replicate"
    };
  }
}

/**
 * Replicate API 결과를 폴링하는 헬퍼 함수
 */
async function pollReplicateResult(predictionId: string, maxAttempts = 60, delayMs = 2000) {
  const API_KEY = process.env.REPLICATE_API_TOKEN;
  const apiUrl = `https://api.replicate.com/v1/predictions/${predictionId}`;
  
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Token ${API_KEY}`
      }
    });
    
    if (!response.ok) {
      throw new Error(`폴링 실패: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status === "succeeded") {
      return data;
    } else if (data.status === "failed") {
      throw new Error(`이미지 생성 실패: ${data.error || "알 수 없는 오류"}`);
    }
    
    // 처리 중인 경우 대기
    attempts++;
    await new Promise(resolve => setTimeout(resolve, delayMs));
  }
  
  throw new Error("타임아웃: 이미지 생성이 너무 오래 걸립니다.");
}

/**
 * File 객체를 Base64 문자열로 변환하는 유틸리티 함수
 */
async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64 = reader.result as string;
      // "data:image/jpeg;base64," 부분 제거
      const base64Data = base64.split(",")[1];
      resolve(base64Data);
    };
    reader.onerror = error => reject(error);
  });
}

// 이미지 메타데이터 가져오기 함수 개선
async function getImageMetadata(url: string): Promise<{ width: number, height: number }> {
  const defaultDimensions = { width: 512, height: 512 };
  
  try {
    // 기본 검증
    if (!url || typeof url !== 'string') {
      console.error(`[이미지 메타데이터] 유효하지 않은 URL: 비어있거나 문자열이 아님`);
      return defaultDimensions;
    }
    
    // URL 구문 검증
    try {
      new URL(url);
    } catch (e) {
      console.error(`[이미지 메타데이터] 잘못된 URL 형식: ${url.substring(0, 30)}...`);
      return defaultDimensions;
    }
    
    // HTTP/HTTPS 검증
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`[이미지 메타데이터] URL이 HTTP/HTTPS로 시작하지 않음: ${url.substring(0, 30)}...`);
      return defaultDimensions;
    }
    
    // 최대 3회까지 시도
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // 먼저 HEAD 요청으로 컨텐츠 타입 확인 (경량 요청)
        const headResponse = await fetch(url, { 
          method: 'HEAD',
          cache: 'no-store',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!headResponse.ok) {
          console.error(`[이미지 메타데이터] HEAD 요청 실패 (${retryCount + 1}/${maxRetries}): ${headResponse.status}`);
          // HEAD 실패 시 바로 GET 요청 시도 - 일부 서버는 HEAD를 지원하지 않음
          throw new Error('HEAD 요청 실패');
        }
        
        const contentType = headResponse.headers.get('content-type');
        if (!contentType || !contentType.startsWith('image/')) {
          console.error(`[이미지 메타데이터] 이미지가 아님 (${retryCount + 1}/${maxRetries}): ${contentType}`);
          throw new Error('이미지 컨텐츠 타입이 아님');
        }
        
        // 전체 이미지 요청
        const response = await fetch(url, {
          cache: 'no-store',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!response.ok) {
          console.error(`[이미지 메타데이터] GET 요청 실패 (${retryCount + 1}/${maxRetries}): ${response.status}`);
          throw new Error('GET 요청 실패');
        }
        
        const blob = await response.blob();
        
        // 이미지 실제 크기 추출
        const dimensions = await extractImageDimensions(blob);
        console.log(`[이미지 메타데이터] 성공: ${dimensions.width}x${dimensions.height}`);
        return dimensions;
        
      } catch (error) {
        retryCount++;
        console.error(`[이미지 메타데이터] 시도 ${retryCount}/${maxRetries} 실패:`, error);
        
        if (retryCount < maxRetries) {
          // 재시도 전 지연 (백오프 전략 적용)
          const delay = retryCount * 1000; // 1초, 2초, 3초...
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    // 최대 재시도 횟수 초과 시 기본값 반환
    console.warn(`[이미지 메타데이터] 최대 재시도 횟수 초과, 기본값 사용: ${defaultDimensions.width}x${defaultDimensions.height}`);
    return defaultDimensions;
    
  } catch (error) {
    console.error(`[이미지 메타데이터] 예외 발생:`, error);
    return defaultDimensions;
  }
}

// 이미지 Blob에서 크기 추출하는 헬퍼 함수
function extractImageDimensions(blob: Blob): Promise<{ width: number, height: number }> {
  const defaultDimensions = { width: 512, height: 512 };
  
  return new Promise<{ width: number, height: number }>((resolve, reject) => {
    try {
      const img = new Image();
      const objectUrl = URL.createObjectURL(blob);
      
      // 타임아웃 설정
      const timeoutId = setTimeout(() => {
        URL.revokeObjectURL(objectUrl);
        console.error('[이미지 메타데이터] 이미지 로드 타임아웃');
        resolve(defaultDimensions); // reject 대신 기본값으로 resolve
      }, 10000);
      
      img.onload = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objectUrl);
        
        // 크기 추출 및 검증
        const width = img.naturalWidth || img.width;
        const height = img.naturalHeight || img.height;
        
        if (!width || !height || width <= 0 || height <= 0) {
          console.warn('[이미지 메타데이터] 유효하지 않은 크기, 기본값 사용');
          resolve(defaultDimensions);
        } else {
          // 안전한 값 범위 적용
          const safeWidth = Math.min(Math.max(1, width), 16384);
          const safeHeight = Math.min(Math.max(1, height), 16384);
          resolve({ width: safeWidth, height: safeHeight });
        }
      };
      
      img.onerror = () => {
        clearTimeout(timeoutId);
        URL.revokeObjectURL(objectUrl);
        console.error('[이미지 메타데이터] 이미지 로드 실패');
        resolve(defaultDimensions); // reject 대신 기본값으로 resolve
      };
      
      img.crossOrigin = 'anonymous';
      img.src = objectUrl;
      
    } catch (error) {
      console.error('[이미지 메타데이터] 예외 발생:', error);
      resolve(defaultDimensions); // 모든 오류 상황에서 기본값 반환
    }
  });
}

// 이미지 URL 유효성 검사 함수 개선
async function isValidImageUrl(url: string): Promise<boolean> {
  if (!url || typeof url !== 'string') {
    console.error('[이미지 URL 검증] 유효하지 않은 URL: 비어있거나 문자열이 아님');
    return false;
  }
  
  try {
    // URL 구문 검증
    try {
      new URL(url);
    } catch (e) {
      console.error(`[이미지 URL 검증] 잘못된 URL 형식: ${url.substring(0, 30)}...`);
      return false;
    }
    
    // HTTP/HTTPS 검증
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      console.error(`[이미지 URL 검증] URL이 HTTP/HTTPS로 시작하지 않음: ${url.substring(0, 30)}...`);
      return false;
    }
    
    // HEAD 요청으로 컨텐츠 타입 확인
    const response = await fetch(url, { 
      method: 'HEAD',
      cache: 'no-store',
      headers: {
        'Accept': 'image/*',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    
    if (!response.ok) {
      // HEAD 요청이 실패하면 GET으로 시도
      try {
        const getResponse = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'image/*',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        if (!getResponse.ok) {
          console.error(`[이미지 URL 검증] GET 요청 실패: ${getResponse.status}`);
          return false;
        }
        
        const contentType = getResponse.headers.get('content-type');
        return !!(contentType && contentType.startsWith('image/'));
      } catch (error) {
        console.error('[이미지 URL 검증] GET 요청 오류:', error);
        return false;
      }
    }
    
    const contentType = response.headers.get('content-type');
    const isImage = !!(contentType && contentType.startsWith('image/'));
    
    if (!isImage) {
      console.error(`[이미지 URL 검증] 이미지가 아닌 컨텐츠: ${contentType}`);
    }
    
    return isImage;
  } catch (error) {
    console.error('[이미지 URL 검증] 오류 발생:', error);
    return false;
  }
} 

/**
 * 사용 가능한 인페인팅 모델 목록을 가져옵니다.
 * @returns {Promise<Array<{id: string, name: string, description: string}>>} 모델 목록
 */
export async function getAvailableInpaintingModels() {
  try {
    const session = await getSession();
    if (!session?.id) {
      return [];
    }
    
    // editModels.ts에서 모든 인페인팅 모델 가져오기
    const inpaintingModels = filterEditModelsByCategory('inpainting');
    
    // UI에 표시할 간단한 정보만 반환
    return inpaintingModels.map(model => ({
      id: model.id,
      name: model.name,
      description: model.description,
      tokenPrice: model.tokenPrice || 0
    }));
  } catch (error) {
    console.error('[인페인팅 모델 목록] 오류:', error);
    return [];
  }
} 

/**
 * 이미지 업스케일링 기능을 수행하는 함수
 * 
 * @param {object} params - 업스케일링 매개변수
 * @param {string|File} params.image - 원본 이미지(URL 또는 File 객체)
 * @param {number} [params.scale=4] - 업스케일 배율 (1-10)
 * @returns {Promise<ImageGenerationResult>} 이미지 생성 결과
 */
export async function generateImageWithUpscale({
  image,
  scale = 4
}: {
  image: string;
  scale?: number;
}): Promise<ImageGenerationResult> {
  try {
    // 세션 확인
    const session = await getSession();
    const userId = session?.id;
    
    if (!userId) {
      return {
        success: false,
        error: "로그인이 필요합니다.",
        imageUrl: "",
        id: undefined,
        model: "nightmareai/real-esrgan", 
        source: "Replicate"
      };
    }
    
    // 이미지 처리
    let imageBase64: string;
    
    if (image.startsWith('data:')) {
      imageBase64 = image.split(',')[1];
    } else {
      const imageResponse = await fetch(image);
      if (!imageResponse.ok) throw new Error('이미지를 다운로드할 수 없습니다.');
      const imageBuffer = await imageResponse.arrayBuffer();
      imageBase64 = Buffer.from(imageBuffer).toString('base64');
    }
    
    // API 요청 파라미터 구성
    const input: Record<string, any> = {
      image: `data:image/png;base64,${imageBase64}`,
      scale: scale
    };
    
    // Replicate API 설정
    const API_KEY = process.env.REPLICATE_API_TOKEN;
    if (!API_KEY) {
      return { 
        success: false, 
        error: "API 토큰이 설정되지 않았습니다.",
        imageUrl: ""
      };
    }
    
    console.log(`[업스케일링] API 요청 준비: nightmareai/real-esrgan`);
    
    // API 호출
    const response = await fetch("https://api.replicate.com/v1/predictions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `${API_KEY}`
      },
      body: JSON.stringify({
        version: "f121d640bd286e1fdc67f9799164c1d5be36ff74576ee11c803ae5b665dd46aa",
        input: input
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      return { 
        success: false, 
        error: errorData.detail || `API 오류: ${response.status}`,
        imageUrl: ""
      };
    }
    
    const prediction = await response.json();
    const predictionId = prediction.id;
    
    console.log(`[업스케일링] 예측 ID: ${predictionId}`);
    
    // 결과 폴링
    const result = await pollReplicateResult(predictionId);
    
    // 결과 처리
    let imageUrl = "";
    if (result.output) {
      if (Array.isArray(result.output) && result.output.length > 0) {
        imageUrl = result.output[0];
      } else if (typeof result.output === 'string') {
        imageUrl = result.output;
      }
    }
    
    if (!imageUrl) {
      return { 
        success: false, 
        error: "이미지 URL을 받지 못했습니다.",
        imageUrl: ""
      };
    }
    
    // 이미지 크기 추정 (선택적)
    let imageWidth = 0;
    let imageHeight = 0;
    try {
      // API 응답에서 이미지 크기 정보 추출 시도
      if (result.output && Array.isArray(result.output) && result.output.length > 1) {
        // 일부 모델은 두 번째 요소에 메타데이터를 포함
        const metadataOutput = result.output[1];
        if (metadataOutput && typeof metadataOutput === 'object') {
          imageWidth = metadataOutput.width || 0;
          imageHeight = metadataOutput.height || 0;
        }
      }
    } catch (metadataError) {
      console.error('[업스케일링] 메타데이터 추출 실패:', metadataError);
    }
    
    // DB 저장하지 않고 결과 URL만 반환
    return {
      success: true,
      imageUrl: imageUrl,
      model: "nightmareai/real-esrgan",
      source: "Replicate",
      width: imageWidth || undefined,
      height: imageHeight || undefined
    };
    
  } catch (error: any) {
    console.error('[업스케일링 오류]', error);
    return { 
      success: false, 
      id: undefined, 
      imageUrl: "", 
      error: error.message || "업스케일링 처리 중 오류가 발생했습니다.", 
      model: "nightmareai/real-esrgan",
      source: "Replicate"
    };
  }
}

export async function generateImageWithRefiner({
  image,
  prompt,
  negativePrompt,
  model = "fermatresearch/magic-image-refiner",
  resemblance = 0.6,
  guidanceScale = 4,
  scheduler = 'DDIM',
  creativity,
  sdModel
}: {
  image: string;
  prompt: string;
  negativePrompt: string;
  model?: string;
  resemblance?: number;
  guidanceScale?: number;
  scheduler?: string;
  creativity?: number;
  sdModel?: string;
}): Promise<ImageGenerationResult> {
  try {
    console.log('[리파이닝] 시작 - 입력 파라미터:', {
      model,
      promptLength: prompt.length,
      negativePromptLength: negativePrompt.length,
      resemblance,
      guidanceScale,
      scheduler,
      creativity,
      sdModel
    });

    // Replicate API 토큰 확인
    const API_TOKEN = process.env.REPLICATE_API_TOKEN;
    if (!API_TOKEN) {
      console.error('[리파이닝] Replicate API 토큰이 설정되지 않음');
      return { 
        success: false, 
        error: "API 토큰이 설정되지 않았습니다.",
        imageUrl: ""
      };
    }
    console.log('[리파이닝] Replicate API 토큰 확인 완료');

    // 사용자 세션 확인
    const session = await getSession();
    if (!session?.id) {
      console.error('[리파이닝] 세션 없음');
      return { success: false, error: '로그인이 필요합니다.' };
    }
    console.log('[리파이닝] 세션 확인 완료:', session.id);

    // 이미지 데이터 준비
    let imageData: string;
    if (image.startsWith('data:')) {
      console.log('[리파이닝] base64 이미지 처리 시작');
      imageData = image.split(',')[1];
      console.log('[리파이닝] base64 데이터 길이:', imageData.length);
    } else {
      console.log('[리파이닝] URL 이미지 처리 시작:', image);
      
      // URL 처리 및 검증 로직 추가
      let imageUrl = image;
      
      // 상대 경로 URL을 절대 경로로 변환
      if (imageUrl.startsWith('/')) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000/image';
        imageUrl = `${baseUrl}${imageUrl}`;
        console.log('[리파이닝] 상대 경로 URL을 절대 경로로 변환:', imageUrl);
      }
      
      // URL 유효성 검사
      try {
        new URL(imageUrl);
      } catch (e) {
        console.error('[리파이닝] 유효하지 않은 URL:', imageUrl, e);
        throw new Error('유효하지 않은 이미지 URL입니다.');
      }

      try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
          console.error('[리파이닝] 이미지 다운로드 실패:', response.status, response.statusText);
          throw new Error(`이미지를 다운로드할 수 없습니다. (HTTP ${response.status})`);
        }
        const imageBuffer = await response.arrayBuffer();
        imageData = Buffer.from(imageBuffer).toString('base64');
        console.log('[리파이닝] URL 이미지 base64 변환 완료');
      } catch (error) {
        console.error('[리파이닝] 이미지 다운로드 또는 변환 오류:', error);
        throw new Error('이미지 처리 중 오류가 발생했습니다: ' + (error instanceof Error ? error.message : String(error)));
      }
    }

    // 모델별 API 요청 준비
    let input: any;
    let version: string;
    
    // 모델에 따라 입력 파라미터와 버전 설정
    if (model === 'fermatresearch/magic-image-refiner') {
      // fermatresearch/magic-image-refiner 모델용 설정
      input = {
        image: `data:image/png;base64,${imageData}`,
        prompt,
        negative_prompt: negativePrompt,
        resemblance,
        guidance_scale: guidanceScale,
        scheduler
      };
      version = '507ddf6f977a7e30e46c0daefd30de7d563c72322f9e4cf7cbac52ef0f667b13';
    } else if (model === 'philz1337x/clarity-upscaler') {
      // philz1337x/clarity-upscaler 모델용 설정
      input = {
        image: `data:image/png;base64,${imageData}`,
        prompt,
        negative_prompt: negativePrompt,
        resemblance,
        guidance_scale: guidanceScale,
        scheduler,
        // clarity-upscaler 전용 옵션
        creativity: creativity || 0.35,
        sd_model: sdModel || "epicrealism_naturalSinRC1VAE.safetensors [84d76a0328]"
      };
      version = 'dfad41707589d68ecdccd1dfa600d55a208f9310748e44bfe35b4a6291453d5e';
    } else {
      // 지원되지 않는 모델
      console.error('[리파이닝] 지원되지 않는 모델:', model);
      return { 
        success: false, 
        error: `지원되지 않는 리파이너 모델: ${model}`,
        imageUrl: ""
      };
    }

    console.log('[리파이닝] API 요청 준비 완료:', {
      model,
      version,
      inputKeys: Object.keys(input)
    });

    // API 호출
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${API_TOKEN.trim()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version,
        input
      })
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[리파이닝] API 오류:', error);
      throw new Error(error.detail || '리파이닝 API 호출 실패');
    }

    const prediction = await response.json();
    console.log('[리파이닝] API 응답:', prediction);

    // 결과 확인
    if (!prediction.urls?.get) {
      throw new Error('리파이닝 결과 URL을 찾을 수 없습니다.');
    }

    // 폴링 URL 획득
    const predictionId = prediction.id;
    console.log('[리파이닝] 예측 ID:', predictionId);
    
    // Replicate API 결과 폴링 (예측 상태 확인)
    console.log('[리파이닝] 폴링 시작...');
    let attempts = 0;
    const maxAttempts = 60;
    let resultImageUrl = null;
    
    while (attempts < maxAttempts && !resultImageUrl) {
      attempts++;
      console.log(`[리파이닝] 폴링 시도 ${attempts}/${maxAttempts}`);
      
      const statusResponse = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${API_TOKEN}`
        }
      });
      
      if (!statusResponse.ok) {
        console.error(`[리파이닝] 폴링 오류: HTTP ${statusResponse.status}`);
        // 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
        continue;
      }
      
      const statusData = await statusResponse.json();
      console.log(`[리파이닝] 상태: ${statusData.status}`);
      
      if (statusData.status === 'succeeded') {
        if (Array.isArray(statusData.output) && statusData.output.length > 0) {
          resultImageUrl = statusData.output[0];
          console.log('[리파이닝] 이미지 URL 획득 성공');
        } else if (typeof statusData.output === 'string') {
          resultImageUrl = statusData.output;
          console.log('[리파이닝] 이미지 URL 획득 성공');
        } else {
          console.error('[리파이닝] 예상치 못한 출력 형식:', statusData.output);
          throw new Error('API에서 유효한 이미지 URL을 받지 못했습니다');
        }
        break;
      } else if (statusData.status === 'failed') {
        console.error('[리파이닝] 생성 실패:', statusData.error);
        throw new Error('이미지 생성 실패: ' + (statusData.error || '알 수 없는 오류'));
      } else if (['starting', 'processing'].includes(statusData.status)) {
        // 처리 중, 대기 후 재시도
        await new Promise(resolve => setTimeout(resolve, 2000));
      } else {
        console.warn(`[리파이닝] 알 수 없는 상태: ${statusData.status}`);
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    if (!resultImageUrl) {
      throw new Error('이미지 URL 획득 시간 초과');
    }
    
    console.log('[리파이닝] 최종 이미지 URL:', resultImageUrl.substring(0, 50) + '...');

    // 이미지 저장
    const savedImage = await saveGeneratedImage({
      prompt,
      fileUrl: resultImageUrl,
      modelId: model,
      negativePrompt,
      settings: JSON.stringify({
        resemblance,
        guidanceScale,
        scheduler,
        ...(model === 'philz1337x/clarity-upscaler' ? { creativity, sdModel } : {})
      })
    });

    console.log('[리파이닝] 이미지 저장 완료:', {
      id: savedImage.id,
      url: savedImage.url
    });

    // Cloudflare 업로드 예약 (이제 실제 이미지 URL을 전달)
    console.log('[리파이닝] Cloudflare 업로드 예약 시작:', {
      imageId: savedImage.id,
      url: resultImageUrl
    });

    await scheduleCloudflareUpload(savedImage.id, resultImageUrl);

    console.log('[리파이닝] 완료');

    return {
      success: true,
      imageUrl: resultImageUrl,
      id: savedImage.id
    };

  } catch (error) {
    console.error('[리파이닝 오류]', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.',
      imageUrl: ''
    };
  }
}

