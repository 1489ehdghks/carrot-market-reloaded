/**
 * 이미지 카테고리 상수 및 관련 유틸리티
 * 
 * 카테고리 추가 방법:
 * 1. IMAGE_CATEGORIES 배열에 새 카테고리 객체 추가
 * 2. IMAGE_CATEGORY_GROUPS에 그룹 내 카테고리 추가 (선택적)
 */

// 카테고리 ID 타입 정의
export type ImageCategoryId = 
  | '2d' | '2.5d' | 'realistic' 
  | 'landscape' | 'other';

// 카테고리 타입 (ID는 소문자로 통일)
export const IMAGE_CATEGORIES = [
  // 기본 스타일 카테고리 (products 페이지와 동일)
  { id: '2d' as const, name: '2D', description: '2D 스타일 일러스트' },
  { id: '2.5d' as const, name: '2.5D', description: '2.5D 스타일 일러스트' },
  { id: 'realistic' as const, name: '실사', description: '실사 스타일 이미지' },
  
  // 추가 카테고리 (필요에 따라 확장)
  { id: 'anime' as const, name: '애니메이션', description: '애니메이션 스타일 이미지' },
  { id: 'portrait' as const, name: '인물', description: '인물 중심 이미지' },
  { id: 'landscape' as const, name: '풍경', description: '풍경 이미지' },
  { id: 'concept' as const, name: '컨셉아트', description: '컨셉 아트 이미지' },
  { id: 'other' as const, name: '기타', description: '기타 스타일 이미지' },
];

// 카테고리를 그룹으로 관리 (UI 구성에 활용)
export const IMAGE_CATEGORY_GROUPS = {
  STYLE: ['2d', '2.5d', 'realistic', 'anime'] as ImageCategoryId[],
  SUBJECT: ['portrait', 'landscape'] as ImageCategoryId[],
  OTHER: ['concept', 'other'] as ImageCategoryId[],
} as const;

// 레거시 코드와의 호환성을 위한 타입 정의
export type ImageCategory = ImageCategoryId;

// 카테고리 그룹 타입 정의
export type ImageCategoryGroup = keyof typeof IMAGE_CATEGORY_GROUPS;

// 카테고리 ID로 카테고리 정보 찾기
export function getCategoryById(id: ImageCategoryId): typeof IMAGE_CATEGORIES[number] | undefined {
  return IMAGE_CATEGORIES.find(cat => cat.id === id);
}

// 카테고리 이름으로 카테고리 정보 찾기
export function getCategoryByName(name: string): typeof IMAGE_CATEGORIES[number] | undefined {
  return IMAGE_CATEGORIES.find(cat => cat.name === name);
}

// 특정 그룹에 속한 카테고리 목록 가져오기
export function getCategoriesByGroup(group: ImageCategoryGroup): typeof IMAGE_CATEGORIES[number][] {
  const categoryIds = IMAGE_CATEGORY_GROUPS[group];
  return IMAGE_CATEGORIES.filter(cat => categoryIds.includes(cat.id as ImageCategoryId));
}

// 모든 카테고리 그룹 가져오기
export function getAllCategoryGroups(): {
  group: ImageCategoryGroup;
  categories: typeof IMAGE_CATEGORIES[number][];
}[] {
  return Object.keys(IMAGE_CATEGORY_GROUPS).map(group => ({
    group: group as ImageCategoryGroup,
    categories: getCategoriesByGroup(group as ImageCategoryGroup)
  }));
}

// 이미지 생성 상태 타입
export type ImageGenerationStatus = 
  | 'pending' 
  | 'processing' 
  | 'completed' 
  | 'failed';

// 이미지 생성 설정 타입
export interface ImageGenerationSettings {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  num_inference_steps: number;
  guidance_scale: number;
  scheduler: string;
  strength?: number;
  model: string;
}

// 이미지 생성 결과 타입
export interface ImageGenerationResult {
  success: boolean;
  id?: number;
  imageUrl?: string;
  error?: string;
  status?: ImageGenerationStatus;
}

// 이미지 생성 요청 타입
export interface ImageGenerationRequest {
  prompt: string;
  image: string | File; // base64 또는 File 객체
  negativePrompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  scheduler?: string;
  strength?: number;
  model?: string;
}

// 이미지-이미지 생성 파라미터
export interface ImageToImageGenerationParams {
  image: File | string;
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  num_inference_steps?: number;
  guidance_scale?: number;
  scheduler?: string;
  strength?: number;
  model?: string;
  userId: number;
}

// 이미지-이미지 생성 결과
export interface ImageToImageGenerationResult {
  success: boolean;
  id?: number;
  imageUrl: string;
  error?: string;
} 