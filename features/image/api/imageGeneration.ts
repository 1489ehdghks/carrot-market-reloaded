'use server';

/**
 * 텍스트 기반 이미지 생성 API 요청 파라미터
 */
interface TextToImageParams {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  modelId: string;
  steps?: number;
  cfgScale?: number;
  sampler?: string;
  seed?: number;
  vae?: string;
  [key: string]: any;
}

/**
 * 이미지 기반 이미지 생성 API 요청 파라미터
 */
interface ImageToImageParams extends TextToImageParams {
  imageUrl: string;
  strength?: number;
}

/**
 * 텍스트 기반 이미지 생성 API
 */
export async function generateImageWithText(params: TextToImageParams) {
  try {
    console.log('이미지 생성 요청:', JSON.stringify(params, null, 2));
    
    const response = await fetch(`${process.env.AI_API_URL}/v1/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: params.modelId,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        width: params.width,
        height: params.height,
        steps: params.steps || 28,
        cfg_scale: params.cfgScale || 7,
        sampler: params.sampler || 'DPM++ 2M SDE',
        seed: params.seed || Math.floor(Math.random() * 2147483647),
        vae: params.vae,
        ...Object.fromEntries(
          Object.entries(params).filter(([key]) => 
            !['prompt', 'negativePrompt', 'width', 'height', 'modelId', 'steps', 'cfgScale', 'sampler', 'seed', 'vae'].includes(key)
          )
        )
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('이미지 생성 API 에러:', errorData);
      return {
        success: false,
        error: errorData.error || `API 요청 실패 (${response.status})`
      };
    }
    
    const data = await response.json();
    console.log('이미지 생성 API 응답:', JSON.stringify(data, null, 2));
    
    // 응답을 표준화된 형식으로 변환
    return {
      success: true,
      id: data.id || `img-${Date.now()}`,
      image: {
        url: data.data?.[0]?.url || data.image?.url || data.url,
        width: params.width,
        height: params.height
      },
      model: params.modelId,
      prompt: params.prompt
    };
  } catch (error) {
    console.error('이미지 생성 중 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
}

/**
 * 이미지 기반 이미지 생성 API
 */
export async function generateImageWithImage(params: ImageToImageParams) {
  try {
    console.log('이미지 변환 요청:', JSON.stringify({
      ...params,
      imageUrl: '이미지 URL (로그에서 생략)'
    }, null, 2));
    
    const response = await fetch(`${process.env.AI_API_URL}/v1/images/edits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`
      },
      body: JSON.stringify({
        model: params.modelId,
        prompt: params.prompt,
        negative_prompt: params.negativePrompt,
        image: params.imageUrl, // 원본 이미지 URL
        width: params.width,
        height: params.height,
        steps: params.steps || 28,
        cfg_scale: params.cfgScale || 7,
        sampler: params.sampler || 'DPM++ 2M SDE',
        seed: params.seed || Math.floor(Math.random() * 2147483647),
        strength: params.strength || 0.7,
        vae: params.vae,
        ...Object.fromEntries(
          Object.entries(params).filter(([key]) => 
            !['prompt', 'negativePrompt', 'imageUrl', 'width', 'height', 'modelId', 'steps', 'cfgScale', 'sampler', 'seed', 'strength', 'vae'].includes(key)
          )
        )
      }),
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('이미지 변환 API 에러:', errorData);
      return {
        success: false,
        error: errorData.error || `API 요청 실패 (${response.status})`
      };
    }
    
    const data = await response.json();
    console.log('이미지 변환 API 응답:', JSON.stringify(data, null, 2));
    
    // 응답을 표준화된 형식으로 변환
    return {
      success: true,
      id: data.id || `img-${Date.now()}`,
      image: {
        url: data.data?.[0]?.url || data.image?.url || data.url,
        width: params.width,
        height: params.height
      },
      model: params.modelId,
      prompt: params.prompt
    };
  } catch (error) {
    console.error('이미지 변환 중 예외 발생:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다'
    };
  }
} 