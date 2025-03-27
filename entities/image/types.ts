// 이미지 엔티티 타입 정의

// 이미지 기본 데이터 모델
export interface Image {
  id: number | string;
  title: string;
  description?: string;
  fileUrl: string;
  thumbnailUrl?: string;
  userId: number;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
}

// AI 이미지 데이터 모델 (이미지 확장)
export interface AIImage extends Image {
  prompt: string;
  negativePrompt?: string;
  width: number;
  height: number;
  model: string;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae?: string;
  isPermanent: boolean;
  format: string;
  settings?: string; // JSON 문자열로 저장된 추가 설정
}

// 이미지 생성 서비스 응답
export interface ImageServiceResponse {
  success: boolean;
  image?: Partial<AIImage>;
  error?: string;
  tempUrl?: string;
} 