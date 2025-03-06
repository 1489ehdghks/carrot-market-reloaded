import { ImageSettings } from '../components/client/SettingsExporter';

/**
 * 세팅을 JSON 문자열로 직렬화합니다.
 */
export function serializeSettings(settings: ImageSettings): string {
  try {
    return JSON.stringify({
      ...settings,
      _exported: new Date().toISOString(),
      _type: 'carrotGenSettings'
    }, null, 2);
  } catch (error) {
    console.error('Failed to serialize settings:', error);
    throw new Error('Failed to serialize settings');
  }
}

/**
 * JSON 문자열을 세팅 객체로 파싱합니다.
 */
export function parseSettings(settingsJson: string): ImageSettings {
  try {
    const parsedSettings = JSON.parse(settingsJson);
    
    // 올바른 세팅 포맷인지 검증
    if (!parsedSettings._type || parsedSettings._type !== 'carrotGenSettings') {
      throw new Error('Invalid settings format');
    }
    
    // 필수 필드 추출 및 기본값 설정
    return {
      prompt: parsedSettings.prompt || '',
      negativePrompt: parsedSettings.negativePrompt || '',
      modelId: parsedSettings.modelId || 'stable-diffusion-xl',
      width: parsedSettings.width || 1024,
      height: parsedSettings.height || 1024,
      steps: parsedSettings.steps || 30,
      cfgScale: parsedSettings.cfgScale || 7,
      sampler: parsedSettings.sampler || 'DPM++ 2M Karras',
      vae: parsedSettings.vae !== undefined ? parsedSettings.vae : true
    };
  } catch (error) {
    console.error('Failed to parse settings:', error);
    throw new Error('Invalid settings format');
  }
}

/**
 * 로컬 스토리지에 세팅을 저장합니다.
 */
export function saveSettingsToLocalStorage(settings: ImageSettings, key = 'imageGenerationSettings'): void {
  try {
    localStorage.setItem(key, JSON.stringify(settings));
  } catch (error) {
    console.error('Failed to save settings to localStorage:', error);
  }
}

/**
 * 로컬 스토리지에서 세팅을 로드합니다.
 */
export function loadSettingsFromLocalStorage(key = 'imageGenerationSettings', defaultSettings?: ImageSettings): ImageSettings | null {
  try {
    const savedSettings = localStorage.getItem(key);
    if (!savedSettings) return defaultSettings || null;
    
    return JSON.parse(savedSettings);
  } catch (error) {
    console.error('Failed to load settings from localStorage:', error);
    return defaultSettings || null;
  }
}

/**
 * 세팅을 파일로 다운로드합니다.
 */
export function downloadSettingsAsFile(settings: ImageSettings, filename?: string): void {
  try {
    const settingsJson = serializeSettings(settings);
    const blob = new Blob([settingsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || `carrot-settings-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    // 정리
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  } catch (error) {
    console.error('Failed to download settings:', error);
    throw new Error('Failed to download settings');
  }
}

/**
 * 세팅 클리핑보드에 복사합니다.
 */
export async function copySettingsToClipboard(settings: ImageSettings): Promise<void> {
  try {
    const settingsJson = serializeSettings(settings);
    await navigator.clipboard.writeText(settingsJson);
  } catch (error) {
    console.error('Failed to copy settings to clipboard:', error);
    throw new Error('Failed to copy settings to clipboard');
  }
}

/**
 * 모델별 권장 세팅을 반환합니다.
 */
export function getRecommendedSettingsForModel(modelId: string): Partial<ImageSettings> {
  const defaultSettings: Partial<ImageSettings> = {
    width: 1024,
    height: 1024,
    steps: 30,
    cfgScale: 7,
    sampler: 'DPM++ 2M Karras',
    vae: true
  };

  // 모델별 특화 세팅 (필요시 확장)
  const modelSettings: Record<string, Partial<ImageSettings>> = {
    'stable-diffusion-xl': {
      width: 1024,
      height: 1024,
      steps: 30,
      cfgScale: 7,
      sampler: 'DPM++ 2M Karras',
      vae: true
    },
    'stable-diffusion-1.5': {
      width: 512,
      height: 512,
      steps: 28,
      cfgScale: 7.5,
      sampler: 'Euler a',
      vae: true
    },
    'sdxl-turbo': {
      width: 1024,
      height: 1024,
      steps: 4,
      cfgScale: 2,
      sampler: 'Euler a',
      vae: true
    },
    'anime-diffusion': {
      width: 512,
      height: 768,
      steps: 28,
      cfgScale: 9,
      sampler: 'DPM++ SDE Karras',
      vae: true
    }
  };

  return modelSettings[modelId] || defaultSettings;
} 