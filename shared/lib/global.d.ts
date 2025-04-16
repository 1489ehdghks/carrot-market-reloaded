// 모듈 선언
declare module "../../lib/imageService" {
  export interface ImageGenerationParams {
    prompt: string;
    size?: string;
    modelId?: string;
    negativePrompt?: string;
    apiModel?: string;
    vae?: string;
    steps?: number;
    cfgScale?: number;
    additionalParams?: Record<string, any>;
  }
  
  export interface ImageGenerationResult {
    id?: number;
    tempUrl?: string;
    fileUrl?: string;
    prompt: string;
    negativePrompt?: string;
    modelId?: string;
    width?: number;
    height?: number;
    model?: string;
    steps?: number | null;
    cfgScale?: number | null;
    sampler?: string | null;
    vae?: string | null;
    settings?: string | null;
  }
  
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

  export function generateImageWithImage(prompt: string, imageUrl: string, strength?: number, width?: number, height?: number): Promise<ImageGenerationResult>;
  export function scheduleCloudflareUpload(imageId: number, originalUrl: string): Promise<any>;
  export function getImageUploadUrl(): Promise<any>;
  export function saveGeneratedImage(data: {
    prompt: string;
    fileUrl: string;
    modelId: string;
    negativePrompt?: string;
    width?: number;
    height?: number;
  }): Promise<any>;
  export function publishImage(imageId: number): Promise<any>;
}

declare module "../../lib/modelUtils" {
  export const API_MODEL_PATHS: Record<string, string>;
  export function getApiModelPath(modelId: string): string;
  export const MODEL_DEFAULT_SETTINGS: Record<string, any>;
  export function getModelDefaultSettings(modelId: string): any;
  export function extractImageUrl(output: any): string | null;
  export function calculateTokens(text: string): number;
  export function getModelInformation(modelId: string): any;
}

declare module "./modelUtils" {
  export const API_MODEL_PATHS: Record<string, string>;
  export function getApiModelPath(modelId: string): string;
  export const MODEL_DEFAULT_SETTINGS: Record<string, any>;
  export function getModelDefaultSettings(modelId: string): any;
  export function extractImageUrl(output: any): string | null;
  export function calculateTokens(text: string): number;
  export function getModelInformation(modelId: string): any;
}

declare module "@/lib/modelUtils" {
  export * from "../../lib/modelUtils";
}

declare module "../../../lib/imageService" {
  export * from "../../lib/imageService";
}

declare module "../../../lib/modelUtils" {
  export * from "../../lib/modelUtils";
} 