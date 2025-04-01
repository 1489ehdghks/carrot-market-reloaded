'use server';

/**
 * Face Swap API 요청 파라미터
 */
interface FaceSwapParams {
  targetImage: string;
  sourceImage: string;
  modelId: string;
  strength?: number;
  [key: string]: any;
}

/**
 * Face Swap API
 */
export async function applyFaceSwap(params: FaceSwapParams) {
  try {
    console.log('Face Swap 요청:', {
      ...params,
      targetImage: '대상 이미지 URL (로그에서 생략)',
      sourceImage: '소스 이미지 URL (로그에서 생략)',
    });
    
    const response = await fetch(`${process.env.AI_API_URL}/v1/images/face-swap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model_id: params.modelId,
        target_image: params.targetImage,
        source_image: params.sourceImage,
        strength: params.strength || 0.8,
        ...Object.fromEntries(
          Object.entries(params).filter(([key]) => 
            !['targetImage', 'sourceImage', 'modelId', 'strength'].includes(key)
          )
        )
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Face Swap API 에러:', errorData);
      return {
        success: false,
        error: errorData.error || `API 요청 실패 (${response.status})`
      };
    }
    
    const data = await response.json();
    console.log('Face Swap API 응답:', {
      ...data,
      imageUrl: data.imageUrl ? '이미지 URL (로그에서 생략)' : undefined
    });
    
    // 응답을 표준화된 형식으로 변환
    return {
      success: true,
      id: data.id || `faceswap-${Date.now()}`,
      imageUrl: data.imageUrl || data.image?.url || data.url,
      model: params.modelId
    };
  } catch (error) {
    console.error('Face Swap 중 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
} 