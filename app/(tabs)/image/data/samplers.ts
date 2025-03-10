// 샘플러 옵션 타입 정의
export interface SamplerOption {
  id: string;
  name: string;
  description: string;
}

// 샘플러 데이터 - ID, 이름, 설명 포함
export const SAMPLER_OPTIONS: SamplerOption[] = [
  { id: 'DPM++ 2M Karras', name: 'DPM++ 2M Karras (권장)', description: '대부분의 이미지에 좋은 결과를 제공하는 빠른 샘플러' },
  { id: 'DPM++ SDE Karras', name: 'DPM++ SDE Karras', description: '더 높은 품질의 디테일을 제공하지만 처리 시간이 더 걸림' },
  { id: 'Euler a', name: 'Euler a', description: '빠른 생성 속도, 창의적인 결과물' },
  { id: 'Euler', name: 'Euler', description: '기본적인 샘플러, 빠른 속도' },
  { id: 'Heun', name: 'Heun', description: '높은 품질의 이미지 생성, 느린 처리 속도' },
  { id: 'DPM++ 2S a', name: 'DPM++ 2S a', description: '향상된 디테일 처리' },
  { id: 'DPM++ 2M', name: 'DPM++ 2M', description: '균형 잡힌 결과' },
  { id: 'DPM++ SDE', name: 'DPM++ SDE', description: '세밀한 디테일과 질감 표현에 좋음' },
  { id: 'DPM2 Karras', name: 'DPM2 Karras', description: 'Karras 스케줄링이 적용된 DPM2' },
  { id: 'DPM2 a Karras', name: 'DPM2 a Karras', description: 'Karras 스케줄링이 적용된 DPM2 a' },
  { id: 'DPM++ 2S a Karras', name: 'DPM++ 2S a Karras', description: 'Karras 스케줄링이 적용된 DPM++ 2S a' },
  { id: 'UniPC', name: 'UniPC', description: '최신 샘플러, 빠른 속도와 높은 품질' },
];

// 샘플러 ID만 포함한 배열 (이전 코드와의 호환성 유지)
export const SAMPLERS = SAMPLER_OPTIONS.map(option => option.id);

/**
 * 모든 샘플러 ID 목록을 반환합니다.
 */
export function getSamplers(): string[] {
  return SAMPLERS;
}

/**
 * 모든 샘플러 옵션 목록을 반환합니다.
 */
export function getSamplerOptions(): SamplerOption[] {
  return SAMPLER_OPTIONS;
}

/**
 * 기본 샘플러를 반환합니다.
 */
export function getDefaultSampler(): string {
  return 'DPM++ 2M Karras';
}

/**
 * ID로 샘플러 옵션을 찾아 반환합니다.
 * @param id 샘플러 ID
 */
export function getSamplerById(id: string): SamplerOption | undefined {
  return SAMPLER_OPTIONS.find(sampler => sampler.id === id);
} 