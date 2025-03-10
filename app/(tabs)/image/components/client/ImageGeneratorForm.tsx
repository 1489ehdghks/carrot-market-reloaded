'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { useNotification } from '@/components/ui/notification';
import { AIModel } from '../../data/models';

interface ImageGeneratorFormProps {
  models: AIModel[];
  onGenerate: (params: {
    prompt: string;
    negativePrompt: string;
    modelId: string;
    width: number;
    height: number;
    steps: number;
    cfgScale: number;
    sampler: string;
    vae: string;
  }) => Promise<any>;
}

// 샘플러 옵션 목록
const SAMPLERS = [
  { value: 'DPM++ 2M Karras', label: 'DPM++ 2M Karras (권장)' },
  { value: 'DPM++ SDE Karras', label: 'DPM++ SDE Karras' },
  { value: 'DPM++ 2M SDE', label: 'DPM++ 2M SDE' },
  { value: 'Euler a', label: 'Euler a' },
  { value: 'Euler', label: 'Euler' },
  { value: 'LMS', label: 'LMS' },
  { value: 'Heun', label: 'Heun' },
  { value: 'DPM2', label: 'DPM2' },
  { value: 'DPM2 a', label: 'DPM2 a' },
  { value: 'DPM++ 2S a', label: 'DPM++ 2S a' },
  { value: 'DPM++ 2M', label: 'DPM++ 2M' },
  { value: 'DPM fast', label: 'DPM fast' },
  { value: 'DPM adaptive', label: 'DPM adaptive' },
  { value: 'LMS Karras', label: 'LMS Karras' },
  { value: 'DPM2 Karras', label: 'DPM2 Karras' },
  { value: 'DPM2 a Karras', label: 'DPM2 a Karras' },
  { value: 'DDIM', label: 'DDIM' },
  { value: 'PLMS', label: 'PLMS' },
  { value: 'UniPC', label: 'UniPC' }
];

// VAE 옵션 목록
const VAE_OPTIONS = [
  { value: '', label: 'VAE 사용 안함' },
  { value: 'Default VAE', label: '기본 VAE' },
  { value: 'sd-vae-ft-mse', label: 'SD VAE FT MSE' },
  { value: 'sd-vae-ft-ema', label: 'SD VAE FT EMA' },
  { value: 'vae-ft-mse-840000-ema-pruned', label: 'VAE FT MSE 840000 EMA' },
  { value: 'kl-f8-anime2', label: 'KL-F8 Anime' },
  { value: 'blessed2', label: 'Blessed2 VAE' }
];

export function ImageGeneratorForm({ models, onGenerate }: ImageGeneratorFormProps) {
  const { showNotification } = useNotification();
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  
  // 기본 모델 ID 설정
  const defaultModel = models.find(m => m.isDefault) || models[0];
  const defaultModelId = defaultModel?.id || 'Pony-Realism-v2.2';
  
  // 초기 폼 상태
  const initialFormState = {
    prompt: '',
    negativePrompt: 'worst quality, bad quality, very displeasing, displeasing, lowres, bad anatomy, bad perspective, bad proportions, bad aspect ratio, bad face, bad teeth, bad neck, bad arm, bad hands, bad ass, bad leg, bad feet, bad reflection, bad shadow, bad link, bad source, wrong hand, wrong feet, missing limb, missing eye, missing tooth, missing ear, missing finger, missing ear, extra faces, extra eyes, extra eyebrows, extra mouth, extra tongue, extra teeth, extra ears, extra breasts, extra arms, extra hands, extra legs, extra digits, fewer digits, cropped head, cropped torso, cropped shoulders, cropped arms, cropped legs, mutation, deformed, disfigured, unfinished, chromatic aberration, error, jpeg artifacts, watermark, unfinished, scan, scan artifacts, signature, artist name, artist logo, abstract, abstract background',
    modelId: '',
    width: 768,
    height: 768,
    steps: 30,
    cfgScale: 7,
    sampler: SAMPLERS[0].value,
    vae: VAE_OPTIONS[1].value
  };
  
  // 폼 상태 초기화 - 기본 모델 설정
  const [formState, setFormState] = useState({
    ...initialFormState,
    modelId: defaultModelId
  });
  
  // 이미지 ID 입력 상태
  const [imageIdToLoad, setImageIdToLoad] = useState<string>('');
  
  // 모델 변경 핸들러 - 간단하게 모델 ID만 변경
  const handleModelChange = (modelId: string) => {
    setFormState(prev => ({
      ...prev,
      modelId
    }));
  };
  
  // 입력 필드 변경 핸들러
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // 숫자 값 변경 핸들러
  const handleNumberChange = (name: string, value: number) => {
    setFormState(prev => ({ ...prev, [name]: value }));
  };
  
  // 이미지 크기 프리셋 변경
  const handleSizePreset = (width: number, height: number) => {
    setFormState(prev => ({ ...prev, width, height }));
  };
  
  // 이미지 ID 입력 핸들러
  const handleImageIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageIdToLoad(e.target.value.replace(/[^0-9]/g, ''));
  };
  
  // 설정 불러오기 핸들러
  const handleLoadSettings = () => {
    const imageId = parseInt(imageIdToLoad);
    if (!isNaN(imageId) && imageId > 0) {
      loadSettingsFromImage(imageId);
    } else {
      showNotification({
        type: 'warning',
        title: '유효하지 않은 이미지 ID',
        message: '올바른 이미지 ID를 입력해주세요.',
        duration: 3000
      });
    }
  };
  
  // 오류 메시지 추출 및 알림 표시 함수
  const handleApiError = (err: any, formState: any) => {
    console.error("이미지 생성 오류:", err);
    
    let errorMessage = err.message || '이미지 생성 중 오류가 발생했습니다.';
    let errorType = 'error';
    let errorTitle = '이미지 생성 실패';
    let errorDuration = 8000;
    
    // API 응답에서 오류 정보 추출 시도
    try {
      // fetch API 오류 응답인 경우
      if (err.json && typeof err.json === 'function') {
        err.json().then((data: any) => {
          if (data.error) {
            errorMessage = data.error;
            errorType = data.errorType === 'user' ? 'warning' : 'error';
            showErrorNotification(errorMessage, errorType, errorTitle, errorDuration);
          }
        }).catch(() => {
          // JSON 파싱 실패 시 원래 메시지 사용
          showErrorNotification(errorMessage, errorType, errorTitle, errorDuration);
        });
        return; // 비동기 처리를 위해 여기서 종료
      }
      
      // 일반 오류 객체에서 응답 추출
      if (err.response?.data) {
        errorMessage = err.response.data.error || errorMessage;
        errorType = err.response.data.errorType === 'user' ? 'warning' : 'error';
      }
      
      // ResponseData 직접 추출 시도
      if (typeof err.json === 'function') {
        err.json().then((data: any) => {
          if (data && data.error) {
            errorMessage = data.error;
            errorType = data.errorType === 'user' ? 'warning' : 'error';
            showErrorNotification(errorMessage, errorType, errorTitle, errorDuration);
          }
        }).catch(() => {
          showErrorNotification(errorMessage, errorType, errorTitle, errorDuration);
        });
        return;
      }
    } catch (e) {
      // 추출 실패 시 원래 메시지 사용
      console.warn("오류 정보 추출 실패:", e);
    }
    
    // 추출 실패 시 기본 오류 표시
    showErrorNotification(errorMessage, errorType, errorTitle, errorDuration);
  };
  
  // 오류 알림 표시 함수
  const showErrorNotification = (message: string, type: string, title: string, duration: number) => {
    // NSFW 관련 오류인 경우 특별 처리
    if (message.toLowerCase().includes('nsfw') || 
        message.toLowerCase().includes('inappropriate') ||
        message.toLowerCase().includes('부적절한') ||
        message.toLowerCase().includes('adult') ||
        message.toLowerCase().includes('성인')) {
      setError('NSFW 콘텐츠 감지: 프롬프트를 수정해주세요.');
      showNotification({
        type: 'warning',
        title: 'NSFW 콘텐츠 감지',
        message: '부적절한 콘텐츠는 생성할 수 없습니다. 다음을 시도해보세요:\n1. 프롬프트에서 부적절한 단어 제거\n2. 네거티브 프롬프트에 "nude, naked, nsfw" 추가\n3. 다른 주제의 이미지 생성 시도',
        duration: 10000
      });
      return;
    }
    
    // 일반 오류 처리
    setError(message);
    showNotification({
      type: type === 'user' ? 'warning' : 'error',
      title,
      message,
      duration
    });
  };
  
  // 이미지 생성 핸들러
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      // 프롬프트 검증
      if (!formState.prompt.trim()) {
        setError('프롬프트를 입력해주세요.');
        showNotification({
          type: 'warning',
          title: '오류',
          message: '프롬프트를 입력해주세요.',
          duration: 5000
        });
        return;
      }
      
      // 모델 선택 검증
      if (!formState.modelId) {
        setError('AI 모델을 선택해주세요.');
        showNotification({
          type: 'warning',
          title: '모델 선택 필요',
          message: 'AI 이미지 생성을 위해 모델을 선택해주세요.',
          duration: 5000
        });
        return;
      }

      // 이미지 생성 진행 중 상태 설정
      setGenerating(true);
      setError('');
      setImageUrls([]);

      // 이미지 생성 시작 알림
      showNotification({
        type: 'info',
        title: '이미지 생성 중',
        message: '이미지를 생성하고 있습니다. 잠시 기다려주세요... (최대 1분 소요)',
        duration: 10000
      });

      // API 요청 전송
      const response = await onGenerate(formState);
      
      // 응답이 성공적이지 않은 경우
      if (!response.ok) {
        // 응답 본문 가져오기
        const errorData = await response.json().catch(() => ({ error: '서버 응답을 처리할 수 없습니다.' }));
        throw new Error(errorData.error || `API 오류: ${response.status}`);
      }
      
      const data = await response.json();

      // 응답 확인
      if (!data.success || !data.image) {
        // 오류 메시지 처리
        const errorMsg = data.error || '이미지 생성에 실패했습니다.';
        throw new Error(errorMsg);
      }

      // 이미지 URL 설정
      setImageUrls([data.image.url]);
      setGeneratedImageId(data.image.id);

      // 이미지 생성 성공 알림
      showNotification({
        type: 'success',
        title: '이미지 생성 완료',
        message: '이미지가 성공적으로 생성되었습니다.',
        duration: 5000
      });

      console.log('이미지 생성 완료:', data);
    } catch (err: any) {
      console.error("이미지 생성 오류:", err);
      
      // 에러 메시지 추출
      let errorMessage = err.message || '이미지 생성 중 오류가 발생했습니다.';
      
      // NSFW 관련 오류인 경우 특별 처리
      if (errorMessage.toLowerCase().includes('nsfw') || 
          errorMessage.toLowerCase().includes('inappropriate') ||
          errorMessage.toLowerCase().includes('부적절한')) {
        setError('NSFW 콘텐츠 감지: 프롬프트를 수정해주세요.');
        showNotification({
          type: 'warning',
          title: 'NSFW 콘텐츠 감지',
          message: '부적절한 콘텐츠는 생성할 수 없습니다. 프롬프트를 수정해주세요.',
          duration: 10000
        });
      } else {
        // 일반 오류 처리
        setError(errorMessage);
        showNotification({
          type: 'error',
          title: '이미지 생성 실패',
          message: errorMessage,
          duration: 8000
        });
      }
    } finally {
      setGenerating(false);
    }
  };
  
  // 이미지 ID로부터 설정 로드
  const loadSettingsFromImage = async (imageId: number) => {
    try {
      setError(null);
      
      // 이미지 설정 로드 중 알림
      showNotification({
        type: 'info',
        title: '설정 로드 중',
        message: '이미지 설정을 불러오는 중입니다...',
        duration: 3000
      });
      
      // API 호출
      const response = await fetch(`/api/images/${imageId}`);
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || '이미지 설정을 불러오는데 실패했습니다.');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.image) {
        throw new Error('이미지 데이터를 불러올 수 없습니다.');
      }
      
      // 모델 유효성 확인
      const modelExists = models.some(model => model.id === data.image.settings.modelId);
      
      if (!modelExists) {
        showNotification({
          type: 'warning',
          title: '모델 없음',
          message: `해당 이미지에 사용된 모델(${data.image.settings.modelId})이 더 이상 존재하지 않습니다. 다른 모델을 선택해주세요.`,
          duration: 5000
        });
      }
      
      // 이미지 설정 적용
      setFormState({
        prompt: data.image.settings.prompt,
        negativePrompt: data.image.settings.negativePrompt || '',
        modelId: modelExists ? data.image.settings.modelId : (formState.modelId || ''),
        width: data.image.settings.width,
        height: data.image.settings.height,
        steps: data.image.settings.steps,
        cfgScale: data.image.settings.cfgScale,
        sampler: data.image.settings.sampler,
        vae: data.image.settings.vae
      });
      
      // 설정이 로드되었음을 사용자에게 알림
      showNotification({
        type: 'success',
        title: '설정 로드 완료',
        message: '이미지 설정이 성공적으로 적용되었습니다.',
        duration: 3000
      });

    } catch (err: any) {
      console.error('이미지 설정 로드 오류:', err);
      
      setError(err.message || '이미지 설정을 불러오는데 실패했습니다.');
      showNotification({
        type: 'error',
        title: '설정 로드 실패',
        message: err.message || '이미지 설정을 불러오는데 실패했습니다.',
        duration: 5000
      });
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 에러 메시지 */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-300 p-3 rounded-md text-sm">
          {error}
        </div>
      )}
      
      {/* 모델 선택 */}
      <div>
        <label className="block text-sm font-medium mb-1">AI 모델</label>
        <Select
          name="modelId"
          value={formState.modelId}
          onValueChange={handleModelChange}
        >
          {models.map(model => (
            <option key={model.id} value={model.id}>
              {model.name}
            </option>
          ))}
        </Select>
      </div>
      
      {/* 프롬프트 입력 */}
      <div>
        <label className="block text-sm font-medium mb-1">프롬프트</label>
        <textarea
          name="prompt"
          value={formState.prompt}
          onChange={handleInputChange}
          placeholder="아름다운 풍경, 맑은 하늘, 높은 품질, 극사실적 렌더링"
          rows={4}
          className="w-full"
        />
      </div>
      
      {/* 네거티브 프롬프트 */}
      <div>
        <label className="block text-sm font-medium mb-1">네거티브 프롬프트</label>
        <textarea
          name="negativePrompt"
          value={formState.negativePrompt}
          onChange={handleInputChange}
          placeholder="저품질, 왜곡, 낮은 해상도, 흐릿함"
          rows={2}
          className="w-full"
        />
      </div>
      
      {/* 이미지 크기 설정 */}
      <div>
        <label className="block text-sm font-medium mb-1">이미지 크기</label>
        <div className="flex space-x-2 mb-2">
          <Button 
            type="button" 
            variant={formState.width === 768 && formState.height === 768 ? "default" : "outline"} 
            size="sm"
            onClick={() => handleSizePreset(768, 768)}
          >
            정사각형 (768×768)
          </Button>
          <Button 
            type="button" 
            variant={formState.width === 1024 && formState.height === 768 ? "default" : "outline"} 
            size="sm"
            onClick={() => handleSizePreset(1024, 768)}
          >
            와이드 (1024×768)
          </Button>
          <Button 
            type="button" 
            variant={formState.width === 768 && formState.height === 1024 ? "default" : "outline"} 
            size="sm"
            onClick={() => handleSizePreset(768, 1024)}
          >
            세로 (768×1024)
          </Button>
        </div>
      </div>
      
      {/* 스텝 수 슬라이더 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">스텝 수: {formState.steps}</label>
          <span className="text-xs text-gray-500">높을수록 더 상세하지만 시간이 오래 걸립니다</span>
        </div>
        <Slider
          value={[formState.steps]}
          min={20}
          max={50}
          step={1}
          onValueChange={(value) => handleNumberChange('steps', value[0])}
        />
      </div>
      
      {/* CFG 스케일 슬라이더 */}
      <div>
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium">CFG 스케일: {formState.cfgScale}</label>
          <span className="text-xs text-gray-500">프롬프트 충실도, 높을수록 프롬프트에 더 가깝습니다</span>
        </div>
        <Slider
          value={[formState.cfgScale]}
          min={1}
          max={15}
          step={0.5}
          onValueChange={(value) => handleNumberChange('cfgScale', value[0])}
        />
      </div>
      
      {/* 샘플러 선택 */}
      <div>
        <label className="block text-sm font-medium mb-1">샘플러</label>
        <Select
          name="sampler"
          value={formState.sampler}
          onValueChange={(value) => setFormState(prev => ({ ...prev, sampler: value }))}
        >
          {SAMPLERS.map(sampler => (
            <option key={sampler.value} value={sampler.value}>
              {sampler.label}
            </option>
          ))}
        </Select>
      </div>
      
      {/* VAE 선택 */}
      <div>
        <label className="block text-sm font-medium mb-1">VAE 모델</label>
        <Select
          name="vae"
          value={formState.vae}
          onValueChange={(value) => setFormState(prev => ({ ...prev, vae: value }))}
        >
          {VAE_OPTIONS.map(vae => (
            <option key={vae.value} value={vae.value}>
              {vae.label}
            </option>
          ))}
        </Select>
        <p className="text-xs text-gray-500 mt-1">
          VAE(Variational Auto-Encoder)는 이미지 품질에 영향을 줍니다.
        </p>
      </div>
      
      {/* 이미지 설정 불러오기 섹션 */}
      <div className="pt-4 pb-2 border-t border-gray-200 dark:border-gray-700 mt-4">
        <h3 className="text-sm font-medium mb-2">이미지 설정 불러오기</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={imageIdToLoad}
            onChange={handleImageIdChange}
            placeholder="이미지 ID 입력"
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md"
          />
          <Button 
            type="button" 
            onClick={handleLoadSettings}
            disabled={!imageIdToLoad}
          >
            설정 불러오기
          </Button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          이미지 ID를 입력하여 기존 이미지의 생성 설정을 불러올 수 있습니다.
        </p>
      </div>
      
      {/* 제출 버튼 */}
      <div className="pt-4">
        <Button
          type="submit"
          className="w-full"
          disabled={generating}
        >
          {generating ? '이미지 생성 중...' : '이미지 생성하기'}
        </Button>
      </div>
    </form>
  );
} 