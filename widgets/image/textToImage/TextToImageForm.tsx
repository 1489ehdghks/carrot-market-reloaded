"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import ModelSelector from "../shared/ModelSelector";
import { AI_MODELS, getDefaultModel, getModelById } from "@/shared/models/image/textModels";
import { SAMPLER_OPTIONS, getDefaultSampler } from "@/shared/models/image/samplers";
import { VAE_OPTIONS, getDefaultVae } from "@/shared/models/image/vae";
import { CollapsiblePanel } from "../shared/CollapsiblePanel";
import { CustomTooltip } from "@/widgets/shared/custom-tooltip";
import { useNotification } from "@/widgets/shared/custom-notification";
import { calculateTokens, calculateImageCost, validateImageGeneration } from '@/features/image/process/imageGeneration';
import PromptTextarea from "../shared/PromptTextarea";
import { 
  handleImageGenerationError, 
  processApiError, 
  detectErrorType,
  ImageGenerationErrorType 
} from '@/features/image/process/errorHandling';
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from "@/widgets/elements/custom-select";
import { generateImageAction } from '@/app/(tabs)/image/actions';

// 클라우드플레어 업로드 및 DB 저장 관련 타입 정의
interface GenerationResult {
  success: boolean;
  imageUrl?: string;
  imageId?: number | string;
  error?: string;
}

interface TextToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string, title?: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
  modelId?: string;
  onModelChange?: (modelId: string) => void;
  onUrlUpdate?: (imageId: string, permanentUrl: string) => void;
}

// 상수 정의
const MAX_TOKENS = 4000;
// 재시도 관련 상수
const MAX_UPLOAD_RETRIES = 3;
const RETRY_DELAY_MS = 2000;
// 이미지 생성 상태 저장용 로컬 스토리지 키
const GENERATION_STATUS_KEY = 'image_generation_status';

export default function TextToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false,
  modelId,
  onModelChange,
  onUrlUpdate
}: TextToImageFormProps) {
  const { showNotification } = useNotification();
  
  // 상태 관리
  const [textPrompt, setTextPrompt] = useState<string>('');
  const [negativePrompt, setNegativePrompt] = useState<string>('');
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [model, setModel] = useState<string>(getDefaultModel().id);
  const [width, setWidth] = useState<number>(768);
  const [height, setHeight] = useState<number>(768);
  const [steps, setSteps] = useState<number>(28);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState(getDefaultSampler());
  const [selectedVae, setSelectedVae] = useState(getDefaultVae());
  const [isGenerating, setIsGenerating] = useState(false);
  const [modelSpecificSettings, setModelSpecificSettings] = useState<Record<string, any>>({});
  
  // 로딩 상태 단순화
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'finalizing'>('idle');
  
  // 마지막 생성된 이미지 캐싱
  const [cachedResults, setCachedResults] = useState<Record<string, GenerationResult>>({});
  
  // 재시도 카운터
  const [retryCount, setRetryCount] = useState<number>(0);
  
  // Cloudflare 업로드 상태 확인을 위한 상태
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  
  // 토큰 수 계산 함수를 useMemo로 최적화
  const tokenCounter = useMemo(() => (text: string): number => {
    if (!text) return 0;
    return calculateTokens(text);
  }, []);

  // 선택된 모델 정보 가져오기 최적화
  const selectedModel = useMemo(
    () => getModelById(modelId || model) || getDefaultModel(),
    [model, modelId]
  );
  
  // 로컬 스토리지 통합 관리를 위한 함수들
  const saveToLocalStorage = useCallback((key: string, value: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
    }
  }, []);
  
  const getFromLocalStorage = useCallback((key: string, defaultValue: any = null) => {
    if (typeof window !== 'undefined') {
      const value = localStorage.getItem(key);
      if (value === null) return defaultValue;

      if (key === 'height' || key === 'width') {
        return value;
      }
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    }
    return defaultValue;
  }, []);

  // 설정 저장을 통합 관리
  const saveSettings = useCallback(() => {
    const settings = {
      model,
      width,
      height,
      steps,
      cfgScale,
      sampler,
      vae: selectedVae,
      textPrompt,
      negativePrompt,
      modelSpecificSettings
    };
    
    // 개별 저장이 아닌 한 번에 저장
    saveToLocalStorage('imageGenerationSettings', settings);
    
    // 개별 항목도 기존 방식대로 저장 (하위 호환성 유지)
    saveToLocalStorage('model', model);
    saveToLocalStorage('width', width.toString());
    saveToLocalStorage('height', height.toString());
    saveToLocalStorage('steps', steps.toString());
    saveToLocalStorage('cfgScale', cfgScale.toString());
    saveToLocalStorage('sampler', sampler);
    saveToLocalStorage('vae', selectedVae);
    saveToLocalStorage('textPrompt', textPrompt);
    saveToLocalStorage('negativePrompt', negativePrompt);
  }, [
    cfgScale, 
    height, 
    model, 
    modelSpecificSettings, 
    negativePrompt, 
    sampler, 
    saveToLocalStorage, 
    selectedVae, 
    steps, 
    textPrompt, 
    width
  ]);
  
  // 로컬 스토리지에서 설정 불러오기 (통합 방식)
  useEffect(() => {
    const savedSettings = getFromLocalStorage('imageGenerationSettings');
    
    if (savedSettings) {
      // 통합 저장된 설정이 있다면 한 번에 불러오기
      if (savedSettings.textPrompt) {
        setTextPrompt(savedSettings.textPrompt);
        setPromptTokenCount(tokenCounter(savedSettings.textPrompt));
      }
      
      if (savedSettings.negativePrompt) {
        setNegativePrompt(savedSettings.negativePrompt);
        setNegativeTokenCount(tokenCounter(savedSettings.negativePrompt));
      }
      
      if (savedSettings.width) setWidth(Number(savedSettings.width));
      if (savedSettings.height) setHeight(Number(savedSettings.height));
      if (savedSettings.model && !modelId) setModel(savedSettings.model);
      if (savedSettings.steps) setSteps(Number(savedSettings.steps));
      if (savedSettings.cfgScale) setCfgScale(Number(savedSettings.cfgScale));
      if (savedSettings.sampler) setSampler(savedSettings.sampler);
      if (savedSettings.vae) setSelectedVae(savedSettings.vae);
      if (savedSettings.modelSpecificSettings) setModelSpecificSettings(savedSettings.modelSpecificSettings);
    } else {
      // 기존 방식 (개별 항목)으로 불러오기
      const savedTextPrompt = getFromLocalStorage('textPrompt', '');
      const savedNegativePrompt = getFromLocalStorage('negativePrompt', '');
      
      if (savedTextPrompt) {
        setTextPrompt(savedTextPrompt);
        setPromptTokenCount(tokenCounter(savedTextPrompt));
      }
      
      if (savedNegativePrompt) {
        setNegativePrompt(savedNegativePrompt);
        setNegativeTokenCount(tokenCounter(savedNegativePrompt));
      }

      const savedWidth = getFromLocalStorage('width');
      const savedHeight = getFromLocalStorage('height');
      const savedModel = getFromLocalStorage('model');
      const savedSteps = getFromLocalStorage('steps');
      const savedCfgScale = getFromLocalStorage('cfgScale');
      const savedSampler = getFromLocalStorage('sampler');
      const savedVae = getFromLocalStorage('vae');
      
      if (savedWidth) setWidth(Number(savedWidth));
      if (savedHeight) setHeight(Number(savedHeight));
      if (savedModel && !modelId) setModel(savedModel);
      if (savedSteps) setSteps(Number(savedSteps));
      if (savedCfgScale) setCfgScale(Number(savedCfgScale));
      if (savedSampler) setSampler(savedSampler);
      if (savedVae) setSelectedVae(savedVae);
    }
  }, [getFromLocalStorage, modelId, tokenCounter]);
  
  // 선택된 모델에서 지원하는 샘플러 목록 가져오기
  const availableSamplers = useMemo(() => {
    // 모델에 샘플러 옵션이 지정되어 있는 경우
    if (selectedModel?.configOptions?.sampler?.options) {
      return selectedModel.configOptions.sampler.options;
    }
    // 기본 샘플러 목록 사용
    return SAMPLER_OPTIONS.map(option => ({
      value: option.id,
      label: option.name
    }));
  }, [selectedModel]);
  
  // 모델 변경 시 샘플러 자동 업데이트 (지원하지 않는 샘플러 선택 방지)
  useEffect(() => {
    // 모델이 변경되고 샘플러 옵션이 있을 때만 실행
    if (selectedModel?.configOptions?.sampler) {
      const modelSamplers = selectedModel.configOptions.sampler.options?.map(opt => opt.value) || [];
      
      // 현재 선택된 샘플러가 새 모델에서 지원되지 않는 경우 기본값으로 변경
      if (modelSamplers.length > 0 && !modelSamplers.includes(sampler)) {
        console.log(`모델 ${selectedModel.name}에서 지원하지 않는 샘플러 ${sampler}, 기본값으로 변경: ${selectedModel.configOptions.sampler.default}`);
        setSampler(selectedModel.configOptions.sampler.default);
      }
    }
  }, [selectedModel, sampler]);

  // 토큰 비용 정보 컴포넌트 메모이제이션 적용
  const TokenCostInfo = React.memo(() => {
    const currModel = getModelById(modelId || model);
    
    // 모델의 토큰 가격 표시 (models.ts에서 price 정보 활용)
    if (!currModel || !currModel.tokenPrice) {
      // 문자열 형태의 price가 있으면 변환 시도
      if (currModel && currModel.price && typeof currModel.price === 'string') {
        try {
          // 달러 표시 제거하고 숫자만 추출
          const priceString = currModel.price.replace(/[^0-9.]/g, '');
          const priceNum = parseFloat(priceString);
          
          if (!isNaN(priceNum)) {
            // 토큰 환율 적용 (imageModels.ts의 로직과 유사)
            const TOKEN_EXCHANGE_RATE = 1000;
            const COST_MULTIPLIER = 1.8;
            const tokenPrice = Math.round(priceNum * TOKEN_EXCHANGE_RATE * COST_MULTIPLIER);
            
            return (
              <span className="text-xs text-white/80 bg-black/20 px-2 py-1 rounded-full">
                {tokenPrice} 토큰
              </span>
            );
          }
        } catch (e) {
          console.error('가격 변환 오류:', e);
        }
      }
      
      // 가격 정보가 없거나 변환 실패 시
      return null;
    }
    
    return (
      <span className="text-xs text-white/80 bg-black/20 px-2 py-1 rounded-full">
        {currModel.tokenPrice} 토큰
      </span>
    );
  });

  // 모델별 설정 변경 핸들러 최적화
  const handleSettingChange = useCallback((key: string, value: any) => {
    const originalKey = key.replace('model-config-', '');
    
    console.log(`설정 변경: ${originalKey} = ${value}`);
    
    if (originalKey === 'steps') {
      setSteps(Number(value));
    } else if (originalKey === 'cfgScale') {
      setCfgScale(Number(value));
    } else if (originalKey === 'sampler') {
      setSampler(value);
    } else {
      setModelSpecificSettings(prev => ({
        ...prev,
        [originalKey]: value
      }));
    }
  }, [model]);

  // 모델 변경 핸들러 최적화
  const handleModelChange = useCallback((newModelId: string) => {
    setModel(newModelId);
    
    const newModelInfo = getModelById(newModelId);
    
    if (newModelInfo?.configOptions) {
      if (newModelInfo.configOptions.steps) {
        setSteps(newModelInfo.configOptions.steps.default);
      }
      if (newModelInfo.configOptions.cfgScale) {
        setCfgScale(newModelInfo.configOptions.cfgScale.default);
      }
      if (newModelInfo.configOptions.sampler) {
        setSampler(newModelInfo.configOptions.sampler.default);
      }
    }
    
    // onModelChange prop이 있으면 호출
    if (onModelChange) {
      onModelChange(newModelId);
    }
  }, [onModelChange]);

  // 이미지 생성 함수 - 서버 액션 활용 (성능 최적화 및 캐싱 적용)
  const generateImage = useCallback(async ({
    prompt,
    modelId,
    width,
    height
  }: {
    prompt: string;
    modelId: string;
    width: number;
    height: number;
  }) => {
    // 캐싱 문제 해결: 매번 고유한 캐시 키 생성
    const randomSeed = Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    const cacheKey = `${modelId}-${width}x${height}-${prompt.substring(0, 20)}-${timestamp}-${randomSeed}`;
    
    // 캐시된 결과 사용하지 않도록 수정
    // if (cachedResults[cacheKey] && cachedResults[cacheKey].success) {
    //   console.log('캐시된 이미지 결과 사용:', cacheKey);
    //   return cachedResults[cacheKey];
    // }
    
    // 재시도 카운터 초기화
    setRetryCount(0);
    
    try {
      // 유효성 검증
      if (!prompt || prompt.trim().length < 3) {
        throw new Error('프롬프트는 최소 3자 이상 입력해주세요.');
      }
      // 이미지 생성 상태 설정
      setLoadingState('generating');
      
      // 서버 액션 호출 - 필수 파라미터 확인
      const result = await callGenerateImageAction({
        prompt,
        modelId,
        width,
        height,
        steps,
        cfgScale,
        sampler,
        vae: selectedVae || getDefaultVae(),
        negativePrompt: negativePrompt || "",
        // 매번 다른 결과를 얻기 위한 랜덤 시드 추가
        seed: randomSeed
      });
      
      // 결과 처리 중 표시
      setLoadingState('finalizing');
      
      // 최종 상태로 변경 (타이머 사용하지 않고 즉시 처리)
      setTimeout(() => {
        setLoadingState('idle');
      }, 1000);

      // 캐시에 결과 저장
      setCachedResults(prev => ({
        ...prev,
        [cacheKey]: result
      }));

      return result;
    } catch (error) {
      // 중앙화된 에러 처리 
      let errorMessage = '이미지 생성 중 오류가 발생했습니다';
      
      if (error instanceof TypeError && error.message === 'Failed to fetch') {
        errorMessage = '서버와의 연결이 실패했습니다. 인터넷 연결을 확인해주세요.';
      } else if (error instanceof Error) {
        const errorType = detectErrorType(error.message);
        errorMessage = handleImageGenerationError(errorType, error);
      }
      
      console.error('이미지 생성 API 호출 중 오류:', error);
      
      // 캐시에 실패 결과 저장
      setCachedResults(prev => ({
        ...prev,
        [cacheKey]: { 
          success: false, 
          error: errorMessage
        }
      }));
      
      throw new Error(errorMessage);
    }
  }, [cachedResults, cfgScale, negativePrompt, sampler, selectedVae, steps]);

  // 서버 액션 호출 함수 (재시도 로직 포함)
  const callGenerateImageAction = useCallback(async (params: any): Promise<GenerationResult> => {
    let currentRetry = 0;
    
    while (currentRetry <= MAX_UPLOAD_RETRIES) {
      try {
        if (currentRetry > 0) {
          console.log(`서버 요청 재시도 중... (${currentRetry}/${MAX_UPLOAD_RETRIES})`);
          setRetryCount(currentRetry);
          // 재시도 간 지연 시간 추가
          await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
        }
        
        // 서버 액션 직접 호출
        console.log('서버 액션 호출 시작:', { ...params, prompt: params.prompt.substring(0, 50) + '...' });
        const result = await generateImageAction(params);
        console.log('서버 액션 응답 받음:', {
          success: result.success,
          imageId: result.imageId,
          imageUrl: result.imageUrl ? `${result.imageUrl.substring(0, 30)}...` : 'None'
        });
        
        // 결과 처리
        if (!result.success) {
          console.error('서버 액션 실패:', result.error);
          throw new Error(result.error || '이미지 생성에 실패했습니다');
        }
        
        // 응답 확인
        if (!result.imageUrl) {
          console.error('서버 액션 응답에 이미지 URL이 없음:', result);
          throw new Error('이미지 URL을 받지 못했습니다');
        }
        
        // 이미지 ID가 있으면 저장 및 백그라운드 작업 시작
        if (result.imageId) {
          setGeneratedImageId(String(result.imageId));
          setUploadStatus('pending'); // 업로드 상태를 pending으로 설정
          console.log(`[백그라운드 처리] 이미지 ID ${result.imageId}의 Cloudflare 업로드 상태 모니터링 시작`);
        }
        
        return result;
      } catch (error) {
        currentRetry++;
        console.error(`서버 액션 호출 오류 (시도 ${currentRetry}/${MAX_UPLOAD_RETRIES + 1}):`, error);
        
        // 네트워크 오류인 경우에만 재시도
        if (error instanceof TypeError && error.message === 'Failed to fetch') {
          if (currentRetry <= MAX_UPLOAD_RETRIES) {
            continue; // 재시도
          }
        }
        
        // 그 외 오류는 즉시 실패 처리
        throw error;
      }
    }
    
    // 모든 재시도 실패 시
    throw new Error('서버 연결 실패. 모든 재시도가 실패했습니다.');
  }, []);

  // 페이지 로드 시 저장된 생성 상태 확인 및 복원
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    // 로컬 스토리지에서 이미지 생성 상태 가져오기
    const savedGenerationStatus = localStorage.getItem(GENERATION_STATUS_KEY);
    
    if (savedGenerationStatus) {
      try {
        const status = JSON.parse(savedGenerationStatus);
        
        // 생성 중인 상태라면
        if (status.isGenerating && status.imageId) {
          console.log(`[이미지 생성] 이전 생성 작업 복원: ID=${status.imageId}, 프롬프트="${status.prompt?.substring(0, 20)}..."`);
          
          // 상태 복원
          setGeneratedImageId(status.imageId);
          setUploadStatus('pending');
          setLoadingState('finalizing');
          setIsGenerating(true);
          
          // 이미지 상태 확인 시작
          setTimeout(() => {
            checkImageUploadStatus(status.imageId);
          }, 1000);
          
          showNotification({
            title: '이미지 생성 복원',
            message: '이전에 시작된 이미지 생성 작업을 계속합니다',
            type: 'info'
          });
        }
      } catch (error) {
        console.error('저장된 생성 상태 파싱 오류:', error);
        localStorage.removeItem(GENERATION_STATUS_KEY);
      }
    }
  }, []);

  // 생성 상태 변경 시 로컬 스토리지 업데이트
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isGenerating && generatedImageId) {
      // 생성 중인 상태 저장
      const generationStatus = {
        isGenerating: true,
        imageId: generatedImageId,
        prompt: textPrompt,
        timestamp: Date.now()
      };
      
      localStorage.setItem(GENERATION_STATUS_KEY, JSON.stringify(generationStatus));
    } else if (!isGenerating) {
      // 생성이 완료되면 상태 제거
      localStorage.removeItem(GENERATION_STATUS_KEY);
    }
  }, [isGenerating, generatedImageId, textPrompt]);

  // Cloudflare 이미지 업로드 상태 확인 함수
  const checkImageUploadStatus = useCallback(async (imageId: string) => {
    if (!imageId) return;
    
    try {
      console.log(`[백그라운드 처리] 이미지 ID ${imageId} 상태 확인 요청 중...`);
      const response = await fetch(`/api/images/${imageId}/status`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`이미지 상태 확인 실패: HTTP ${response.status} - ${errorText}`);
        return;
      }
      
      const data = await response.json();
      console.log(`[백그라운드 처리] 이미지 ID ${imageId} 업로드 상태:`, {
        isPermanent: data.isPermanent,
        status: data.status,
        fileUrl: data.fileUrl ? `${data.fileUrl.substring(0, 30)}...` : 'None'
      });
      
      // 영구 URL이 있고 isPermanent가 true이면 업로드 완료
      if (data.isPermanent && data.fileUrl) {
        console.log(`[백그라운드 처리] 이미지 ID ${imageId} Cloudflare 업로드 완료!`);
        setUploadStatus('success');
        // URL 업데이트 콜백이 있으면 호출
        if (onUrlUpdate) {
          onUrlUpdate(imageId, data.fileUrl);
          console.log(`[백그라운드 처리] onUrlUpdate 호출: ID=${imageId}, URL=${data.fileUrl.substring(0, 30)}...`);
          
          // 생성 완료됨을 알림
          showNotification({
            title: '이미지 생성 완료',
            message: '이미지가 성공적으로 생성되고 저장되었습니다.',
            type: 'success'
          });

          // 생성 상태 클리어
          setIsGenerating(false);
          setLoadingState('idle');
          localStorage.removeItem(GENERATION_STATUS_KEY);
        }
      } else if (data.error) {
        console.error(`[백그라운드 처리] 이미지 ID ${imageId} 처리 오류:`, data.error);
        setUploadStatus('error');
      }
    } catch (error) {
      console.error(`[백그라운드 처리] 이미지 ID ${imageId} 상태 확인 중 오류:`, error);
    }
  }, [onUrlUpdate, showNotification]);

  // 이미지 ID가 있을 때 주기적으로 업로드 상태 확인
  useEffect(() => {
    if (!generatedImageId || uploadStatus !== 'pending') return;
    
    console.log(`[백그라운드 처리] 이미지 ID ${generatedImageId} 업로드 상태 모니터링 시작`);
    
    // 첫 번째 확인은 5초 후 (Cloudflare 업로드가 시작될 시간 고려)
    const initialDelay = setTimeout(() => {
      checkImageUploadStatus(generatedImageId);
      
      // 주기적인 확인 시작 (최대 120초)
      const maxChecks = 24; // 5초 간격으로 24번 = 120초 (2분)
      let checkCount = 0;
      
      const intervalId = setInterval(() => {
        checkCount++;
        
        if (checkCount >= maxChecks || uploadStatus !== 'pending') {
          clearInterval(intervalId);
          if (uploadStatus === 'pending') {
            console.log(`[백그라운드 처리] 이미지 ID ${generatedImageId} 업로드 상태 확인 타임아웃`);
            // 백그라운드 알림 제거 (타임아웃 시 알림을 표시하지 않음)
            setUploadStatus('idle');
          }
          return;
        }
        
        checkImageUploadStatus(generatedImageId);
      }, 5000); // 5초마다 체크
      
      return () => {
        clearInterval(intervalId);
      };
    }, 5000);
    
    return () => {
      clearTimeout(initialDelay);
    };
  }, [generatedImageId, uploadStatus, checkImageUploadStatus, showNotification]);

  // 이미지 생성 핸들러 (개선된 에러 핸들링)
  const handleImageGeneration = useCallback(async () => {
    try {
      // 프롬프트 유효성 검사
      if (!textPrompt || textPrompt.trim().length < 3) {
        showNotification({
          title: '프롬프트 오류',
          message: '프롬프트는 최소 3자 이상 입력해주세요.',
          type: 'error'
        });
        return;
      }
      
      setIsGenerating(true);
      setUploadStatus('idle');
      setGeneratedImageId(null);
      onGenerationStart?.();

      // 토큰 수 검증
      const totalTokens = promptTokenCount + negativeTokenCount;
      if (totalTokens > MAX_TOKENS) {
        const message = `토큰 수가 제한을 초과했습니다 (${totalTokens}/${MAX_TOKENS})`;
        onError(message);
        showNotification({
          title: '토큰 제한 초과',
          message,
          type: 'error'
        });
        setIsGenerating(false);
        return;
      }

      // 실제 사용할 모델 ID 결정
      const actualModelId = modelId || model;
      const currentModel = AI_MODELS.find(m => m.id === actualModelId) || getDefaultModel();

      console.log('이미지 생성 시작:', {
        prompt: textPrompt,
        modelId: actualModelId,
        width,
        height
      });

      // 이미지 생성 요청
      const result = await generateImage({
        prompt: textPrompt,
        modelId: actualModelId,
        width,
        height
      });

      console.log('이미지 생성 결과:', result);

      // 성공적으로 이미지를 생성한 경우
      if (result.imageUrl) {
        onGenerationComplete?.(result.imageUrl, result.imageId?.toString() || String(Date.now()), textPrompt);
        
        // 이미지 ID가 있으면 업로드 상태 확인을 위해 저장
        if (result.imageId) {
          setGeneratedImageId(String(result.imageId));
          setUploadStatus('pending'); // 업로드 상태를 pending으로 설정
        }
        
        // 모든 설정 한 번에 저장
        saveSettings();
      } else {
        const errorMsg = '이미지 URL을 받지 못했습니다';
        onError(errorMsg);
        showNotification({
          title: '이미지 생성 실패',
          message: errorMsg,
          type: 'error'
        });
      }

    } catch (error) {
      console.error('이미지 생성 중 오류 발생:', error);
      const errorMsg = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다';
      onError(errorMsg);
      showNotification({
        title: '이미지 생성 오류',
        message: errorMsg,
        type: 'error'
      });
      setUploadStatus('error');
    } finally {
      // 상태 초기화 - 단, uploadStatus는 초기화하지 않음
      setLoadingState('idle');
      
      // 일정 시간 후 isGenerating 상태 초기화
      setTimeout(() => {
        setIsGenerating(false);
      }, 1000);
    }
  }, [
    generateImage, 
    height, 
    model, 
    modelId, 
    negativeTokenCount, 
    onError, 
    onGenerationComplete, 
    onGenerationStart, 
    promptTokenCount, 
    saveSettings, 
    showNotification,
    textPrompt, 
    width
  ]);

  // 이미지 크기 설정 UI 요소
  const SizeSettings = useMemo(() => {
    // 현재 선택된 모델에 대한 권장 비율 정보
    const currModel = getModelById(modelId || model);
    
    // 모델에 대한 권장 비율 정보 텍스트
    const getRatioInfoText = () => {
      if (!currModel) return '';
      
      // 모델 이름에 따른 권장 비율 정보
      const modelInfo: Record<string, string> = {
        'Pony-Realism-v2.2': '1:1 (정사각형) 비율 권장',
        'pony-sdxl': '1:1 (정사각형) 또는 3:4 (세로) 비율 권장',
        'pony-nai3': '3:4 (세로) 비율 권장',
        'flux-schnell': '1:1 (정사각형) 비율 권장',
        'flux-pro': '1:1 (정사각형) 비율 권장',
        'Realistic Vision 5.1': '1:1 또는 4:3 비율 권장',
        'realism-xl': '1:1 또는 3:4 비율 권장',
        'Realism-IL-v3': '1:1 (정사각형) 비율 권장'
      };
      
      return modelInfo[currModel.id] || '1:1 (정사각형) 비율 기본 권장';
    };
    
    return (
      <div className="space-y-2 mb-4">
        <div className="flex justify-between items-center">
          <label className="text-sm font-medium">이미지 크기</label>
          <span className="text-xs text-gray-400">
            {getRatioInfoText()}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <CustomSelect
              value={width.toString()}
              onValueChange={(val: string) => {
                const newWidth = Number(val);
                setWidth(newWidth);
              }}
            >
              <CustomSelectTrigger className="w-full bg-neutral-700 hover:bg-neutral-600 cursor-pointer">
                <CustomSelectValue placeholder="너비" />
              </CustomSelectTrigger>
              <CustomSelectContent className="bg-neutral-700">
                <CustomSelectItem value="512" className="hover:bg-neutral-600 cursor-pointer">512px</CustomSelectItem>
                <CustomSelectItem value="768" className="hover:bg-neutral-600 cursor-pointer">768px</CustomSelectItem>
                <CustomSelectItem value="1024" className="hover:bg-neutral-600 cursor-pointer">1024px</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
          
          <div className="space-y-2">
            <CustomSelect
              value={height.toString()}
              onValueChange={(val: string) => {
                const newHeight = Number(val);
                setHeight(newHeight);
              }}
            >
              <CustomSelectTrigger className="w-full bg-neutral-700 hover:bg-neutral-600 cursor-pointer">
                <CustomSelectValue placeholder="높이" />
              </CustomSelectTrigger>
              <CustomSelectContent className="bg-neutral-700">
                <CustomSelectItem value="512" className="hover:bg-neutral-600 cursor-pointer">512px</CustomSelectItem>
                <CustomSelectItem value="768" className="hover:bg-neutral-600 cursor-pointer">768px</CustomSelectItem>
                <CustomSelectItem value="1024" className="hover:bg-neutral-600 cursor-pointer">1024px</CustomSelectItem>
              </CustomSelectContent>
            </CustomSelect>
          </div>
        </div>
      </div>
    );
  }, [height, model, modelId, width]);
  
  // 설정 UI 렌더링 함수
  const renderSettingField = useCallback((key: string, config: any) => {
    // 키에서 접두사 제거
    const originalKey = key.replace('model-config-', '');
    
    // 샘플러 필드는 건너뛰기 (중복 제거)
    if (originalKey === 'sampler') {
      return null;
    }
    
    const value = originalKey === 'steps' 
      ? steps 
      : originalKey === 'cfgScale' 
        ? cfgScale 
        : originalKey === 'sampler' 
          ? sampler 
          : modelSpecificSettings[originalKey];
    
    // 값이 정의되지 않은 경우 기본값 사용  
    const effectiveValue = value !== undefined ? value : config.default;
          
    const SettingLabel = () => (
      <label className="flex justify-between items-center text-sm mb-1">
        <div className="flex items-center gap-1">
          <span>{config.name}</span>
          <CustomTooltip title={config.name} description={config.description}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </CustomTooltip>
        </div>
        {config.type === 'number' && <span className="text-orange-500">{effectiveValue}</span>}
      </label>
    );

    switch (config.type) {
      case 'number':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <input
              type="range"
              min={config.min}
              max={config.max}
              step={config.step || 1}
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, parseFloat(e.target.value))}
              className="w-full accent-orange-500"
            />
          </div>
        );
      
      case 'select':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <select
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
              {config.options.map((option: any) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        );
      
      case 'boolean':
        return (
          <div key={key} className="mb-3 flex items-center justify-between">
            <SettingLabel />
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={effectiveValue}
                onChange={(e) => handleSettingChange(key, e.target.checked)}
              />
              <div className="w-11 h-6 bg-neutral-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
            </label>
          </div>
        );
      
      case 'text':
        return (
          <div key={key} className="mb-3">
            <SettingLabel />
            <input
              type="text"
              value={effectiveValue}
              onChange={(e) => handleSettingChange(key, e.target.value)}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            />
          </div>
        );
      
      default:
        return null;
    }
  }, [cfgScale, handleSettingChange, modelSpecificSettings, sampler, steps]);

  // 이미지 생성 요청 제출 핸들러
  const handleFormSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    // 기본 유효성 검사
    if (!textPrompt.trim()) {
      onError('텍스트 프롬프트를 입력해주세요');
      return;
    }
    
    // 토큰 수 검증
    if (promptTokenCount > 1500) {
      onError(`텍스트 프롬프트 토큰 수가 너무 많습니다 (${promptTokenCount}/1500)`);
      return;
    }
    
    if (negativeTokenCount > 500) {
      onError(`네거티브 프롬프트 토큰 수가 너무 많습니다 (${negativeTokenCount}/500)`);
      return;
    }
    
    handleImageGeneration();
  }, [handleImageGeneration, negativeTokenCount, onError, promptTokenCount, textPrompt]);

  // 이미지 생성 버튼 렌더링: Cloudflare 상태에 따른 UI 개선
  const renderButton = () => {
    let buttonText = "이미지 생성";
    let statusMessage = null;
    
    if (isGenerating) {
      if (loadingState === 'generating') {
        buttonText = '이미지 생성 중...';
      } else if (uploadStatus === 'pending') {
        buttonText = 'Cloudflare 업로드 진행 중...';
      } else if (loadingState === 'finalizing') {
        buttonText = '이미지 처리 중...';
      } else {
        buttonText = '처리 중...';
      }
      
      if (retryCount > 0) {
        buttonText += ` (재시도: ${retryCount}/${MAX_UPLOAD_RETRIES})`;
      }
    }
    
    return (
      <div className="w-full pt-8">
        <button
          type="submit"
          disabled={
            isGenerating || 
            !textPrompt.trim() || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500
          }
          className="w-full px-8 py-4 bg-gradient-to-r from-orange-400 to-amber-400 hover:from-orange-500 hover:to-amber-500 rounded-lg disabled:opacity-80 disabled:bg-gradient-to-r disabled:from-orange-300 disabled:to-amber-300 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg text-white cursor-pointer relative"
        >
          {isGenerating && (
            <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin mr-2"></div>
          )}
          {buttonText}

          <div className="absolute right-3 flex items-center gap-1 text-sm">
            <TokenCostInfo />
          </div>
        </button>
        
        {/* Cloudflare 업로드 상태 메시지 */}
        {statusMessage}
      </div>
    );
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">

      {/* 모델 선택기 */}
      <ModelSelector 
        selectedModel={modelId || model}
        onModelChange={handleModelChange}
      />
      
      {/* 이미지 크기 설정 */}
      {SizeSettings}

      {/* 프롬프트 입력 영역 - 커스텀 컴포넌트 사용 */}
      <PromptTextarea 
        prompt={textPrompt}
        negativePrompt={negativePrompt}
        onPromptChange={(value) => {
          setTextPrompt(value);
          setPromptTokenCount(tokenCounter(value));
        }}
        onNegativePromptChange={(value) => {
          setNegativePrompt(value);
          setNegativeTokenCount(tokenCounter(value));
        }}
        promptTokenLimit={1500}
        negativeTokenLimit={500}
      />

      {/* 이미지 설정 */}
      <CollapsiblePanel title="이미지 설정" defaultOpen={false}>
        <div className="space-y-3">
          {/* 모델별 설정 렌더링 */}
          {selectedModel.configOptions && 
            Object.entries(selectedModel.configOptions).map(([key, config]) => 
              renderSettingField(`model-config-${key}`, config)
            )
          }
          
          {/* 샘플러 설정 */}
          <div className="mb-3">
            <label className="flex items-center gap-1 text-sm mb-1">
              <span>샘플러 방식</span>
              <CustomTooltip 
                title="샘플러" 
                description="다양한 샘플링 방식은 이미지 생성 속도와 품질에 영향을 줍니다."
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </CustomTooltip>
            </label>
            <select
              value={sampler}
              onChange={(e) => {
                setSampler(e.target.value);
              }}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
              {availableSamplers.map((samplerOption) => (
                <option key={samplerOption.value} value={samplerOption.value}>
                  {samplerOption.label}
                </option>
              ))}
            </select>
          </div>
          
          {/* VAE 설정 - 지원하는 모델에만 표시 */}
          {selectedModel.vae && (
          <div>
              <label className="flex items-center gap-1 text-sm mb-1">
                <span>VAE 설정</span>
                <CustomTooltip 
                  title="VAE" 
                  description="이미지의 색상과 대비에 영향을 줍니다."
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </CustomTooltip>
            </label>
            <select
              value={selectedVae}
              onChange={(e) => {
                setSelectedVae(e.target.value);
              }}
              className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
            >
                {VAE_OPTIONS.map((vae) => (
                <option key={`vae-${vae.id}`} value={vae.id} title={vae.description}>
                  {vae.name}
                </option>
              ))}
            </select>
          </div>
          )}
        </div>
      </CollapsiblePanel>
      
      {/* 생성 버튼 - 개선된 UI로 교체 */}
      {renderButton()}
    </form>
  );
} 