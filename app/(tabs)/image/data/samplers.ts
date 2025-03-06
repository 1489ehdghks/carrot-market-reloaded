// 샘플러 데이터 - ID만 포함하여 다양한 선택지 제공
export const SAMPLERS = [
  "DPM++ 2M Karras",
  "DPM++ SDE Karras",
  "Euler a",
  "Euler",
  "LMS",
  "Heun",
  "DPM2",
  "DPM2 a",
  "DPM++ 2S a",
  "DPM++ 2M",
  "DPM++ SDE",
  "DPM fast",
  "DPM adaptive",
  "LMS Karras",
  "DPM2 Karras",
  "DPM2 a Karras",
  "DPM++ 2S a Karras",
  "UniPC",
  "DDIM",
  "PLMS"
];

/**
 * 모든 샘플러 ID 목록을 반환합니다.
 */
export function getSamplers(): string[] {
  return SAMPLERS;
}

/**
 * 기본 샘플러를 반환합니다(첫 번째 샘플러).
 */
export function getDefaultSampler(): string {
  return SAMPLERS[0];
} 