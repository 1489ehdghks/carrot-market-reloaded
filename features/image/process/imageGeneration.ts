import { encode } from 'gpt-tokenizer';

/**
 * 프롬프트 텍스트의 토큰 수를 계산합니다.
 */
export const calculateTokens = (text: string): number => {
  if (!text) return 0;
  return encode(text).length;
};

/**
 * 이미지 생성 비용을 계산합니다.
 */
export const calculateImageCost = (
  prompt: string, 
  modelId: string, 
  width: number, 
  height: number
): number => {
  // 기본 토큰 단가 (모델별로 다를 수 있음)
  const tokenRate = getModelTokenRate(modelId);
  
  // 프롬프트 토큰 수 계산
  const tokenCount = calculateTokens(prompt);
  
  // 이미지 크기에 따른 배율 계산
  const sizeFactor = calculateSizeFactor(width, height);
  
  // 최종 비용 계산
  return Math.ceil(tokenCount * tokenRate * sizeFactor);
};

/**
 * 모델별 토큰 단가를 반환합니다.
 */
const getModelTokenRate = (modelId: string): number => {
  const rates: Record<string, number> = {
    'stable-diffusion': 0.1,
    'sdxl': 0.2,
    'midjourney': 0.3,
    'dall-e-3': 0.4,
    'default': 0.15
  };
  
  return rates[modelId] || rates['default'];
};

/**
 * 이미지 크기에 따른 비용 배율을 계산합니다.
 */
const calculateSizeFactor = (width: number, height: number): number => {
  const pixelCount = width * height;
  const baseFactor = 1.0;
  
  if (pixelCount <= 512 * 512) {
    return baseFactor;
  } else if (pixelCount <= 768 * 768) {
    return baseFactor * 1.5;
  } else if (pixelCount <= 1024 * 1024) {
    return baseFactor * 2.0;
  } else {
    return baseFactor * 3.0;
  }
};

/**
 * 이미지 생성 요청의 유효성을 검사합니다.
 */
export const validateImageGeneration = (
  prompt: string, 
  modelId: string, 
  size: string, 
  useFaceSwap: boolean = false,
  faceImage: File | null = null
): boolean => {
  // 프롬프트 검사
  if (!prompt || prompt.trim().length === 0) {
    console.error('프롬프트가 비어있습니다');
    return false;
  }
  
  // 모델 검사
  if (!modelId) {
    console.error('모델 ID가 지정되지 않았습니다');
    return false;
  }
  
  // 크기 검사
  if (!size || !size.includes('x')) {
    console.error('올바르지 않은 이미지 크기 형식입니다');
    return false;
  }
  
  // Face Swap 사용 시 얼굴 이미지 검사
  if (useFaceSwap && !faceImage) {
    console.error('Face Swap을 사용하려면 얼굴 이미지가 필요합니다');
    return false;
  }
  
  return true;
};

/**
 * 이미지 압축 유틸리티 함수
 */
export const compressImage = async (file: File, quality = 0.8, maxDimension = 1200): Promise<File> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // 이미지 크기 계산
      let width = img.width;
      let height = img.height;
      
      if (width > height && width > maxDimension) {
        height = Math.round((height * maxDimension) / width);
        width = maxDimension;
      } else if (height > maxDimension) {
        width = Math.round((width * maxDimension) / height);
        height = maxDimension;
      }
      
      // Canvas 생성 및 이미지 그리기
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Canvas 컨텍스트 생성 실패'));
        return;
      }
      
      ctx.drawImage(img, 0, 0, width, height);
      
      // Blob 생성
      canvas.toBlob((blob) => {
        if (!blob) {
          reject(new Error('이미지 압축 실패'));
          return;
        }
        
        // File 객체 생성
        const compressedFile = new File([blob], file.name, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        resolve(compressedFile);
      }, 'image/jpeg', quality);
    };
    
    img.onerror = () => reject(new Error('이미지 로드 실패'));
    
    // FileReader로 이미지 데이터 로드
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        img.src = e.target.result as string;
      } else {
        reject(new Error('파일 읽기 실패'));
      }
    };
    reader.onerror = () => reject(new Error('파일 읽기 실패'));
    reader.readAsDataURL(file);
  });
}; 