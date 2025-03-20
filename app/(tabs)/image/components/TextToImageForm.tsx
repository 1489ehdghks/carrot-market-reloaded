"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateImageWithText, generateImageWithImage } from "../actions";
import { getImageUploadUrl, saveGeneratedImage } from "../actions";
import ModelSelector from "./ModelSelector";
import { AI_MODELS, getDefaultModel, getModelById } from "../data/models";
import { SAMPLER_OPTIONS, getDefaultSampler } from "../data/samplers";
import { VAE_OPTIONS, getDefaultVae } from "../data/vae";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "./ImageUploader";
import { useNotification } from "@/components/ui/notification";
import { handleGlobalError, UserFacingError } from "@/app/lib/error-handling";
import TokenCostDisplay from './TokenCostDisplay';
import { calculateImageCost } from '../data/tokenUtils';
import { encode } from 'gpt-tokenizer';
import { SPECIAL_MODELS, filterSpecialModelsByCategory, getSpecialModelById } from '../data/specialModels';
import { InfoIcon } from "lucide-react";
import PromptTextarea from "./PromptTextarea";

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
    // 모델 없으면 기본 모델 사용
    if (!model) {
      setModel(getDefaultModel().id);
    }
    
    // 로컬 스토리지에서 이전 입력 데이터 복원
    const savedPrompt = localStorage.getItem('textPrompt');
    const savedNegativePrompt = localStorage.getItem('negativePrompt');
    
    if (savedPrompt) {
      setTextPrompt(savedPrompt);
      setPromptTokenCount(calculateTokens(savedPrompt));
    }
    
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
      setNegativeTokenCount(calculateTokens(savedNegativePrompt));
    }
  }, []);
  

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
    
    // 새 모델에 맞는 샘플러 설정 
    if (newModelInfo?.configOptions?.sampler) {
      setSampler(newModelInfo.configOptions.sampler.default);
      localStorage.setItem('sampler', newModelInfo.configOptions.sampler.default);
      console.log(`모델 변경: ${newModelId}, 샘플러 기본값으로 설정: ${newModelInfo.configOptions.sampler.default}`);
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
  
  // 입력 유효성 검사 함수
  const validateInputs = (): boolean => {
    // 프롬프트 검사
    if (!textPrompt || textPrompt.trim() === "") {
      // 직접 알림 표시 대신 전역 에러 핸들러 사용
      handleGlobalError(new UserFacingError("이미지 생성을 위해 프롬프트를 입력해주세요."));
      return false;
    }
    
    // 모델 검사
    const currentModelId = modelId || model;
    if (!currentModelId) {
      // 직접 알림 표시 대신 전역 에러 핸들러 사용
      handleGlobalError(new UserFacingError("이미지 생성을 위해 AI 모델을 선택해주세요."));
      return false;
    }
    
    // 이미지 비율 검사
    if (!size || size === "") {
      // 직접 알림 표시 대신 전역 에러 핸들러 사용
      handleGlobalError(new UserFacingError("이미지 생성을 위해 이미지 비율을 선택해주세요."));
      return false;
    }
    
    return true;
  };

  // 일반 모드 이미지 생성 핸들러
  const handleNormalGeneration = async () => {
    try {
      // 생성 시작 상태 설정
      setIsGenerating(true);
      setLoadingState('generating');
      
      // 이미지 생성 프로세스 시작 알림
      onGenerationStart();
      
      const apiUrl = "/api/generate";

      // 중요한 검증
      if (!textPrompt) {
        const error = new UserFacingError("프롬프트를 입력해주세요");
        handleGlobalError(error);
        setIsGenerating(false);
        return;
      }

      // API 요청 준비
      const body = {
        prompt: textPrompt,
        negativePrompt,
        modelId: modelId || model,
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
        steps: Number(steps),
        cfgScale: Number(cfgScale),
        sampler: sampler,
        vae: selectedVae,
        saveMetadata: false // 메타데이터 저장 비활성화 (기본값)
      };

      // API 요청 - 폴링 없이 완료될 때까지 대기
      console.log("API 요청 시작 (이미지 생성이 완료될 때까지 대기)...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      // 응답 처리
      if (!response.ok) {
        const errorData = await response.json();
        handleGlobalError(new UserFacingError(errorData.error || "이미지 생성 중 오류가 발생했습니다"));
        throw new Error(errorData.error || "이미지 생성 중 오류가 발생했습니다");
      }

      // API 응답 처리 - 이제 완료된 이미지 데이터가 바로 반환됨
      const data = await response.json();
      console.log("이미지 생성 완료, 서버 응답:", data);
      
      if (!data.success) {
        handleGlobalError(new UserFacingError(data.error || "이미지 생성에 실패했습니다"));
        throw new Error(data.error || "이미지 생성에 실패했습니다");
      }

      // 이미지 데이터 확인
      if (!data.image || !data.image.url) {
        handleGlobalError(new UserFacingError("유효한 이미지 URL이 반환되지 않았습니다"));
        throw new Error("유효한 이미지 URL이 반환되지 않았습니다");
      }

      // 응답에서 이미지 ID와 URL 추출
      const imageId = data.image.id || `temp-${Date.now()}`;
      const imageUrl = data.image.url;
      
      // 이미지 URL 타입 검증
      if (typeof imageUrl !== 'string') {
        console.error("생성된 이미지 URL이 문자열이 아닙니다:", imageUrl);
        handleGlobalError(new UserFacingError("생성된 이미지 URL이 유효하지 않습니다"));
        throw new Error("생성된 이미지 URL이 유효하지 않습니다");
      }
      
      console.log("생성된 이미지:", { id: imageId, url: imageUrl.substring(0, 50) + "..." });

      // 성공 콜백 호출
      onGenerationComplete(imageUrl, imageId);

      // 생성 상태 초기화
      setIsGenerating(false);
      setLoadingState('idle');
      
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      
      // 전역 에러 핸들러로 에러 전달 (이중 알림 방지 체크)
      if (!(error instanceof UserFacingError)) {
        handleGlobalError(error);
      }
      
      setIsGenerating(false);
      setLoadingState('idle');
    }
  };

  // Face Swap을 적용한 이미지 생성 처리 - 유사한 방식으로 수정
  const handleGenerationWithFaceSwap = async () => {
    try {
      // 입력 유효성 검사
      if (!validateInputs()) {
        return;
      }
      
      // Face Swap 이미지 검사
      if (!faceImage || !faceImagePreview) {
        handleGlobalError(new UserFacingError("Face Swap을 위해 얼굴 참조 이미지를 업로드해주세요."));
        return;
      }

      onGenerationStart();
      setIsGenerating(true);
      setLoadingState('generating');
      
      // 현재 선택된 모델 ID 가져오기
      const currentModelId = modelId || model;
      
      // 1. 얼굴 이미지를 base64로 변환 (병렬 처리)
      const faceImagePromise = faceImage ? uploadFaceImage(faceImage) : Promise.resolve(null);
      
      // 2. 이미지 생성 요청
      const requestBody = {
        prompt: textPrompt,
        negativePrompt,
        modelId: currentModelId,
        width: parseInt(size.split('x')[0]),
        height: parseInt(size.split('x')[1]),
        steps,
        cfgScale,
        sampler,
        vae: selectedVae,
      };
      
      console.log("Face Swap 이미지 생성 요청:", requestBody);
      
      // API 호출 - 이미지 생성이 완료될 때까지 대기
      console.log("Face Swap API 요청 시작 (이미지 생성이 완료될 때까지 대기)...");
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API 오류: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("Face Swap 이미지 생성 완료:", result);
      
      // 이미지 URL 확인 및 추출
      if (!result.success || !result.image || !result.image.url) {
        throw new Error("이미지 생성에 실패했습니다. 서버 응답이 유효하지 않습니다.");
      }
      
      const imageUrl = result.image.url;
      const imageId = result.image.id || `temp-${Date.now()}`;
      
      // 이미지 URL 타입 검증
      if (typeof imageUrl !== 'string') {
        console.error("생성된 이미지 URL이 문자열이 아닙니다:", imageUrl);
        throw new Error("생성된 이미지 URL이 유효하지 않습니다.");
      }
      
      console.log("생성된 이미지:", { id: imageId, url: imageUrl.substring(0, 50) + "..." });
      
      // 3. 얼굴 이미지 base64 데이터 대기
      const faceImageData = await faceImagePromise;
      
      // 얼굴 이미지가 없다면 생성된 이미지만 반환
      if (!faceImageData) {
        onGenerationComplete(imageUrl, imageId);
        setIsGenerating(false);
        setLoadingState('idle');
        return;
      }
      
      // 4. Face Swap 적용 (base64 데이터 직접 사용)
      console.log("Face Swap 적용 시작...");
      setLoadingState('saving');
      const swappedImageUrl = await applyFaceSwap(
        imageUrl, 
        faceImageData, 
        faceSwapModelId, 
        { ...faceSwapOptions, strength: faceSwapStrength }
      );
      
      // 5. 결과 처리
      onGenerationComplete(swappedImageUrl, imageId);
      
      // 생성 상태 초기화
      setIsGenerating(false);
      setLoadingState('idle');
      
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      if (!(error instanceof UserFacingError)) {
        handleGlobalError(error instanceof Error ? error : new Error(error.message || "이미지 생성 중 오류가 발생했습니다."));
      }
      
      setIsGenerating(false);
      setLoadingState('idle');
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
        handleGlobalError(new UserFacingError("Face Swap을 위해 얼굴 참조 이미지를 업로드해주세요."));
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
    // 크기 파싱
    const [width, height] = size ? size.split('x').map(Number) : [768, 768];
    
    // 가격 계산 전 입력값 유효성 검사
    if (!size || !modelId && !model) {
      return (
        <CustomTooltip
          title="토큰 비용 정보"
          description="이미지 크기와 모델을 선택하면 토큰 비용이 표시됩니다."
          content={
            <div className="space-y-1.5 text-xs">
              <div className="text-center text-gray-300">크기와 모델을 선택해주세요</div>
            </div>
          }
        >
          <span className="flex items-center gap-1">
            <InfoIcon className="w-4 h-4 text-orange-500" />
          </span>
        </CustomTooltip>
      );
    }
    
    // 토큰 비용 계산
    const costInfo = calculateImageCost({
      modelId: modelId || model,
      width, 
      height,
      faceSwapModelId: useFaceSwap ? faceSwapModelId : undefined
    });
    
    return (
      <CustomTooltip
        title="토큰 비용 정보"
        description="이 이미지 생성에 사용되는 토큰 비용입니다."
        content={
          <div className="space-y-1.5 text-xs">
            {costInfo.breakdown.map((item: { name: string; tokens: number }, index: number) => (
              <div key={index} className="flex justify-between">
                <span className="text-gray-300">{item.name}</span>
                <span className="font-medium text-gray-200">{item.tokens.toLocaleString()} token</span>
              </div>
            ))}
            <div className="border-t border-gray-700 mt-1 pt-1 flex justify-between">
              <span className="font-medium text-white">총 비용</span>
              <span className="font-bold text-orange-500">
                {costInfo.total.toLocaleString()} token
              </span>
            </div>
          </div>
        }
      >
        <span className="flex items-center gap-1">
          <InfoIcon className="w-4 h-4 text-orange-500" />
          <span className="text-sm font-medium text-orange-500">{costInfo.total.toLocaleString()}</span>
        </span>
      </CustomTooltip>
    );
  };

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">

      {/* 모델 선택 */}
      <ModelSelector
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

    
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

{/* 이미지 비율 선택 */}
      <div className="space-y-2">
        <label className="block text-sm font-medium">이미지 비율</label>
        <div className="grid grid-cols-4 gap-2">
          {sizePresets.map((preset) => (
            <button
              key={`size-preset-${preset.value}`}
              type="button"
              className={`p-2 rounded-lg border text-sm ${
                size === preset.value 
                  ? 'border-orange-500 bg-orange-500/20 text-orange-500' 
                  : 'border-neutral-700 hover:border-neutral-600'
              }`}
              onClick={() => {
                setSize(preset.value);
                localStorage.setItem('size', preset.value);
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>
      {/* 고급 설정 */}
      <CollapsiblePanel title="고급 설정" defaultOpen={false}>
        {/* 얼굴 참조 이미지 섹션 */}
        <div className="border border-neutral-800 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-medium">얼굴 참조 이미지</h3>
              <CustomTooltip 
                title="얼굴 참조" 
                description="생성된 이미지에 참조 이미지의 얼굴을 적용합니다. 선명한 얼굴 사진을 사용하세요."
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