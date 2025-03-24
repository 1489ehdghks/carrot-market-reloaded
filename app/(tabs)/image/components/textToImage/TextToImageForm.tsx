"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateImageWithText, generateImageWithImage } from "../../actions";
import ModelSelector from "../shared/ModelSelector";
import { AI_MODELS, getDefaultModel, getModelById } from "../../data/models";
import { SAMPLER_OPTIONS, getDefaultSampler } from "../../data/samplers";
import { VAE_OPTIONS, getDefaultVae } from "../../data/vae";
import { CollapsiblePanel } from "../shared/CollapsiblePanel";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { Switch } from "@/components/ui/form/switch";
import ImageUploader from "../shared/ImageUploader";
import { useNotification } from "@/components/ui/feedback/notification";
import { calculateImageCost } from '../../data/tokenUtils';
import { encode } from 'gpt-tokenizer';
import { filterSpecialModelsByCategory, getSpecialModelById } from '../../data/specialModels';
import { InfoIcon } from "lucide-react";
import PromptTextarea from "../shared/PromptTextarea";
import { 
  validateImageGeneration, 
  handleImageGenerationError, 
  processApiError, 
  detectErrorType 
} from '@/app/lib/image-generation-errors';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/form/select";

interface TextToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
  modelId?: string;
  onModelChange?: (modelId: string) => void;
  onUrlUpdate?: (imageId: string, permanentUrl: string) => void;
}

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
  const [textPrompt, setTextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [size, setSize] = useState("");
  const [model, setModel] = useState("stable-diffusion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState(28);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState(getDefaultSampler());
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [selectedVae, setSelectedVae] = useState(getDefaultVae());
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'uploading' | 'saving'>('idle');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [useFaceSwap, setUseFaceSwap] = useState<boolean>(false);
  const [faceSwapStrength, setFaceSwapStrength] = useState<number>(0.8);
  const [isProcessingFaceSwap, setIsProcessingFaceSwap] = useState<boolean>(false);
  const [faceSwapModelId, setFaceSwapModelId] = useState<string>("face-swap");
  const [faceSwapOptions, setFaceSwapOptions] = useState<Record<string, any>>({});
  
  // Face Swap 모델 목록 메모이제이션
  const faceSwapModels = useMemo(() => {
    return filterSpecialModelsByCategory('faceswap');
  }, []);
  
  // 토큰 수 계산 함수
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    // gpt-tokenizer를 사용해 정확한 토큰 수 계산
    return encode(text).length;
  };

  // 선택된 모델 정보 가져오기
  const selectedModel = useMemo(
    () => getModelById(modelId || model) || getModelById(getDefaultModel().id) || AI_MODELS[0],
    [model, modelId]
  );
  
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

  // 설정 값 관리를 위한 state
  const [modelSpecificSettings, setModelSpecificSettings] = useState<Record<string, any>>({});
  
  // 로컬 스토리지에서 이전 입력 데이터 복원
  useEffect(() => {
    try {
      // 로컬 스토리지에서 이전 설정 데이터 복원
      const savedPrompt = localStorage.getItem('textPrompt');
      const savedNegativePrompt = localStorage.getItem('negativePrompt');
      const savedModel = localStorage.getItem('model');
      const savedSize = localStorage.getItem('size');
      const savedSteps = localStorage.getItem('steps');
      const savedCfgScale = localStorage.getItem('cfgScale');
      const savedSampler = localStorage.getItem('sampler');
      const savedVae = localStorage.getItem('vae');
      
      // 프롬프트 복원
      if (savedPrompt) {
        setTextPrompt(savedPrompt);
        setPromptTokenCount(calculateTokens(savedPrompt));
      }
      
      if (savedNegativePrompt) {
        setNegativePrompt(savedNegativePrompt);
        setNegativeTokenCount(calculateTokens(savedNegativePrompt));
      }
      
      // 모델 복원 (외부에서 전달된 modelId가 없을 경우에만)
      const defaultModel = getDefaultModel().id;
      if (!modelId) {
        const modelToUse = savedModel || defaultModel;
        setModel(modelToUse);
        
        // 부모 컴포넌트에 알림
        if (onModelChange) {
          onModelChange(modelToUse);
        }
      }
      
      // 이미지 크기 복원
      if (savedSize) {
        setSize(savedSize);
      } else {
        // 기본 크기 설정
        setSize('768x768');
        localStorage.setItem('size', '768x768');
      }
      
      // 스텝 복원
      if (savedSteps) {
        const stepsValue = Number(savedSteps);
        if (!isNaN(stepsValue)) {
          setSteps(stepsValue);
        } else {
          setSteps(28);
          localStorage.setItem('steps', '28');
        }
      } else {
        setSteps(28);
        localStorage.setItem('steps', '28');
      }
      
      // CFG 스케일 복원
      if (savedCfgScale) {
        const cfgValue = Number(savedCfgScale);
        if (!isNaN(cfgValue)) {
          setCfgScale(cfgValue);
        } else {
          setCfgScale(7);
          localStorage.setItem('cfgScale', '7');
        }
      } else {
        setCfgScale(7);
        localStorage.setItem('cfgScale', '7');
      }
      
      // 샘플러 복원
      if (savedSampler) {
        setSampler(savedSampler);
      } else {
        const defaultSampler = getDefaultSampler();
        setSampler(defaultSampler);
        localStorage.setItem('sampler', defaultSampler);
      }
      
      // VAE 복원
      if (savedVae) {
        setSelectedVae(savedVae);
      } else {
        const defaultVae = getDefaultVae();
        setSelectedVae(defaultVae);
        localStorage.setItem('vae', defaultVae);
      }
      
      // 모델별 설정 복원
      const savedModelSettings = localStorage.getItem('modelSpecificSettings');
      if (savedModelSettings) {
        try {
          const parsedSettings = JSON.parse(savedModelSettings);
          const modelToUse = modelId || savedModel || defaultModel;
          if (parsedSettings[modelToUse]) {
            setModelSpecificSettings(parsedSettings[modelToUse]);
          }
        } catch (error) {
          console.error('모델별 설정 복원 실패:', error);
        }
      }
    } catch (error) {
      console.error('로컬 스토리지에서 설정 복원 중 오류 발생:', error);
      // 오류 발생 시 기본값으로 설정
      setModel(getDefaultModel().id);
      setSize('768x768');
      setSteps(28);
      setCfgScale(7);
      setSampler(getDefaultSampler());
      setSelectedVae(getDefaultVae());
    }
  }, [modelId, onModelChange, calculateTokens]);
  

  // 모델별 설정 변경 핸들러
  const handleSettingChange = (key: string, value: any) => {
    // 키에서 접두사 제거
    const originalKey = key.replace('model-config-', '');
    
    console.log(`설정 변경: ${originalKey} = ${value}`);
    
    if (originalKey === 'steps') {
      setSteps(Number(value));
      // 로컬 스토리지에 저장
      localStorage.setItem('steps', value.toString());
    } else if (originalKey === 'cfgScale') {
      setCfgScale(Number(value));
      // 로컬 스토리지에 저장
      localStorage.setItem('cfgScale', value.toString());
    } else if (originalKey === 'sampler') {
      setSampler(value);
      // 로컬 스토리지에 저장
      localStorage.setItem('sampler', value);
    } else {
      setModelSpecificSettings(prev => ({
        ...prev,
        [originalKey]: value
      }));
      
      // 모델별 설정도 로컬 스토리지에 저장
      const savedSettings = JSON.parse(localStorage.getItem('modelSpecificSettings') || '{}');
      savedSettings[model] = savedSettings[model] || {};
      savedSettings[model][originalKey] = value;
      localStorage.setItem('modelSpecificSettings', JSON.stringify(savedSettings));
    }
  };

  // 응답에서 이미지 URL 추출 함수
  const extractImageUrl = (response: any): string | null => {
    console.log("API 응답 분석:", JSON.stringify(response, null, 2));
    
    // 새로운 API 응답 형식
    if (response && response.success && response.image && response.image.url) {
      console.log("이미지 URL 추출 성공 (표준 형식):", response.image.url);
      return response.image.url;
    }
    
    // 확장된 응답 검사
    if (response && response.success === false && response.image && response.image.url) {
      console.log("이미지 URL 추출 성공 (경고 형식):", response.image.url);
      return response.image.url;
    }
    
    // 중첩된 이미지 객체 검사
    if (response && response.image && typeof response.image === 'object') {
      const imgObj = response.image;
      
      // url, fileUrl, cloudflareUrl 등 다양한 필드명 검사
      const possibleUrlFields = ['url', 'fileUrl', 'cloudflareUrl', 'imageUrl', 'path', 'src'];
      for (const field of possibleUrlFields) {
        if (imgObj[field] && typeof imgObj[field] === 'string') {
          console.log(`이미지 URL 추출 성공 (${field} 필드):`, imgObj[field]);
          return imgObj[field];
        }
      }
    }
    
    // 직접 URL 필드 검사
    const directUrlFields = ['url', 'fileUrl', 'cloudflareUrl', 'imageUrl', 'path', 'src'];
    for (const field of directUrlFields) {
      if (response && response[field] && typeof response[field] === 'string') {
        console.log(`이미지 URL 추출 성공 (직접 ${field} 필드):`, response[field]);
        return response[field];
      }
    }
    
    // 응답이 직접 문자열 URL일 경우 (드문 경우)
    if (typeof response === 'string' && (response.startsWith('http://') || response.startsWith('https://'))) {
      console.log("이미지 URL 추출 성공 (직접 URL 문자열):", response);
      return response;
    }
    
    console.error("응답에서 이미지 URL을 찾을 수 없습니다:", response);
    return null;
  };

  // 모델 변경 핸들러
  const handleModelChange = (newModelId: string) => {
    setModel(newModelId);
    
    // 외부에서 제공된 콜백 실행
    if (onModelChange) {
      onModelChange(newModelId);
    }
    
    // 모델 ID 저장
    localStorage.setItem('model', newModelId);
    
    // 새 모델 정보 가져오기
    const newModelInfo = getModelById(newModelId);
    
    // 이 모델에 대해 저장된 설정이 있는지 확인
    try {
      const savedModelSettings = localStorage.getItem('modelSpecificSettings');
      if (savedModelSettings) {
        const parsedSettings = JSON.parse(savedModelSettings);
        if (parsedSettings[newModelId]) {
          // 저장된 모델 특정 설정이 있으면 로드
          setModelSpecificSettings(parsedSettings[newModelId]);
          
          // 기본 설정 중 모델별로 저장된 설정이 있으면 해당 값 사용
          const modelSettings = parsedSettings[newModelId];
          if (modelSettings.steps !== undefined) {
            setSteps(Number(modelSettings.steps));
          } else if (newModelInfo?.configOptions?.steps) {
            setSteps(newModelInfo.configOptions.steps.default);
          }
          
          if (modelSettings.cfgScale !== undefined) {
            setCfgScale(Number(modelSettings.cfgScale));
          } else if (newModelInfo?.configOptions?.cfgScale) {
            setCfgScale(newModelInfo.configOptions.cfgScale.default);
          }
          
          if (modelSettings.sampler !== undefined) {
            setSampler(modelSettings.sampler);
          } else if (newModelInfo?.configOptions?.sampler) {
            setSampler(newModelInfo.configOptions.sampler.default);
          }
          
          return; // 저장된 설정을 로드했으므로 여기서 종료
        }
      }
    } catch (error) {
      console.error('모델별 설정 로드 중 오류:', error);
    }
    
    // 저장된 모델 설정이 없거나 오류가 발생한 경우 기본값으로 설정
    if (newModelInfo?.configOptions) {
      if (newModelInfo.configOptions.steps) {
        setSteps(newModelInfo.configOptions.steps.default);
        localStorage.setItem('steps', newModelInfo.configOptions.steps.default.toString());
      }
      
      if (newModelInfo.configOptions.cfgScale) {
        setCfgScale(newModelInfo.configOptions.cfgScale.default);
        localStorage.setItem('cfgScale', newModelInfo.configOptions.cfgScale.default.toString());
      }
      
      if (newModelInfo.configOptions.sampler) {
        setSampler(newModelInfo.configOptions.sampler.default);
        localStorage.setItem('sampler', newModelInfo.configOptions.sampler.default);
      }
    }
  };

  // 모델 변경 시 설정 재설정
  const handleResetSettings = (newModelId?: string) => {
    const modelToUse = newModelId || model;
    const newModel = getModelById(modelToUse);
    
    if (newModel?.configOptions) {
      // 모델별 설정 옵션의 기본값으로 초기화
      const newSettings: Record<string, any> = {};
      
      // 기본 설정 업데이트
      if (newModel.configOptions.steps) {
        setSteps(newModel.configOptions.steps.default);
      }
      
      if (newModel.configOptions.cfgScale) {
        setCfgScale(newModel.configOptions.cfgScale.default);
      }
      
      if (newModel.configOptions.sampler) {
        setSampler(newModel.configOptions.sampler.default);
      }
      
      // 로컬 스토리지 저장
      localStorage.setItem('model', modelToUse);
      localStorage.setItem('steps', newModel.configOptions.steps?.default.toString() || '25');
      localStorage.setItem('cfgScale', newModel.configOptions.cfgScale?.default.toString() || '7');
      localStorage.setItem('sampler', newModel.configOptions.sampler?.default || 'DPM++ 2M SDE');
      
      // 기타 설정 업데이트
      Object.entries(newModel.configOptions).forEach(([key, config]) => {
        if (!['steps', 'cfgScale', 'sampler'].includes(key)) {
          newSettings[key] = config.default;
        }
      });
      
      setModelSpecificSettings(newSettings);
    }
  };

  
  // 얼굴 이미지 업로드 핸들러
  const handleFaceImageUploaded = (file: File, previewUrl: string) => {
    setFaceImage(file);
    setFaceImagePreview(previewUrl);
    
    // 이미지가 업로드되면 자동으로 Face Swap 활성화
    setUseFaceSwap(true);
  };
  
  // 얼굴 이미지 제거 핸들러
  const clearFaceImage = () => {
    if (faceImagePreview) {
      URL.revokeObjectURL(faceImagePreview);
    }
    setFaceImage(null);
    setFaceImagePreview(null);
    setUseFaceSwap(false);
  };
  
  // 이미지 최적화 유틸리티 함수
  const compressImage = async (file: File, quality = 0.8, maxDimension = 1200): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        // 이미지 크기 계산
        let width = img.width;
        let height = img.height;
        
        if (width > height && width > maxDimension) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
        
        // Canvas 생성 및 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        
        if (!ctx) {
          reject(new Error('Canvas 컨텍스트 생성 실패'));
          return;
        }
        
        ctx.drawImage(img, 0, 0, width, height);
        
        // Blob 생성
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('이미지 압축 실패'));
            return;
          }
          
          // File 객체 생성
          const compressedFile = new File([blob], file.name, {
            type: 'image/jpeg',
            lastModified: Date.now()
          });
          
          resolve(compressedFile);
        }, 'image/jpeg', quality);
      };
      
      img.onerror = () => reject(new Error('이미지 로드 실패'));
      
      // FileReader로 이미지 데이터 로드
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target?.result) {
          img.src = e.target.result as string;
        } else {
          reject(new Error('파일 읽기 실패'));
        }
      };
      reader.onerror = () => reject(new Error('파일 읽기 실패'));
      reader.readAsDataURL(file);
    });
  };

  // 얼굴 이미지 Cloudflare 업로드 함수
  const uploadFaceImage = async (file: File): Promise<string> => {
    try {
      // 이미지 사이즈 최적화 (대용량 이미지 처리)
      let optimizedFile = file;
      
      // 5MB 이상인 경우 압축 처리
      if (file.size > 5 * 1024 * 1024) {
        optimizedFile = await compressImage(file, 0.8, 1200);
        console.log('이미지 최적화 완료:', {
          원본크기: Math.round(file.size / 1024) + 'KB',
          압축크기: Math.round(optimizedFile.size / 1024) + 'KB',
          압축률: Math.round((optimizedFile.size / file.size) * 100) + '%'
        });
      }
      
      // 파일을 Data URL로 변환
      const fileReader = new FileReader();
      const dataUrl = await new Promise<string>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as string);
        fileReader.onerror = reject;
        fileReader.readAsDataURL(optimizedFile);
      });
      
      // 임시 이미지 URL 생성 (데이터 URL)
      return dataUrl;
    } catch (error) {
      console.error('얼굴 이미지 처리 오류:', error);
      throw new Error('얼굴 이미지 처리 중 오류가 발생했습니다');
    }
  };
  
  // Face Swap 적용 함수
  const applyFaceSwap = async (
    targetImageUrl: string, 
    sourceImageUrl: string, 
    modelId: string = "face-swap",
    options: Record<string, any> = {}
  ): Promise<string> => {
    try {
      setIsProcessingFaceSwap(true);
      
      console.log("Face Swap API 호출:", {
        model_id: modelId,
        target_image: targetImageUrl.substring(0, 50) + "...",
        source_image: sourceImageUrl.substring(0, 50) + "..."
      });
      
      // 기본 요청 본문
      const requestBody: Record<string, any> = {
        model_id: modelId,
        target_image: targetImageUrl,
        source_image: sourceImageUrl,
        strength: options.strength ?? faceSwapStrength,
      };
      
      // 추가 옵션이 있으면 요청 본문에 병합
      if (Object.keys(options).length > 0) {
        // 강도(strength)는 이미 처리했으므로 제외하고 나머지 옵션 추가
        Object.entries(options).forEach(([key, value]) => {
          if (key !== 'strength') {
            requestBody[key] = value;
          }
        });
      }
      
      const response = await fetch("/api/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Face Swap API 응답 오류:", errorData);
        throw new Error(errorData?.error || `Face Swap 처리 중 오류가 발생했습니다 (${response.status})`);
      }
      
      const result = await response.json();
      console.log("Face Swap 결과:", result);
      return result.imageUrl;
    } finally {
      setIsProcessingFaceSwap(false);
    }
  };
  
  // 입력 유효성 검사 함수를 새로운 유틸리티 사용하도록 수정
  const validateInputs = (): boolean => {
    return validateImageGeneration(
      textPrompt, 
      modelId || model, 
      size, 
      useFaceSwap, 
      useFaceSwap ? faceImage : null
    );
  };

  // 일반 모드 이미지 생성 핸들러
  const handleNormalGeneration = async () => {
    try {
      // 기본 이미지 생성 시작 함수
      setIsGenerating(true);
      setLoadingState('generating');
      onGenerationStart();
      
      // 선택한 모델 정보 불러오기 - 모델ID가 props로부터 오거나 state에서 옴
      const actualModelId = modelId || model;
      const selectedModel = getModelById(actualModelId);
      
      if (!selectedModel) {
        handleImageGenerationError('model_missing', null, `모델을 찾을 수 없습니다: ${actualModelId}`);
        return;
      }
      
      // API 요청 데이터 준비
      const sizeArray = size.split('x');
      if (sizeArray.length !== 2) {
        handleImageGenerationError('invalid_parameter', null, `잘못된 크기 형식: ${size}`);
        return;
      }
      
      const width = parseInt(sizeArray[0], 10);
      const height = parseInt(sizeArray[1], 10);
      
      if (isNaN(width) || isNaN(height)) {
        handleImageGenerationError('invalid_parameter', null, `잘못된 크기 값: ${size}`);
        return;
      }
      
      // 추가 설정 매개변수 구성
      const modelConfig: Record<string, any> = {
        steps: steps,
        cfgScale: cfgScale,
        sampler: sampler,
      };
      
      // 모델별 설정 추가
      if (selectedModel.configOptions) {
        Object.entries(selectedModel.configOptions).forEach(([key, config]) => {
          if (!['steps', 'cfgScale', 'sampler'].includes(key)) {
            if (modelSpecificSettings[key] !== undefined) {
              modelConfig[key] = modelSpecificSettings[key];
            } else if (config.default !== undefined) {
              modelConfig[key] = config.default;
            }
          }
        });
      }
      
      // VAE 설정 추가
      if (selectedVae && selectedVae !== 'default') {
        modelConfig.vae = selectedVae;
      }
      
      // 사용자에게 생성 시작 알림
      showNotification({
        title: '이미지 생성 시작',
        message: `${width}x${height} 크기의 이미지를 생성하고 있습니다. 모델: ${selectedModel.name}`,
      });
      
      console.log('이미지 생성 요청:', {
        prompt: textPrompt,
        negativePrompt,
        size: `${width}x${height}`,
        model: actualModelId,
        modelConfig
      });

      // 서버 API 호출
      const response = await generateImageWithText({
        prompt: textPrompt, 
        negativePrompt, 
        width, 
        height, 
        modelId: actualModelId,
        ...modelConfig
      });
      
      // 응답 로깅
      console.log('API 응답:', response);
      
      if (!response || !response.success) {
        // 향상된 에러 처리
        const errorMessage = response?.error || '이미지 생성에 실패했습니다.';
        const errorType = detectErrorType(errorMessage);
        handleImageGenerationError(errorType, new Error(errorMessage));
        return;
      }
      
      // 이미지 URL 추출
      const imageUrl = extractImageUrl(response);
      if (!imageUrl) {
        handleImageGenerationError('api_error', null, '응답에서 이미지 URL을 찾을 수 없습니다.');
        return;
      }
      
      // 생성된 이미지 ID 추출 (response 타입에 맞춰 안전하게 처리)
      const imageId = (response as any).id || `img-${Date.now()}`;
      
      // 생성에 성공한 후에도 현재 선택된 모델과 설정 유지
      // localStorage에 현재 상태 저장
      localStorage.setItem('model', actualModelId);
      // 모델 상태도 업데이트하여 UI에 반영
      setModel(actualModelId);
      localStorage.setItem('size', size);
      localStorage.setItem('steps', steps.toString());
      localStorage.setItem('cfgScale', cfgScale.toString());
      localStorage.setItem('sampler', sampler);
      
      // 모델별 설정도 로컬 스토리지에 저장
      const savedSettings = JSON.parse(localStorage.getItem('modelSpecificSettings') || '{}');
      savedSettings[actualModelId] = { ...modelSpecificSettings };
      localStorage.setItem('modelSpecificSettings', JSON.stringify(savedSettings));
      
      // 부모 컴포넌트에 생성 완료 신호 보내기
      onGenerationComplete(imageUrl, imageId);
      
      // 알림
      showNotification({
        title: '이미지 생성 완료',
        message: '이미지가 성공적으로 생성되었습니다.',
      });
    } catch (error) {
      console.error('이미지 생성 오류:', error);
      // 향상된 에러 처리 사용
      processApiError(error, '이미지 생성 중 오류가 발생했습니다.');
      onError((error as Error).message);
    } finally {
      setIsGenerating(false);
      setLoadingState('idle');
    }
  };

  // Face Swap을 적용한 이미지 생성 처리 - 유사한 방식으로 수정
  const handleGenerationWithFaceSwap = async () => {
    try {
      // Face Swap을 위한 검증
      if (!faceImage || !faceImagePreview) {
        handleImageGenerationError('face_image_missing');
        return;
      }
      
      if (!textPrompt) {
        handleImageGenerationError('prompt_missing');
        return;
      }
      
      // 상태 업데이트
      setIsGenerating(true);
      setIsProcessingFaceSwap(false);
      setLoadingState('generating');
      onGenerationStart();
      
      // 선택한 모델 정보 불러오기 - 모델ID가 props로부터 오거나 state에서 옴
      const actualModelId = modelId || model;
      const selectedModel = getModelById(actualModelId);
      
      if (!selectedModel) {
        handleImageGenerationError('model_missing', null, `모델을 찾을 수 없습니다: ${actualModelId}`);
        return;
      }
      
      // API 요청 데이터 준비
      const sizeArray = size.split('x');
      if (sizeArray.length !== 2) {
        handleImageGenerationError('invalid_parameter', null, `잘못된 크기 형식: ${size}`);
        return;
      }
      
      const width = parseInt(sizeArray[0], 10);
      const height = parseInt(sizeArray[1], 10);
      
      if (isNaN(width) || isNaN(height)) {
        handleImageGenerationError('invalid_parameter', null, `잘못된 크기 값: ${size}`);
        return;
      }
      
      // 추가 설정 매개변수 구성
      const modelConfig: Record<string, any> = {
        steps: steps,
        cfgScale: cfgScale,
        sampler: sampler,
      };
      
      // 모델별 설정 추가
      if (selectedModel.configOptions) {
        Object.entries(selectedModel.configOptions).forEach(([key, config]) => {
          if (!['steps', 'cfgScale', 'sampler'].includes(key)) {
            if (modelSpecificSettings[key] !== undefined) {
              modelConfig[key] = modelSpecificSettings[key];
            } else if (config.default !== undefined) {
              modelConfig[key] = config.default;
            }
          }
        });
      }
      
      // VAE 설정 추가
      if (selectedVae && selectedVae !== 'default') {
        modelConfig.vae = selectedVae;
      }
      
      // 사용자에게 알림
      showNotification({
        title: '이미지 생성 중',
        message: '얼굴 참조 이미지를 적용한 이미지를 생성합니다',
      });
      
      // 1. 기본 이미지 생성
      console.log('기본 이미지 생성 요청:', {
        prompt: textPrompt,
        negativePrompt,
        size: `${width}x${height}`,
        model: actualModelId,
        modelConfig
      });
      
      const response = await generateImageWithText({
        prompt: textPrompt,
        negativePrompt,
        width,
        height,
        modelId: actualModelId,
        ...modelConfig
      });
      
      // 응답 로깅
      console.log('기본 이미지 생성 응답:', response);
      
      if (!response || !response.success) {
        // 향상된 에러 처리
        const errorMessage = response?.error || '이미지 생성에 실패했습니다';
        const errorType = detectErrorType(errorMessage);
        handleImageGenerationError(errorType, new Error(errorMessage));
        return;
      }
      
      // 이미지 URL 추출
      const baseImageUrl = extractImageUrl(response);
      if (!baseImageUrl) {
        handleImageGenerationError('api_error', null, '응답에서 이미지 URL을 찾을 수 없습니다');
        return;
      }
      
      // 임시 이미지 URL 업데이트 (생성 단계 표시용)
      setTempImageUrl(baseImageUrl);
      
      // 2. Face Swap 처리 시작
      console.log('Face Swap 처리 시작');
      setIsProcessingFaceSwap(true);
      
      // 얼굴 이미지 데이터 URL 생성
      const faceDataUrl = await uploadFaceImage(faceImage);
      
      // Face Swap 적용
      console.log('Face Swap 요청:', {
        targetImageUrl: baseImageUrl,
        sourceImageUrl: faceDataUrl.substring(0, 30) + '...',
        modelId: faceSwapModelId,
        options: {
          strength: faceSwapStrength,
          ...faceSwapOptions
        }
      });
      
      // Face Swap API 호출
      const faceSwappedImageUrl = await applyFaceSwap(
        baseImageUrl, 
        faceDataUrl,
        faceSwapModelId,
        {
          strength: faceSwapStrength,
          ...faceSwapOptions
        }
      );
      
      if (!faceSwappedImageUrl) {
        handleImageGenerationError('api_error', null, 'Face Swap 처리 중 오류가 발생했습니다');
        return;
      }
      
      // 생성된 이미지 ID 생성
      const imageId = `faceswap-${Date.now()}`;
      
      // 생성에 성공한 후에도 현재 선택된 모델과 설정 유지
      // localStorage에 현재 상태 저장
      localStorage.setItem('model', actualModelId);
      localStorage.setItem('size', size);
      localStorage.setItem('steps', steps.toString());
      localStorage.setItem('cfgScale', cfgScale.toString());
      localStorage.setItem('sampler', sampler);
      
      // Face Swap 설정도 로컬 스토리지에 저장
      localStorage.setItem('faceSwapModelId', faceSwapModelId);
      localStorage.setItem('faceSwapStrength', faceSwapStrength.toString());
      localStorage.setItem('faceSwapOptions', JSON.stringify(faceSwapOptions));
      
      // 모델별 설정도 로컬 스토리지에 저장
      const savedSettings = JSON.parse(localStorage.getItem('modelSpecificSettings') || '{}');
      savedSettings[actualModelId] = { ...modelSpecificSettings };
      localStorage.setItem('modelSpecificSettings', JSON.stringify(savedSettings));
      
      // 최종 이미지 URL 반환
      console.log('Face Swap 처리 완료:', faceSwappedImageUrl.substring(0, 30) + '...');
      
      // 부모 컴포넌트에 완료 신호 보내기
      onGenerationComplete(faceSwappedImageUrl, imageId);
      
      // 완료 알림
      showNotification({
        title: 'Face Swap 완료',
        message: '얼굴 적용 이미지 생성이 완료되었습니다',
      });
      
    } catch (error) {
      console.error('Face Swap 이미지 생성 오류:', error);
      // 향상된 에러 처리 사용
      processApiError(error, 'Face Swap 처리 중 오류가 발생했습니다.');
      onError((error as Error).message);
    } finally {
      setIsGenerating(false);
      setIsProcessingFaceSwap(false);
      setLoadingState('idle');
      setTempImageUrl(null);
    }
  };
  
  const sizePresets = [
    { label: "정사각형", value: "768x768" },
    { label: "와이드", value: "1024x768" },
    { label: "세로", value: "768x1024" },
  ];
  
  // 설정 UI 렌더링 함수
  const renderSettingField = (key: string, config: any) => {
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
  };

  // 이미지 생성 요청 제출 핸들러
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // 입력 유효성 검사
    if (!validateInputs()) {
      return;
    }
    
    // Face Swap이 활성화되어 있고 얼굴 이미지가 있는 경우
    if (useFaceSwap && faceImage) {
      // Face Swap 이미지 검사
      if (!faceImage || !faceImagePreview) {
        handleImageGenerationError('face_image_missing');
        return;
      }
      
      handleGenerationWithFaceSwap();
    } else {
      // 일반 이미지 생성
      handleNormalGeneration();
    }
  };

  // Token cost display 요소
  const TokenCostInfo = () => {
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
  };

  // 이미지 크기 설정 UI 렌더링 함수
  const renderSizeSettings = () => {
    // 현재 선택된 모델에 대한 권장 비율 정보
    const currModel = getModelById(modelId || model);
    
    // 현재 크기 값 파싱
    const [width, height] = size.split('x').map(Number);
    
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
            <Select
              value={width?.toString() || "768"}
              onValueChange={(val: string) => {
                const newSize = `${val}x${height || 768}`;
                setSize(newSize);
                localStorage.setItem('size', newSize);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="너비" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512">512px</SelectItem>
                <SelectItem value="768">768px</SelectItem>
                <SelectItem value="1024">1024px</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">너비</p>
          </div>
          
          <div className="space-y-2">
            <Select
              value={height?.toString() || "768"}
              onValueChange={(val: string) => {
                const newSize = `${width || 768}x${val}`;
                setSize(newSize);
                localStorage.setItem('size', newSize);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="높이" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="512">512px</SelectItem>
                <SelectItem value="768">768px</SelectItem>
                <SelectItem value="1024">1024px</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">높이</p>
          </div>
        </div>
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
      {renderSizeSettings()}

      {/* 프롬프트 입력 영역 - 커스텀 컴포넌트 사용 */}
      <PromptTextarea 
        prompt={textPrompt}
        negativePrompt={negativePrompt}
        onPromptChange={(value) => {
          setTextPrompt(value);
          setPromptTokenCount(calculateTokens(value));
          localStorage.setItem('textPrompt', value);
        }}
        onNegativePromptChange={(value) => {
          setNegativePrompt(value);
          setNegativeTokenCount(calculateTokens(value));
          localStorage.setItem('negativePrompt', value);
        }}
        promptTokenLimit={1500}
        negativeTokenLimit={500}
      />

      {/* 고급 설정 */}
      <CollapsiblePanel title="고급 설정" defaultOpen={false}>
        {/* 얼굴 참조 이미지 섹션 */}
        <div className="border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">Face swap (테스트 중)</h3>
              <CustomTooltip 
                title="fece swap" 
                description="생성된 이미지에 참조 이미지의 얼굴을 적용. 자연스럽지 않아 추천하지 않습니다."
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </CustomTooltip>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-neutral-400">Face Swap</span>
              <Switch
                checked={useFaceSwap}
                onCheckedChange={setUseFaceSwap}
                disabled={!faceImage}
              />
            </div>
          </div>
          
          {faceImagePreview ? (
            <div className="space-y-4">
              <div className="relative">
                <img 
                  src={faceImagePreview} 
                  alt="Face reference" 
                  className="w-full h-32 object-contain rounded-md" 
                />
                <button 
                  type="button"
                  onClick={clearFaceImage}
                  className="absolute top-2 right-2 bg-black/50 rounded-full p-1 hover:bg-black/70"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
              
              {useFaceSwap && (
                <div className="space-y-3">
                  {/* Face Swap 모델 선택 */}
                  <div>
                    <label className="flex items-center gap-1 text-xs mb-1">
                      <span>Face Swap 모델</span>
                      <CustomTooltip 
                        title="Face Swap 모델" 
                        description="여러 Face Swap 모델 중 선택할 수 있습니다. 각 모델은 속도와 품질이 다릅니다."
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-neutral-400" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                        </svg>
                      </CustomTooltip>
                    </label>
                    <select
                      value={faceSwapModelId}
                      onChange={(e) => setFaceSwapModelId(e.target.value)}
                      className="w-full bg-neutral-800 rounded-lg p-2 text-xs"
                      disabled={isGenerating}
                    >
                      {faceSwapModels.map((model) => (
                        <option key={model.id} value={model.id}>
                          {model.name} - {model.features.quality} 품질, {model.features.speed} 속도
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {/* 모델별 설정 옵션 렌더링 */}
                  {(() => {
                    const selectedModel = getSpecialModelById(faceSwapModelId);
                    if (!selectedModel || !selectedModel.configOptions) return null;
                    
                    return (
                      <div className="space-y-2 pt-1">
                        <div className="text-xs font-medium mb-1 text-neutral-300">모델 설정</div>
                        {Object.entries(selectedModel.configOptions).map(([key, config]) => {
                          // 강도(strength) 설정은 별도로 렌더링하므로 건너뜀
                          if (key === 'strength') return null;
                          
                          const currentValue = faceSwapOptions[key] !== undefined 
                            ? faceSwapOptions[key] 
                            : config.default;
                          
                          // 설정 타입에 따라 적절한 UI 컴포넌트 렌더링
                          switch (config.type) {
                            case 'number':
                              return (
                                <div key={key} className="mb-2">
                                  <div className="flex justify-between items-center mb-1">
                                    <label className="text-xs">{config.name}</label>
                                    <span className="text-xs text-orange-500">
                                      {typeof currentValue === 'number' ? currentValue.toFixed(2) : currentValue}
                                    </span>
                                  </div>
                                  <input
                                    type="range"
                                    min={config.min || 0}
                                    max={config.max || 1}
                                    step={config.step || 0.1}
                                    value={currentValue}
                                    onChange={(e) => {
                                      const newValue = parseFloat(e.target.value);
                                      setFaceSwapOptions(prev => ({
                                        ...prev,
                                        [key]: newValue
                                      }));
                                    }}
                                    className="w-full accent-orange-500"
                                    disabled={isGenerating}
                                  />
                                </div>
                              );
                            
                            case 'boolean':
                              return (
                                <div key={key} className="flex items-center justify-between mb-2">
                                  <label className="text-xs">{config.name}</label>
                                  <Switch 
                                    checked={!!currentValue}
                                    onCheckedChange={(checked) => {
                                      setFaceSwapOptions(prev => ({
                                        ...prev,
                                        [key]: checked
                                      }));
                                    }}
                                    disabled={isGenerating}
                                  />
                                </div>
                              );
                            
                            case 'select':
                              return (
                                <div key={key} className="mb-2">
                                  <label className="block text-xs mb-1">{config.name}</label>
                                  <select
                                    value={currentValue}
                                    onChange={(e) => {
                                      setFaceSwapOptions(prev => ({
                                        ...prev,
                                        [key]: e.target.value
                                      }));
                                    }}
                                    className="w-full bg-neutral-800 rounded-lg p-1 text-xs"
                                    disabled={isGenerating}
                                  >
                                    {config.options?.map(option => (
                                      <option key={option.value} value={option.value}>
                                        {option.label}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              );
                            
                            default:
                              return null;
                          }
                        })}
                      </div>
                    );
                  })()}
                  
                  {/* Face Swap 강도 (모든 모델에 공통) */}
                  <div>
                    <div className="flex justify-between items-center mb-1">
                      <label className="text-xs">Face Swap 강도</label>
                      <span className="text-xs text-orange-500">{faceSwapStrength.toFixed(1)}</span>
                    </div>
                    <input
                      type="range"
                      min={0.1}
                      max={1.0}
                      step={0.1}
                      value={faceSwapStrength}
                      onChange={(e) => setFaceSwapStrength(parseFloat(e.target.value))}
                      className="w-full accent-orange-500"
                      disabled={isGenerating}
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <ImageUploader
              onImageUploaded={handleFaceImageUploaded}
              isDisabled={isGenerating}
            />
          )}
        </div>
      </CollapsiblePanel>

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
              onChange={(e) => setSampler(e.target.value)}
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
              onChange={(e) => setSelectedVae(e.target.value)}
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
      
      {/* 생성 버튼 - 디자인 개선 */}
      <div className="w-full pt-8">
        <button
          type="submit"
          disabled={
            isGenerating || 
            !textPrompt.trim() || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500 ||
            isProcessingFaceSwap
          }
          className="w-full px-8 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-800 hover:to-orange-800 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg text-white relative"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin"></div>
              {loadingState === 'generating' ? '이미지 생성 중...' :
               loadingState === 'uploading' ? '이미지 처리 중...' :
               loadingState === 'saving' && useFaceSwap ? 'Face Swap 적용 중...' : 
               '처리 중...'}
            </>
          ) : (
            "이미지 생성"
          )}

          <div className="absolute right-3 flex items-center gap-1 text-sm">
            <TokenCostInfo />
          </div>
        </button>
      </div>
    </form>
  );
} 