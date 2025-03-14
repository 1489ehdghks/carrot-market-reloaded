"use server";

import {
  generateImageWithText as genImageWithText,
  generateImageWithImage as genImageWithImage,
  scheduleCloudflareUpload as scheduleUpload,
  getImageUploadUrl as getUploadUrl,
  saveGeneratedImage as saveImage,
  publishImage as publish,
  type ImageGenerationParams,
  type ImageGenerationResult
} from "../../lib/imageService";

// Text2Image 함수 - 외부로 노출할 서버 액션
export async function generateImageWithText(params: ImageGenerationParams): Promise<ImageGenerationResult> {
  return await genImageWithText({ ...params, saveMetadata: params.saveMetadata || false });
}

// Image2Image 함수 - 외부로 노출할 서버 액션
export async function generateImageWithImage(
  prompt: string, 
  imageUrl: string, 
  strength?: number,
  width?: number,
  height?: number,
  saveMetadata: boolean = false
): Promise<ImageGenerationResult> {
  return await genImageWithImage(prompt, imageUrl, strength, width, height, saveMetadata);
}

// Cloudflare 업로드 스케줄링 - 외부로 노출할 서버 액션
export async function scheduleCloudflareUpload(imageId: number, originalUrl: string) {
  return await scheduleUpload(imageId, originalUrl);
}

// Cloudflare 이미지 업로드 URL 얻기 - 외부로 노출할 서버 액션
export async function getImageUploadUrl() {
  return await getUploadUrl();
}

// 이미지 정보를 DB에 저장 (영구 URL 포함) - 외부로 노출할 서버 액션
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
export async function publishImage(imageId: number) {
  return await publish(imageId);
} 