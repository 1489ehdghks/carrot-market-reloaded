"use server"
import {db} from "@/shared/lib/db";


export type ProductType = "image" | "video";
export type ProductCategory = "2d" | "2.5d" | "realistic";

interface GetProductsOptions {
  type: ProductType;
  category?: ProductCategory;
  isAdult?: boolean;
  page?: number;
  limit?: number;
}

interface ListOptions {
  category?: ProductCategory;
  isAdult?: boolean;
  page?: number;
  limit?: number;
}

// 기본 조회 함수들
export async function getAIImage(id: number) {
  return await db.aIImage.findUnique({
    where: { id }
  });
}

export async function getAIVideo(id: number) {
  return await db.aIVideo.findUnique({
    where: { id }
  });
}

// 기본 정보만 조회 (목록용)
export async function selectAIImageBasic(id: number) {
  return await db.aIImage.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      price: true,
      category: true,
    }
  });
}

export async function selectAIVideoBasic(id: number) {
  return await db.aIVideo.findUnique({
    where: { id },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      price: true,
      category: true,
    }
  });
}

// 상세 정보 조회 (상세 페이지용)
export async function selectAIImageWithUser(id: number) {
  return await db.aIImage.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      }
    }
  });
}

export async function selectAIVideoWithUser(id: number) {
  return await db.aIVideo.findUnique({
    where: { id },
    include: {
      user: {
        select: {
          id: true,
          username: true,
          avatar: true,
        }
      }
    }
  });
}

// 페이지네이션된 목록 조회
export async function getAIImageList({
  category,
  isAdult = false,
  page = 1,
  limit = 20
}: ListOptions) {
  // 쿼리 조건 구성
  const where: any = {
    isPublic: true
  };
  
  // 카테고리 필터링 (선택 시)
  if (category) {
    where.category = category;
  }
  
  // 성인 컨텐츠 필터링
  if (!isAdult) {
    where.isAdult = false;
  }
  
  try {
    // 조건에 맞는 총 개수 먼저 조회
    const total = await db.aIImage.count({ where });
    console.log(`[products] 이미지 총 개수: ${total}, 조건:`, where);
    
    if (total === 0) {
      console.log('[products] 조건에 맞는 이미지가 없습니다');
      return [];
    }
    
    // 실제 데이터 조회
    const images = await db.aIImage.findMany({
      where,
      select: {
        id: true,
        title: true,
        thumbnailUrl: true,
        fileUrl: true, // 썸네일이 없을 경우 대체 사용
        isPermanent: true, // 영구 URL 여부 확인용
        price: true,
        category: true,
        user: {
          select: {
            username: true,
            avatar: true,
          }
        },
        created_at: true,
        isAdult: true,
      },
      orderBy: {
        created_at: "desc"
      },
      skip: (page - 1) * limit,
      take: limit,
    });
    
    console.log(`[products] 이미지 ${images.length}개 조회 완료`);
    
    // 썸네일 URL 처리 (썸네일이 없으면 원본 URL 사용)
    const processedImages = images.map(image => ({
      ...image,
      thumbnailUrl: (image.isPermanent && image.thumbnailUrl) ? image.thumbnailUrl : image.fileUrl
    }));
    
    return processedImages;
  } catch (error) {
    console.error('[products] 이미지 목록 조회 오류:', error);
    return [];
  }
}

export async function getAIVideoList({
  category,
  isAdult = false,
  page = 1,
  limit = 20
}: ListOptions) {
  return await db.aIVideo.findMany({
    where: {
      category,
      isAdult,
      isPublic: true,
    },
    select: {
      id: true,
      title: true,
      thumbnailUrl: true,
      price: true,
      category: true,
      user: {
        select: {
          username: true,
          avatar: true,
        }
      },
      created_at: true,
    },
    orderBy: {
      created_at: "desc"
    },
    skip: (page - 1) * limit,
    take: limit,
  });
}

// 기존의 getProducts 함수는 이렇게 수정
export async function getProducts(options: GetProductsOptions) {
  console.log('[products] 상품 조회 요청:', options);
  
  try {
    const products = options.type === "image" 
      ? await getAIImageList(options)
      : await getAIVideoList(options);
      
    console.log(`[products] 상품 조회 결과: ${products.length}개`);
    return products;
  } catch (error) {
    console.error('[products] 상품 조회 오류:', error);
    return [];
  }
}

export async function selectProductWithUser(id: number, type: ProductType) {
  if (type === "image") {
    return await db.aIImage.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        fileUrl: true,
        thumbnailUrl: true,
        width: true,
        height: true,
        format: true,
        prompt: true,
        negativePrompt: true,
        model: true,
        settings: true,
        views: true,
        downloads: true,
        isPublic: true,
        isAdult: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            rating: true,
            rank: true,
          }
        }
      }
    });
  } else {
    return await db.aIVideo.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        description: true,
        price: true,
        category: true,
        fileUrl: true,
        thumbnailUrl: true,
        previewUrl: true,
        width: true,
        height: true,
        duration: true,
        format: true,
        prompt: true,
        model: true,
        settings: true,
        views: true,
        downloads: true,
        isPublic: true,
        isAdult: true,
        created_at: true,
        user: {
          select: {
            id: true,
            username: true,
            avatar: true,
            rating: true,
            rank: true,
          }
        }
      }
    });
  }
}