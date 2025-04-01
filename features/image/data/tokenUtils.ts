import { encode } from 'gpt-tokenizer';

export function calculateImageCost(prompt: string, negativePrompt: string): number {
  const tokens = encode(prompt).length + encode(negativePrompt).length;
  return Math.ceil(tokens / 1000) * 0.0001; // 1K 토큰당 0.0001 크레딧
}

export function calculateImageCostWithImage(
  prompt: string,
  negativePrompt: string,
  initImage?: File,
  maskImage?: File
): number {
  let cost = calculateImageCost(prompt, negativePrompt);
  
  if (initImage) {
    cost += 0.0001; // 초기 이미지당 0.0001 크레딧
  }
  
  if (maskImage) {
    cost += 0.0001; // 마스크 이미지당 0.0001 크레딧
  }
  
  return cost;
} 