"use server";

import { revalidatePath } from "next/cache";
import { getImageSession } from "@/entities/session/service";
import { generateImageWithText, generateImageWithImage, editImage } from "@/app/lib/image-generation";
import { validateImageGeneration } from "@/app/lib/image-generation-errors";

export async function generateImageWithTextAction(formData: FormData) {
  const session = await getImageSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const prompt = formData.get("prompt") as string;
  const modelId = formData.get("modelId") as string;
  const samplerId = formData.get("samplerId") as string;
  const vaeId = formData.get("vaeId") as string;
  const steps = parseInt(formData.get("steps") as string);
  const cfgScale = parseFloat(formData.get("cfgScale") as string);
  const width = parseInt(formData.get("width") as string);
  const height = parseInt(formData.get("height") as string);
  const seed = parseInt(formData.get("seed") as string);
  const negativePrompt = formData.get("negativePrompt") as string;

  validateImageGeneration({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt
  });

  const result = await generateImageWithText({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt,
    session
  });

  revalidatePath("/");
  return result;
}

export async function generateImageWithImageAction(formData: FormData) {
  const session = await getImageSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const prompt = formData.get("prompt") as string;
  const modelId = formData.get("modelId") as string;
  const samplerId = formData.get("samplerId") as string;
  const vaeId = formData.get("vaeId") as string;
  const steps = parseInt(formData.get("steps") as string);
  const cfgScale = parseFloat(formData.get("cfgScale") as string);
  const width = parseInt(formData.get("width") as string);
  const height = parseInt(formData.get("height") as string);
  const seed = parseInt(formData.get("seed") as string);
  const negativePrompt = formData.get("negativePrompt") as string;
  const initImage = formData.get("initImage") as File;

  validateImageGeneration({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt,
    initImage
  });

  const result = await generateImageWithImage({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt,
    initImage,
    session
  });

  revalidatePath("/");
  return result;
}

export async function editImageAction(formData: FormData) {
  const session = await getImageSession();
  if (!session) {
    throw new Error("로그인이 필요합니다.");
  }

  const prompt = formData.get("prompt") as string;
  const modelId = formData.get("modelId") as string;
  const samplerId = formData.get("samplerId") as string;
  const vaeId = formData.get("vaeId") as string;
  const steps = parseInt(formData.get("steps") as string);
  const cfgScale = parseFloat(formData.get("cfgScale") as string);
  const width = parseInt(formData.get("width") as string);
  const height = parseInt(formData.get("height") as string);
  const seed = parseInt(formData.get("seed") as string);
  const negativePrompt = formData.get("negativePrompt") as string;
  const initImage = formData.get("initImage") as File;
  const maskImage = formData.get("maskImage") as File;

  validateImageGeneration({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt,
    initImage,
    maskImage
  });

  const result = await editImage({
    prompt,
    modelId,
    samplerId,
    vaeId,
    steps,
    cfgScale,
    width,
    height,
    seed,
    negativePrompt,
    initImage,
    maskImage,
    session
  });

  revalidatePath("/");
  return result;
} 