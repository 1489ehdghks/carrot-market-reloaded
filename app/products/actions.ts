"use server"
import {db} from "@/lib/db";


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
  return await db.aIImage.findMany({
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
  return options.type === "image" 
    ? getAIImageList(options)
    : getAIVideoList(options);
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