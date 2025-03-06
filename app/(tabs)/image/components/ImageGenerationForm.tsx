import { AI_MODELS } from "../data/models";
import { getSamplers } from "../data/samplers";
import ImageGenerationFormClient from "./client/ImageGenerationFormClient";

export interface ImageGenerationFormProps {
  onGenerationStart?: () => void;
  onGenerationComplete?: (imageUrl: string, imageId: string) => void;
  onGenerationError?: (error: Error) => void;
}

/**
 * 이미지 생성 폼 컴포넌트
 * 
 * 서버 컴포넌트에서 모델과 샘플러 데이터를 로드하고
 * 클라이언트 컴포넌트에 전달하는 역할을 합니다.
 */
export default async function ImageGenerationForm({
  onGenerationStart,
  onGenerationComplete,
  onGenerationError
}: ImageGenerationFormProps) {
  // 이 함수는 서버 컴포넌트에서 실행됩니다
  // models.ts에서 AI_MODELS를 직접 가져옵니다
  const models = AI_MODELS;
  
  // 샘플러 데이터를 가져옵니다
  const samplers = getSamplers();

  // 기본 모델 선택 (첫 번째 모델 또는 추천 모델)
  const defaultModel = models.find((model: any) => model.recommended) || models[0];
  
  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* 클라이언트 컴포넌트에 데이터 전달 */}
      <ImageGenerationFormClient
        models={models}
        samplers={samplers}
        defaultModel={defaultModel}
        onGenerationStart={onGenerationStart}
        onGenerationComplete={onGenerationComplete}
        onGenerationError={onGenerationError}
      />
    </div>
  );
} 