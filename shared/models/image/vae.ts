// VAE(Variational Auto-Encoder) 옵션 정의
export const VAE_OPTIONS = [
  { id: 'default', name: 'Default VAE', description: '대부분의 모델에 호환되는 기본 VAE' },
  { id: 'Pony-Realism-v2.2', name: 'Pony Realism v2.2', description: 'Pony Realism v2.2 모델에 최적화된 VAE' },
  { id: 'sd-vae-ft-mse', name: 'SD VAE FT MSE', description: '세부적인 디테일을 잘 표현하는 VAE' },
  { id: 'sd-vae-ft-ema', name: 'SD VAE FT EMA', description: '색감이 풍부한 VAE' },
  { id: 'vae-ft-mse-840000-ema-pruned', name: 'VAE FT MSE 840000 EMA', description: '높은 품질의 이미지 생성을 위한 VAE' },
  { id: 'kl-f8-anime2', name: 'KL-F8 Anime', description: '애니메이션 스타일 이미지에 최적화된 VAE' },
  { id: 'blessed2', name: 'Blessed2 VAE', description: '컬러 밸런스가 좋은 VAE' }
];

/**
 * 기본 VAE 옵션을 반환합니다.
 */
export function getDefaultVae(): string {
  return 'default';
}

/**
 * 모든 VAE 옵션 목록을 반환합니다.
 */
export function getVaeOptions(): typeof VAE_OPTIONS {
  return VAE_OPTIONS;
}

/**
 * ID로 VAE 옵션을 찾아 반환합니다.
 * @param id VAE 옵션 ID
 */
export function getVaeById(id: string): (typeof VAE_OPTIONS)[0] | undefined {
  return VAE_OPTIONS.find(vae => vae.id === id);
} 