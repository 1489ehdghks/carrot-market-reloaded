// 이미지 생성 관련 타입 정의

// 이미지 생성 매개변수
export interface ImageGenerationParams {
  prompt: string;
  size?: string;
  modelId?: string;
  negativePrompt?: string;
  apiModel?: string;
  vae?: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  width?: number;
  height?: number;
  additionalParams?: Record<string, any>;
  saveMetadata?: boolean;
  userId?: number;
}

// 이미지 생성 결과
export interface ImageGenerationResult {
  id?: number | string;
  imageUrl: string;
  modelId?: string;
  prompt?: string;
  width?: number;
  height?: number;
  success: boolean;
  error?: string;
}

// 이미지 영구 저장 매개변수
export interface PermanentlyStoreImageParams {
  tempUrl: string;
  fileUrl: string;
  prompt: string;
  negativePrompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae: string;
  additionalParams?: string;
} 