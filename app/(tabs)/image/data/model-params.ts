// 모델 매개변수 정의 파일
// 각 이미지 생성/변환 모델의 매개변수를 정의합니다.

export interface ModelParam {
  name: string;           // 매개변수 이름 (API 호출에 사용)
  type: 'number' | 'integer' | 'string' | 'boolean';  // 데이터 타입
  label: string;          // UI에 표시될 이름
  description?: string;   // 설명 텍스트
  default: any;           // 기본값
  min?: number;           // 최소값 (숫자 타입)
  max?: number;           // 최대값 (숫자 타입)
  step?: number;          // 증가 단위 (숫자 타입)
  options?: {             // 선택 옵션 (string 타입)
    label: string;
    value: string;
  }[];
  isAdvanced?: boolean;   // 고급 설정 여부
  isFixed?: boolean;      // 사용자 변경 불가 여부
  fixedValue?: any;       // 고정값 (변경 불가일 때)
}

export interface ModelDefinition {
  id: string;             // 모델 ID
  name: string;           // 모델 이름
  description: string;    // 모델 설명
  category: string;       // 모델 카테고리
  apiModel: string;       // API 모델명
  version: string;        // 모델 버전
  params: ModelParam[];   // 모델별 지원 매개변수
}

// InstantID 모델 정의
export const INSTANTID_MODEL: ModelDefinition = {
  id: "instantId",
  name: "InstantID",
  description: "얼굴 특성을 반영한 이미지 생성",
  category: "faceswap",
  apiModel: "zsxkib/instant-id-ipadapter-plus-face",
  version: "71ce3f946b93b23a4a927d84969f2fc9c9e3bb3f19dd66d38c74cf543890461e",
  params: [
    {
      name: "instantid_weight",
      type: "number",
      label: "얼굴 특성 강도",
      description: "얼굴 ID 특성의 반영 강도를 조절합니다",
      default: 0.6,
      min: 0.01,
      max: 2,
      step: 0.05
    },
    {
      name: "ipadapter_weight",
      type: "number",
      label: "이미지 특성 강도",
      description: "이미지 어댑터의 영향력을 조절합니다",
      default: 0.7,
      min: 0.01,
      max: 2,
      step: 0.05
    },
    {
      name: "cfg",
      type: "number",
      label: "CFG 강도",
      description: "텍스트 프롬프트의 영향력을 조절합니다",
      default: 7.5,
      min: 1.0,
      max: 20.0,
      step: 0.5,
      isAdvanced: true
    },
    {
      name: "steps",
      type: "integer",
      label: "스텝 수",
      description: "이미지 생성 단계 수 (높을수록 품질이 좋아지지만 시간이 오래 걸림)",
      default: 30,
      min: 20,
      max: 100,
      step: 1,
      isAdvanced: true
    },
    {
      name: "sampler_name",
      type: "string",
      label: "샘플러",
      description: "이미지 생성에 사용할 샘플링 방식",
      default: "euler_a",
      options: [
        { label: "Euler A", value: "euler_a" },
        { label: "Euler", value: "euler" },
        { label: "DPM++ 2M", value: "dpm++_2m" },
        { label: "DPM++ SDE", value: "dpm++_sde" },
        { label: "DDIM", value: "ddim" }
      ],
      isAdvanced: true
    },
    {
      name: "output_quality",
      type: "integer",
      label: "출력 품질",
      description: "이미지 출력 품질 (100 권장)",
      default: 100,
      min: 1,
      max: 100,
      isFixed: true,
      fixedValue: 100
    }
  ]
};

// 모델 ID로 모델 정의 가져오기
export function getModelDefinitionById(id: string): ModelDefinition | undefined {
  if (id === INSTANTID_MODEL.id) {
    return INSTANTID_MODEL;
  }
  
  // 추가 모델 정의를 여기에 추가
  
  return undefined;
}

// 모든 모델 정의 가져오기
export function getAllModelDefinitions(): ModelDefinition[] {
  return [
    INSTANTID_MODEL,
    // 추가 모델 정의를 여기에 추가
  ];
} 