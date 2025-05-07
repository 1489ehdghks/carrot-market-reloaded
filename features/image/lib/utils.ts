
// 이미지 크기에 따라 적절한 variant 선택
/**
 * 이미지 크기 비율에 따라 최적의 변형자를 선택합니다.
 * 
 * @param {number} width - 이미지 너비
 * @param {number} height - 이미지 높이
 * @param {string[]} variants - 사용 가능한 변형자 배열
 * @param {boolean} isThumbnail - 썸네일용 변형자 선택 여부
 * @returns {string} 선택된 변형자 URL
 */
export function selectVariant(
  width: number, 
  height: number, 
  variants: string[], 
  isThumbnail: boolean = false
): string {
  // 변형자가 없는 경우 빈 문자열 반환
  if (!variants || variants.length === 0) {
    return '';
  }
  
  // 썸네일용이면 public 변형자 찾기
  if (isThumbnail) {
    return variants.find(v => v.includes('public')) || 
           variants.find(v => v.includes('thumbnail')) || 
           variants[0];
  }
  
  // 너비와 높이 비교하여 적절한 변형자 선택
  if (width > height) {
    // 너비가 더 큰 경우 (가로 이미지)
    return variants.find(v => v.includes('width') || v.includes('landscape')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  } else if (height > width) {
    // 높이가 더 큰 경우 (세로 이미지)
    return variants.find(v => v.includes('height') || v.includes('portrait')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  } else {
    // 너비와 높이가 같은 경우 (정사각형 이미지)
    return variants.find(v => v.includes('normal') || v.includes('square')) || 
           variants.find(v => v.includes('original')) || 
           variants[0];
  }
}

// 기존 변형자를 public 변형자로 교체하는 함수
export function generatePublicVariantUrl(originalUrl: string): string {
  try {
    // Cloudflare 이미지 URL 예시:
    // https://imagedelivery.net/abcdefg/some-id/variant
    
    const urlParts = originalUrl.split('/');
    if (urlParts.length < 4) {
      console.warn("예상된 Cloudflare URL 형식이 아닙니다:", originalUrl);
      return originalUrl;
    }
    
    // 마지막 부분(변형자)만 'public'으로 교체
    urlParts[urlParts.length - 1] = 'public';
    return urlParts.join('/');
  } catch (error) {
    console.error("URL 변환 중 오류:", error);
    return originalUrl; // 오류 발생 시 원본 반환
  }
} 