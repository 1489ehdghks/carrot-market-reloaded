// 샘플러 옵션 타입 정의
export interface SamplerOption {
  id: string;
  name: string;
}

// 샘플러 데이터 - ID, 이름, 설명 포함
export const SAMPLER_OPTIONS: SamplerOption[] = [
  { id: 'DPM++ 2M Karras', name: 'DPM++ 2M Karras (권장)'},
  { id: 'DPM++ SDE Karras', name: 'DPM++ SDE Karras'},
  { id: 'Euler a', name: 'Euler a'},
  { id: 'Euler', name: 'Euler'},
  { id: 'DPM++ 2M SDE Karras', name: 'DPM++ 2M SDE Karras' },
  { id: 'DPM2 a', name: 'DPM2 a'},
  { id: 'DPM SDE', name: 'DPM SDE'},
  { id: 'DDPM', name: 'DDPM'},
  { id: 'DPM++ SDE', name: 'DPM++ SDE'},
  { id: 'LMS', name: 'LMS'},
  { id: 'LMS Karras', name: 'LMS Karras'},
  { id: 'PNDM', name: 'PNDM'},
  { id: 'DPM2', name: 'DPM2'},
  { id: 'DPM2 Karras', name: 'DPM2 Karras'},
  { id: 'DEIS', name: 'DEIS',},
  { id: 'DPM++ 2M', name: 'DPM++ 2M'},
  { id: 'DPM++ 2M SDE', name: 'DPM++ 2M SDE'},
  { id: 'K_EULER_ANCESTRAL', name: 'K_EULER_ANCESTRAL' },
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
 * 모든 샘플러 옵션(ID, 이름, 설명 포함)을 반환합니다.
 */
export function getSamplerOptions(): SamplerOption[] {
  return SAMPLER_OPTIONS;
}

/**
 * 기본 샘플러 ID를 반환합니다.
 */
export function getDefaultSampler(): string {
  // 새로운 DPM++ 2M Karras를 기본값으로 사용
  return "DPM++ 2M Karras";
}

/**
 * 지정된 ID를 가진 샘플러 옵션을 찾아 반환합니다.
 * @param id 찾을 샘플러 ID
 * @returns 해당 ID의 샘플러 옵션 또는 undefined
 */
export function getSamplerById(id: string): SamplerOption | undefined {
  return SAMPLER_OPTIONS.find(option => option.id === id);
} 