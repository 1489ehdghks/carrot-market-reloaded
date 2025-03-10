"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { generateImageWithText, getImageUploadUrl, saveGeneratedImage, permanentlyStoreAIImage } from "../actions";
import ModelSelector from "./ModelSelector";
import { AI_MODELS, getDefaultModel, getModelById } from "../data/models";
import { SAMPLER_OPTIONS, getDefaultSampler } from "../data/samplers";
import { VAE_OPTIONS, getDefaultVae } from "../data/vae";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { encode } from "gpt-tokenizer";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { LoraOption, SelectedLora, getCompatibleLoras, getLoraById } from "../data/loras";
import { Switch } from "@/components/ui/switch";
import ImageUploader from "./ImageUploader";

interface TextToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
  modelId?: string;
  onModelChange?: (modelId: string) => void;
}

export default function TextToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false,
  modelId,
  onModelChange
}: TextToImageFormProps) {
  const [textPrompt, setTextPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  const [size, setSize] = useState("1024x1024");
  const [model, setModel] = useState("stable-diffusion");
  const [isGenerating, setIsGenerating] = useState(false);
  const [steps, setSteps] = useState(28);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState(getDefaultSampler());
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [selectedVae, setSelectedVae] = useState(getDefaultVae());
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'uploading' | 'saving'>('idle');
  const [tempImageUrl, setTempImageUrl] = useState<string | null>(null);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [faceImage, setFaceImage] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const [useFaceSwap, setUseFaceSwap] = useState<boolean>(false);
  const [faceSwapStrength, setFaceSwapStrength] = useState<number>(0.8);
  const [isProcessingFaceSwap, setIsProcessingFaceSwap] = useState<boolean>(false);
  
  // LoRA 관련 상태 및 함수
  const [selectedLoras, setSelectedLoras] = useState<SelectedLora[]>([]);
  
  // LoRA 호환성 체크
  const compatibleLoras = useMemo(() => {
    const currentModelId = modelId || model;
    return getCompatibleLoras(currentModelId);
  }, [model, modelId]);
  
  // 토큰 수 계산 함수
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    // 대략적인 토큰 수 계산 (영어 기준 1토큰 = 4글자, 한글 기준 1토큰 = 2-3글자)
    const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
    const otherCharCount = text.length - koreanCharCount;
    return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
  };

  // 선택된 모델 정보 가져오기
  const selectedModel = useMemo(
    () => getModelById(modelId || model) || getModelById(getDefaultModel().id) || AI_MODELS[0],
    [model, modelId]
  );
  
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
  
  // 모델 변경 시 모델별 설정 초기화
  useEffect(() => {
    const newSettings: Record<string, any> = {};
    
    if (selectedModel.configOptions) {
      // 모델별 설정 옵션의 기본값으로 초기화
      Object.entries(selectedModel.configOptions).forEach(([key, config]) => {
        // 기존 값 또는 기본값 설정
        if (key === 'steps') {
          setSteps(config.default);
        } else if (key === 'cfgScale') {
          setCfgScale(config.default);
        } else if (key === 'sampler') {
          setSampler(config.default);
        } else {
          newSettings[key] = config.default;
        }
      });
    }
    
    setModelSpecificSettings(newSettings);
  }, [selectedModel.id]);

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
    
    // 모델 ID만 변경하고 설정은 항상 유지
    localStorage.setItem('model', newModelId);
  };

  // Cloudflare에 이미지 업로드 함수
  const uploadToCloudflare = async (imageUrl: string): Promise<string> => {
    // 기존 API 호출 없이 바로 동일한 URL 반환 (테스트 환경)
    return imageUrl;
  };

  // 생성된 AI 이미지를 데이터베이스에 저장
  const permanentlyStoreAIImage = async (imageData: any): Promise<any> => {
    // 새 API는 이미 데이터베이스에 저장했으므로 단순히 ID와 URL 반환
    return {
      id: imageData.fileUrl.split('/').pop() || String(Date.now()),
      url: imageData.fileUrl
    };
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

  // AI 프롬프트 개선 함수
  const handleAIPromptEnhancement = async () => {
    if (!textPrompt || textPrompt.trim().length < 5) {
      onError("AI 개선을 위해서는 최소 5글자 이상의 프롬프트를 입력해주세요.");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // AI 프롬프트 개선 요청
      const enhancedPrompt = await fetch('/api/enhance-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt: textPrompt }),
      }).then(res => res.json());
      
      if (enhancedPrompt?.result) {
        setTextPrompt(enhancedPrompt.result);
        setPromptTokenCount(calculateTokens(enhancedPrompt.result));
        localStorage.setItem('textPrompt', enhancedPrompt.result);
      }
    } catch (error) {
      console.error('프롬프트 개선 중 오류 발생:', error);
      onError("프롬프트 개선에 실패했습니다. 다시 시도해주세요.");
    } finally {
      setIsGenerating(false);
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
      
      // FormData 생성
      const formData = new FormData();
      formData.append('file', optimizedFile);
      // 기존 cloudflareUpload 엔드포인트는 추가 메타데이터 매개변수를 사용하지 않음
      
      // 기존 업로드 API 호출
      const response = await fetch('/api/cloudflareUpload', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '얼굴 이미지 업로드 실패');
      }
      
      const data = await response.json();
      console.log('얼굴 이미지 업로드 완료:', data.url);
      return data.url;
    } catch (error) {
      console.error('얼굴 이미지 업로드 오류:', error);
      throw error;
    }
  };
  
  // Face Swap 적용 함수
  const applyFaceSwap = async (targetImageUrl: string, sourceImageUrl: string): Promise<string> => {
    try {
      setIsProcessingFaceSwap(true);
      
      console.log("Face Swap API 호출:", {
        target_image: targetImageUrl.substring(0, 50) + "...",
        source_image: sourceImageUrl.substring(0, 50) + "..."
      });
      
      const response = await fetch("/api/face-swap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          target_image: targetImageUrl,
          source_image: sourceImageUrl,
          strength: faceSwapStrength
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        console.error("Face Swap API 응답 오류:", errorData);
        throw new Error(errorData?.error || "Face Swap 처리 중 오류가 발생했습니다");
      }
      
      const result = await response.json();
      console.log("Face Swap 결과:", result);
      return result.imageUrl;
    } finally {
      setIsProcessingFaceSwap(false);
    }
  };
  
  // 이미지 생성 요청 제출 핸들러
  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!textPrompt) {
      onError("프롬프트를 입력해주세요.");
      return;
    }
    
    // Face Swap이 활성화되어 있고 얼굴 이미지가 있는 경우 최적화된 처리
    if (useFaceSwap && faceImage) {
      handleGenerationWithFaceSwap();
    } else {
      // 기존 이미지 생성 흐름
      handleNormalGeneration();
    }
  };
  
  // Face Swap을 적용한 이미지 생성 처리
  const handleGenerationWithFaceSwap = async () => {
    try {
      onGenerationStart();
      setIsGenerating(true);
      setLoadingState('generating');
      
      // 현재 선택된 모델 ID 가져오기
      const currentModelId = modelId || model;
      
      // 1. 얼굴 이미지를 base64로 변환 (병렬 처리)
      const faceImagePromise = faceImage ? uploadFaceImage(faceImage) : Promise.resolve(null);
      
      // 2. 이미지 생성 요청
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textPrompt,
          negativePrompt,
          modelId: currentModelId,
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1]),
          steps,
          cfgScale,
          sampler,
          vae: selectedVae,
          loras: selectedLoras.length > 0 ? selectedLoras : undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API 오류: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("이미지 생성 응답:", result);
      
      // 임시 URL 유효성 검사
      const generatedImageUrl = extractImageUrl(result);
      if (!generatedImageUrl) {
        throw new Error("이미지 생성에 실패했습니다. 유효한 URL이 반환되지 않았습니다.");
      }
      
      // 이미지 ID 추출
      let imageId = '';
      if (result.image && result.image.id) {
        imageId = String(result.image.id);
      } else if (result.id) {
        imageId = String(result.id);
      } else {
        imageId = String(Date.now());
      }
      
      // 3. 얼굴 이미지 base64 데이터 대기
      const faceImageData = await faceImagePromise;
      
      // 얼굴 이미지가 없다면 생성된 이미지만 반환
      if (!faceImageData) {
        onGenerationComplete(generatedImageUrl, imageId);
        setIsGenerating(false);
        setLoadingState('idle');
        return;
      }
      
      // 4. Face Swap 적용 (base64 데이터 직접 사용)
      console.log("Face Swap 적용 시작...");
      setLoadingState('saving');
      const swappedImageUrl = await applyFaceSwap(generatedImageUrl, faceImageData);
      
      // 5. 결과 처리
      onGenerationComplete(swappedImageUrl, imageId);
      
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      onError(error.message || "이미지 생성 중 오류가 발생했습니다.");
    } finally {
      setIsGenerating(false);
      setLoadingState('idle');
    }
  };
  
  // 기존 이미지 생성 처리 (Face Swap 없음)
  const handleNormalGeneration = async () => {
    try {
      onGenerationStart();
      setIsGenerating(true);
      setLoadingState('generating');
      
      // 현재 선택된 모델 ID 가져오기
      const currentModelId = modelId || model;
      
      // API 요청 준비
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: textPrompt,
          negativePrompt,
          modelId: currentModelId,
          width: parseInt(size.split('x')[0]),
          height: parseInt(size.split('x')[1]),
          steps,
          cfgScale,
          sampler,
          vae: selectedVae,
          loras: selectedLoras.length > 0 ? selectedLoras : undefined,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || `API 오류: ${response.status}`);
      }
      
      const result = await response.json();
      
      console.log("이미지 생성 응답:", result);
      
      // 임시 URL 유효성 검사
      const imageUrl = extractImageUrl(result);
      if (!imageUrl) {
        throw new Error("이미지 생성에 실패했습니다. 유효한 URL이 반환되지 않았습니다.");
      }
      
      // 이미지 ID 추출
      let imageId = '';
      if (result.image && result.image.id) {
        imageId = String(result.image.id);
      } else if (result.id) {
        imageId = String(result.id);
      } else {
        imageId = String(Date.now());
      }
      
      // 생성 완료 콜백 호출
      onGenerationComplete(imageUrl, imageId);
      
    } catch (error: any) {
      console.error("이미지 생성 오류:", error);
      onError(error.message || "이미지 생성 중 오류가 발생했습니다.");
    } finally {
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

  return (
    <form onSubmit={handleFormSubmit} className="space-y-4">
      {/* 프롬프트 입력 영역 - 완전 재구현 */}
      <div className="border border-neutral-800 rounded-lg overflow-hidden">
        <div className="grid grid-cols-2 border-b border-neutral-800">
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'prompt' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('prompt');
            }}
          >
            프롬프트
          </button>
          <button
            type="button"
            className={`py-2 text-sm font-medium ${
              activeTab === 'negative' ? 'bg-neutral-800 text-white' : 'bg-neutral-900 text-neutral-400 hover:bg-neutral-800/50'
            }`}
            onClick={(e) => {
              e.preventDefault();
              setActiveTab('negative');
            }}
          >
            제외할 요소
          </button>
        </div>
        
        <div className="p-3">
          <div className="flex justify-between items-center mb-2">
            <label className="text-sm font-medium">
              {activeTab === 'prompt' ? 'Prompt' : 'Negative Prompt'}
            </label>
            <span className="text-sm text-gray-500">
              {activeTab === 'prompt' ? `${promptTokenCount} tokens` : `${negativeTokenCount} tokens`}
            </span>
          </div>
          
          {activeTab === 'prompt' ? (
            <div className="relative">
              <textarea
                value={textPrompt}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = e.target.value;
                  setTextPrompt(newValue);
                  setPromptTokenCount(calculateTokens(newValue));
                  // 로컬 스토리지에 저장
                  localStorage.setItem('textPrompt', newValue);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe what you want to generate..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
                style={{zIndex: 10}}
              />
            </div>
          ) : (
            <div className="relative">
              <textarea
                value={negativePrompt}
                onChange={(e) => {
                  e.stopPropagation();
                  const newValue = e.target.value;
                  setNegativePrompt(newValue);
                  setNegativeTokenCount(calculateTokens(newValue));
                  // 로컬 스토리지에 저장
                  localStorage.setItem('negativePrompt', newValue);
                }}
                onClick={(e) => e.stopPropagation()}
                onKeyDown={(e) => e.stopPropagation()}
                placeholder="Describe what you want to avoid in the generated image..."
                className="w-full min-h-[120px] p-3 border rounded-md resize-none bg-neutral-800 text-white border-neutral-700 focus:border-orange-500 focus:ring focus:ring-orange-500/20 outline-none"
                style={{zIndex: 10}}
              />
            </div>
          )}
        </div>
      </div>
      
      {/* 모델 선택 */}
      <CollapsiblePanel title="AI 모델" defaultOpen={true}>
        <ModelSelector
          selectedModel={selectedModel}
          onModelChange={handleModelChange}
        />
      </CollapsiblePanel>
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
        ) : (
          <ImageUploader
            onImageUploaded={handleFaceImageUploaded}
            isDisabled={isGenerating}
          />
        )}
        
        {useFaceSwap && faceImage && (
          <div className="mt-3">
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
            />
          </div>
        )}
      </div>
      {/* 이미지 설정 */}
      <CollapsiblePanel title="이미지 설정" defaultOpen={false}>
        <div className="space-y-3">
          <div>
            <label className="block mb-2 text-sm">이미지 비율</label>
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
          
          {/* 모델별 설정 렌더링 */}
          {selectedModel.configOptions && 
            Object.entries(selectedModel.configOptions).map(([key, config]) => 
              renderSettingField(`model-config-${key}`, config)
            )
          }
          
          {/* Cloudflare 이미지 저장 방식 설정 제거 */}
          
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
              {SAMPLER_OPTIONS.map((samplerOption) => (
                <option key={`sampler-${samplerOption.id}`} value={samplerOption.id} title={samplerOption.description}>
                  {samplerOption.name}
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
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={
            isGenerating || 
            !textPrompt.trim() || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500 ||
            isProcessingFaceSwap
          }
          className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-t-white/20 border-white rounded-full animate-spin"></div>
              <span>
                {loadingState === 'generating' ? '이미지 생성 중...' :
                 loadingState === 'uploading' ? '이미지 처리 중...' :
                 loadingState === 'saving' ? (useFaceSwap ? 'Face Swap 적용 중...' : '정보 저장 중...') : 
                 '처리 중...'}
              </span>
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4z" />
                <path fillRule="evenodd" d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
              </svg>
              <span>{useFaceSwap && faceImage ? '이미지 생성 및 Face Swap 적용' : '이미지 생성하기'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
} 