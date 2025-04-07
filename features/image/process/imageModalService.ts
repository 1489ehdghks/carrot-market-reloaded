export interface ImageModalData {
  id: number;
  imageUrl: string;
  thumbnailUrl: string;
  prompt: string;
  negativePrompt?: string;
  model: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  seed?: number;
  title?: string;
  user: {
    username: string;
    avatar?: string;
  };
  createdAt: Date;
}

export async function getImageModalData(imageId: number): Promise<ImageModalData | null> {
  try {
    const response = await fetch(`/api/image/${imageId}/imageModal`);
    if (!response.ok) {
      throw new Error('이미지 정보를 가져오는데 실패했습니다');
    }
    return await response.json();
  } catch (error) {
    console.error('이미지 정보 조회 중 오류:', error);
    return null;
  }
} 