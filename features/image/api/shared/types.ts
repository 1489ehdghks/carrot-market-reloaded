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

export interface CloudflareUploadResult {
  success: boolean;
  cloudflareId?: string;
  cloudflareUrl?: string;
  variants?: string[];
  uploadStatus?: string;
  error?: string;
}

export interface ImagePublishResult {
  success: boolean;
  imageId?: number;
  title?: string;
  error?: string;
} 