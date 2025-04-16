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
} from "@/features/image/process/imageService";
import { db } from '@/shared/lib/db';
import getSession from "@/shared/lib/session";
import { revalidatePath } from 'next/cache';
import { ImageCategory } from '@/features/image/image-category-types';
import { getImageModelById } from '@/shared/models/image/imageModels';


/**
 * 최적화된 이미지 생성 함수
 * 빠른 응답을 위해 Replicate API 호출 후 즉시 결과를 반환하며,
 * 이미지는 API 엔드포인트를 통해 생성되고 백그라운드에서 저장됩니다.
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
    // API 엔드포인트 대신 직접 서비스 함수 호출
    const session = await getSession();
    if (!session?.id) {
      return { success: false, error: '로그인이 필요합니다.' };
    }
    
    const result = await genImageWithText({
      prompt: params.prompt,
      modelId: params.modelId || 'realistic-vision-v5.1',
      width: params.width || 512,
      height: params.height || 512,
      steps: params.steps || 30,
      cfgScale: params.cfgScale || 7,
      sampler: params.sampler || 'DPM++ 2M Karras',
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
 * @returns {Promise<any>} 저장 결과
 */
export async function saveGeneratedImage(data: {
  prompt: string;
  fileUrl: string;
  modelId: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
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
      userId: Number(session.id) // number 타입으로 변환
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

      if (!statusResponse.ok) {
        console.error("[imageGenerateImage] 상태 확인 실패:", await statusResponse.text());
        attempts++;
        continue;
      }

      const statusData = await statusResponse.json();
      console.log(`[imageGenerateImage] 상태: ${statusData.status}`);

      if (statusData.status === 'succeeded') {
        resultUrl = Array.isArray(statusData.output) ? statusData.output[0] : statusData.output;
        break;
      } else if (statusData.status === 'failed') {
        console.error("[imageGenerateImage] 생성 실패:", statusData.error);
        return { success: false, error: "이미지 생성에 실패했습니다: " + statusData.error };
      }

      attempts++;
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