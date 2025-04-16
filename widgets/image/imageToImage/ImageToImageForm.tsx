"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { generateImageWithImage, imageGenerateImage, type ImageGenerationResponse } from "@/app/(tabs)/image/actions";
import { Loader2, Wand2, User } from "lucide-react";
import { useImageUpload } from "@/features/image/hooks/useImageUpload";
import { useFormStatusManager } from "@/features/image/hooks/useFormStatusManager";
import { useCloudflareUpload } from "@/features/image/hooks/useCloudflareUpload";
import { UserFacingError } from "@/shared/lib/error-handling";
import PromptTextarea from "../shared/PromptTextarea";
import { Button } from "@/widgets/elements/sub/button";
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from "@/widgets/elements/custom-select";
import { CustomLabel } from "@/widgets/elements/custom-label";
import { getImageModelById } from "@/shared/models/image/imageModels";
import { CollapsiblePanel } from "../shared/CollapsiblePanel";
import ModelSelectorImage from "../shared/ModelSelector-image";
import { CustomSlider } from "@/widgets/elements/custom-slider";
import { toast } from "react-hot-toast";

interface ImageToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string, thumbnailUrl?: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export default function ImageToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false
}: ImageToImageFormProps) {
  // 커스텀 훅 사용
  const {
    imageFile: sourceImageFile,
    previewUrl: sourceImagePreview,
    handleImageSelect: handleSourceImageSelect,
    clearImage: clearSourceImage
  } = useImageUpload({ maxSizeMB: 10 });
  
  const {
    status,
    isProcessing,
    startProcess,
    handleError,
    setSuccess
  } = useFormStatusManager();
  
  const { uploadToPermanentStorage } = useCloudflareUpload();
  
  // 로컬 상태
  const [prompt, setPrompt] = useState<string>("");
  const [negativePrompt, setNegativePrompt] = useState<string>("");
  const [strength, setStrength] = useState<number>(0.8);
  const [selectedModelId, setSelectedModelId] = useState<string>("");
  const [config, setConfig] = useState<Record<string, any>>({});
  const [showAdvancedSettings, setShowAdvancedSettings] = useState<boolean>(false);
  
  // InstantID 관련 상태
  const [faceImageFile, setFaceImageFile] = useState<File | undefined>(undefined);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const faceImageRef = useRef<HTMLInputElement>(null);
  const sourceImageRef = useRef<HTMLInputElement>(null);
  
  // 이미지 크기
  const [imageWidth, setImageWidth] = useState<number>(768);
  const [imageHeight, setImageHeight] = useState<number>(768);
  
  // 로컬 스토리지 키 상수
  const STORAGE_KEYS = {
    PROMPT: 'img2img_prompt',
    NEGATIVE_PROMPT: 'img2img_negativePrompt',
    STRENGTH: 'img2img_strength',
    MODEL_ID: 'img2img_modelId',
    CONFIG: 'img2img_config',
    IMAGE_WIDTH: 'img2img_width',
    IMAGE_HEIGHT: 'img2img_height',
    ADVANCED_SETTINGS: 'img2img_advancedSettings'
  };
  
  // 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    try {
      // 프롬프트
      const savedPrompt = localStorage.getItem(STORAGE_KEYS.PROMPT);
      if (savedPrompt) setPrompt(savedPrompt);
      
      // 네거티브 프롬프트
      const savedNegativePrompt = localStorage.getItem(STORAGE_KEYS.NEGATIVE_PROMPT);
      if (savedNegativePrompt) setNegativePrompt(savedNegativePrompt);
      
      // 강도
      const savedStrength = localStorage.getItem(STORAGE_KEYS.STRENGTH);
      if (savedStrength) setStrength(parseFloat(savedStrength));
      
      // 모델 ID
      const savedModelId = localStorage.getItem(STORAGE_KEYS.MODEL_ID);
      if (savedModelId) setSelectedModelId(savedModelId);
      
      // 설정
      const savedConfig = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (savedConfig) {
        try {
          setConfig(JSON.parse(savedConfig));
        } catch (e) {
          console.error("Failed to parse saved config:", e);
        }
      }
      
      // 이미지 크기
      const savedWidth = localStorage.getItem(STORAGE_KEYS.IMAGE_WIDTH);
      if (savedWidth) setImageWidth(parseInt(savedWidth));
      
      const savedHeight = localStorage.getItem(STORAGE_KEYS.IMAGE_HEIGHT);
      if (savedHeight) setImageHeight(parseInt(savedHeight));
      
      // 고급 설정 패널 상태
      const savedAdvancedSettings = localStorage.getItem(STORAGE_KEYS.ADVANCED_SETTINGS);
      if (savedAdvancedSettings) setShowAdvancedSettings(savedAdvancedSettings === 'true');
      
      console.log("이미지-이미지 설정을 로컬 스토리지에서 불러왔습니다");
      
    } catch (error) {
      console.error("Failed to load settings from localStorage:", error);
    }
  }, []);
  
  // 컴포넌트 언마운트 시 이미지 파일 클린업
  useEffect(() => {
    return () => {
      // URL 객체 메모리 누수 방지
      if (sourceImagePreview) {
        URL.revokeObjectURL(sourceImagePreview);
      }
      if (faceImagePreview) {
        URL.revokeObjectURL(faceImagePreview);
      }
    };
  }, [sourceImagePreview, faceImagePreview]);
  
  // 설정값 저장 함수
  const saveToLocalStorage = useCallback((key: string, value: any) => {
    try {
      if (value === undefined || value === null) return;
      
      if (typeof value === 'object') {
        localStorage.setItem(key, JSON.stringify(value));
      } else {
        localStorage.setItem(key, String(value));
      }
    } catch (error) {
      console.error(`Failed to save ${key} to localStorage:`, error);
    }
  }, []);
  
  // 선택된 모델 정보
  const selectedModel = useMemo(() => {
    return getImageModelById(selectedModelId);
  }, [selectedModelId]);
  
  // 모델 선택 핸들러 (로컬 스토리지 저장 추가)
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    saveToLocalStorage(STORAGE_KEYS.MODEL_ID, modelId);
    
    // 선택된 모델의 기본 설정으로 초기화
    const newModel = getImageModelById(modelId);
    if (newModel?.configOptions) {
      const defaultConfig: Record<string, any> = {};
      Object.entries(newModel.configOptions).forEach(([key, optionConfig]) => {
        defaultConfig[key] = optionConfig.default;
      });
      setConfig(defaultConfig);
      saveToLocalStorage(STORAGE_KEYS.CONFIG, defaultConfig);
    } else {
      setConfig({});
      saveToLocalStorage(STORAGE_KEYS.CONFIG, {});
    }
  };
  
  // 설정 변경 핸들러 (로컬 스토리지 저장 추가)
  const handleConfigChange = (key: string, value: any) => {
    const updatedConfig = {
      ...config,
      [key]: value
    };
    setConfig(updatedConfig);
    saveToLocalStorage(STORAGE_KEYS.CONFIG, updatedConfig);
  };
  
  // 프롬프트 변경 핸들러 (로컬 스토리지 저장 추가)
  const handlePromptChange = (value: string) => {
    setPrompt(value);
    saveToLocalStorage(STORAGE_KEYS.PROMPT, value);
  };
  
  // 네거티브 프롬프트 변경 핸들러 (로컬 스토리지 저장 추가)
  const handleNegativePromptChange = (value: string) => {
    setNegativePrompt(value);
    saveToLocalStorage(STORAGE_KEYS.NEGATIVE_PROMPT, value);
  };
  
  // 강도 변경 핸들러 (로컬 스토리지 저장 추가)
  const handleStrengthChange = (value: number) => {
    setStrength(value);
    saveToLocalStorage(STORAGE_KEYS.STRENGTH, value);
  };
  
  // 이미지 크기 변경 핸들러 (로컬 스토리지 저장 추가)
  const handleWidthChange = (val: string) => {
    const width = Number(val);
    setImageWidth(width);
    saveToLocalStorage(STORAGE_KEYS.IMAGE_WIDTH, width);
  };
  
  const handleHeightChange = (val: string) => {
    const height = Number(val);
    setImageHeight(height);
    saveToLocalStorage(STORAGE_KEYS.IMAGE_HEIGHT, height);
  };
  
  // 고급 설정 패널 상태 변경 핸들러 (로컬 스토리지 저장 추가)
  const handleAdvancedSettingsChange = (open: boolean) => {
    setShowAdvancedSettings(open);
    saveToLocalStorage(STORAGE_KEYS.ADVANCED_SETTINGS, open);
  };
  
  // 원본 이미지 파일 선택 핸들러
  const handleSourceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await handleSourceImageSelect(file);
    } catch (error) {
      console.error("Source image upload error:", error);
    }
  };
  
  // 얼굴 참조 이미지 선택 핸들러 (InstantID 모델용)
  const handleFaceImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      // 이미지 미리보기 생성
      const reader = new FileReader();
      reader.onloadend = () => {
        setFaceImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setFaceImageFile(file);
    } catch (error) {
      console.error("Face image upload error:", error);
    }
  };
  
  // 얼굴 참조 이미지 초기화
  const clearFaceImage = () => {
    setFaceImageFile(undefined);
    setFaceImagePreview(null);
    if (faceImageRef.current) {
      faceImageRef.current.value = '';
    }
  };
  
  // 이미지 업로드 준비
  const prepareImageUpload = async (file: File): Promise<string> => {
    // 이미지 파일을 FormData로 준비
    const formData = new FormData();
    formData.append('file', file);
    
    // 서버에 업로드
    const uploadResponse = await fetch('/features/image/api/image-upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('이미지 업로드 중 오류가 발생했습니다');
    }
    
    const { fileUrl, fileKey } = await uploadResponse.json();
    return fileKey; // 업로드된 이미지의 키 반환
  };
  
  // 간소화된 이미지 최적화 함수
  const optimizeImage = async (base64: string, maxWidth = 512, quality = 0.6): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        const img = new Image();
        img.onload = () => {
          // 캔버스 생성
          const canvas = document.createElement('canvas');
          
          // 이미지 크기 계산
          let width = img.width;
          let height = img.height;
          
          // 이미지 비율 유지하며 크기 조정
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
          
          // 최대 높이 제한 (너비 조정 이후)
          const maxHeight = Math.min(768, maxWidth * 1.5);
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
          
          // 캔버스 크기 설정
          canvas.width = width;
          canvas.height = height;
          
          // 이미지 그리기
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            reject(new Error('캔버스 컨텍스트를 생성할 수 없습니다'));
            return;
          }
          
          // 이미지 선명도 설정
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // 배경 채우기 (투명 배경이 있는 PNG 처리용)
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          
          // 이미지 그리기
          ctx.drawImage(img, 0, 0, width, height);
          
          // JPEG 형식으로 변환하여 크기 최적화
          resolve(canvas.toDataURL('image/jpeg', quality));
        };
        
        img.onerror = (error) => {
          reject(new Error('이미지 로드 중 오류가 발생했습니다'));
        };
        
        img.src = base64;
      } catch (error) {
        reject(error);
      }
    });
  };
  
  // 이미지 생성 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sourceImageFile) {
      toast.error("이미지를 업로드해주세요");
      return;
    }
    
    if (!prompt) {
      toast.error("프롬프트를 입력해주세요");
      return;
    }
    
    if (!selectedModel) {
      toast.error("모델을 선택해주세요");
      return;
    }

    // 처리 시작
    startProcess('generating');
    onGenerationStart();
    
    // 토스트 메시지로 시작 알림
    const toastId = toast.loading("이미지 변환 중...");
    
    try {
      // 1. 이미지를 Base64로 변환
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(sourceImageFile);
      });

      // 2. 이미지 최적화 (매우 보수적인 설정으로 크기 줄이기)
      const optimizedImage = await optimizeImage(base64Image, 512, 0.6);
      const originalSize = Math.round(base64Image.length / 1024);
      const optimizedSize = Math.round(optimizedImage.length / 1024);
      
      console.log(`이미지 최적화: ${originalSize}KB → ${optimizedSize}KB (${Math.round((1 - optimizedSize/originalSize) * 100)}% 압축)`);
      
      // 이미지가 여전히 너무 크면 더 강력하게 압축
      let finalImage = optimizedImage;
      if (optimizedSize > 1024) {
        console.warn(`이미지가 여전히 큼 (${optimizedSize}KB), 추가 압축 실행`);
        finalImage = await optimizeImage(optimizedImage, 400, 0.5);
        const finalSize = Math.round(finalImage.length / 1024);
        console.log(`추가 압축: ${optimizedSize}KB → ${finalSize}KB (${Math.round((1 - finalSize/optimizedSize) * 100)}% 추가 압축)`);
      }

      // 3. FormData 생성
      const formData = new FormData();
      
      // Base64 이미지 데이터 준비 - 프리픽스 처리 추가
      const finalImageData = finalImage.includes('base64,') ? finalImage : finalImage;
      
      formData.append("imageUrl", finalImageData);
      formData.append("prompt", prompt);
      formData.append("negativePrompt", negativePrompt || "");
      formData.append("width", imageWidth.toString());
      formData.append("height", imageHeight.toString());
      formData.append("num_inference_steps", config.num_inference_steps?.toString() || "30");
      formData.append("guidance_scale", config.guidance_scale?.toString() || "7.5");
      formData.append("scheduler", config.scheduler || "DPMSolverMultistep");
      formData.append("strength", config.strength?.toString() || "0.7");
      formData.append("model", selectedModel.id);
      
      // 토스트 메시지 업데이트
      toast.loading("Replicate AI에 요청 보내는 중...", { id: toastId });
      
      // 4. 서버 액션 호출 (Replicate API 처리)
      const result = await imageGenerateImage(formData);
      
      if (!result.success) {
        toast.error(result.error || "이미지 변환에 실패했습니다", { id: toastId });
        throw new Error(result.error || "이미지 변환에 실패했습니다");
      }
      
      // 5. 성공 처리
      toast.success("이미지 변환 완료!", { id: toastId });
      
      // 임시 상태 업데이트 (백그라운드 저장 중)
      startProcess('saving');
      
      // 6. 결과 처리
      setSuccess();
      onGenerationComplete(
        result.url,
        result.id?.toString() || `result_${Date.now()}`,
        result.url
      );
      
    } catch (error) {
      // 에러 처리
      console.error("이미지 변환 오류:", error);
      handleError(error instanceof Error ? error.message : "이미지 변환 중 오류가 발생했습니다");
      toast.error("이미지 변환 실패", { id: toastId });
    } finally {
      // 약간의 딜레이 후 상태 변경 (UX 개선)
      setTimeout(() => {
        startProcess('idle');
      }, 500);
    }
  };
  
  // 이미지 크기 설정 UI (로컬 스토리지 저장 부분 추가)
  const renderSizeSettings = () => (
    <div className="space-y-2">
      <CustomLabel className="text-lg font-medium">이미지 크기</CustomLabel>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <CustomSelect
            value={String(imageWidth)}
            onValueChange={handleWidthChange}
          >
            <p className="text-xs text-gray-400">너비</p>
            <CustomSelectTrigger className="w-full">
              <CustomSelectValue placeholder="너비" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="512">512px</CustomSelectItem>
              <CustomSelectItem value="768">768px</CustomSelectItem>
              <CustomSelectItem value="1024">1024px</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>
        
        <div className="space-y-2">
          <CustomSelect
            value={String(imageHeight)}
            onValueChange={handleHeightChange}
          >
            <p className="text-xs text-gray-400">높이</p>
            <CustomSelectTrigger className="w-full">
              <CustomSelectValue placeholder="높이" />
            </CustomSelectTrigger>
            <CustomSelectContent>
              <CustomSelectItem value="512">512px</CustomSelectItem>
              <CustomSelectItem value="768">768px</CustomSelectItem>
              <CustomSelectItem value="1024">1024px</CustomSelectItem>
            </CustomSelectContent>
          </CustomSelect>
        </div>
      </div>
    </div>
  );
  
  // 이미지 업로더 렌더링 함수
  const renderImageUploader = () => {
    if (!selectedModel) return null;
    
    return (
      <div className="space-y-4">
        {/* 얼굴 참조 이미지 업로드 영역 - 선택된 모델이 얼굴 이미지를 필요로 할 때만 표시 */}
        {selectedModel.requiredImages.faceImage && (
          <div className="space-y-2">
            <CustomLabel className="text-sm font-medium">얼굴 참조 이미지</CustomLabel>
            <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
              <div className="flex items-center space-x-4">
                <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                  {faceImagePreview ? (
                    <img 
                      src={faceImagePreview} 
                      alt="얼굴 참조 이미지" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-10 h-10 text-neutral-500" />
                    </div>
                  )}
                </div>
                
                <div className="flex-1 space-y-2">
                  {faceImagePreview ? (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={clearFaceImage}
                      className="w-full"
                    >
                      이미지 변경
                    </Button>
                  ) : (
                    <Button 
                      type="button" 
                      variant="outline"
                      onClick={() => faceImageRef.current?.click()}
                      className="w-full"
                    >
                      이미지 선택
                    </Button>
                  )}
                  <p className="text-xs text-gray-400">
                    선명한 얼굴이 나온 이미지를 선택하세요
                  </p>
                </div>
                <input
                  ref={faceImageRef}
                  type="file"
                  onChange={handleFaceImageUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 모델 선택 */}
      <div className="space-y-2">
        <ModelSelectorImage 
          selectedModel={selectedModelId} 
          onModelChange={handleModelChange}
        />
      </div>

      {/* 이미지 크기 설정 영역 */}
      {selectedModelId && renderSizeSettings()}

      {/* 프롬프트 입력 영역 - 핸들러 함수 변경 */}
      <PromptTextarea 
        prompt={prompt}
        negativePrompt={negativePrompt}
        onPromptChange={handlePromptChange}
        onNegativePromptChange={handleNegativePromptChange}
        promptTokenLimit={1500}
        negativeTokenLimit={500}
        className="bg-neutral-800 rounded-lg"
      />
      
      {/* 고급 설정 패널 - onOpenChange 함수 변경 */}
      <CollapsiblePanel 
        title="고급 설정" 
        defaultOpen={showAdvancedSettings}
        onOpenChange={handleAdvancedSettingsChange}
      >
        <div className="space-y-6 p-4">
          {!selectedModelId ? (
            <div className="text-center text-neutral-400 py-4">
              모델을 선택해주세요
            </div>
          ) : (
            <>
              {/* 이미지 업로더 */}
              {selectedModel?.requiredImages.sourceImage && (
                <div className="space-y-2">
                  <CustomLabel className="text-sm font-medium">원본 이미지</CustomLabel>
                  <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                        {sourceImagePreview ? (
                          <img 
                            src={sourceImagePreview} 
                            alt="원본 이미지" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-10 h-10 text-neutral-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {sourceImagePreview ? (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={clearSourceImage}
                            className="w-full"
                          >
                            이미지 변경
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => sourceImageRef.current?.click()}
                            className="w-full"
                          >
                            이미지 선택
                          </Button>
                        )}
                        <p className="text-xs text-gray-400">
                          변환할 원본 이미지를 선택하세요
                        </p>
                      </div>
                      <input
                        ref={sourceImageRef}
                        type="file"
                        onChange={handleSourceImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* 얼굴 이미지 업로더 */}
              {selectedModel?.requiredImages.faceImage && (
                <div className="space-y-2">
                  <CustomLabel className="text-sm font-medium">얼굴 참조 이미지</CustomLabel>
                  <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
                    <div className="flex items-center space-x-4">
                      <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                        {faceImagePreview ? (
                          <img 
                            src={faceImagePreview} 
                            alt="얼굴 참조 이미지" 
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-10 h-10 text-neutral-500" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        {faceImagePreview ? (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={clearFaceImage}
                            className="w-full"
                          >
                            이미지 변경
                          </Button>
                        ) : (
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={() => faceImageRef.current?.click()}
                            className="w-full"
                          >
                            이미지 선택
                          </Button>
                        )}
                        <p className="text-xs text-gray-400">
                          선명한 얼굴이 나온 이미지를 선택하세요
                        </p>
                      </div>
                      <input
                        ref={faceImageRef}
                        type="file"
                        onChange={handleFaceImageUpload}
                        accept="image/*"
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* scheduler 설정 */}
              <div className="space-y-2">
                <CustomLabel className="text-sm font-medium">샘플러</CustomLabel>
                <CustomSelect
                  value={config.scheduler || 'K_EULER_ANCESTRAL'}
                  onValueChange={(value) => handleConfigChange('scheduler', value)}
                >
                  <CustomSelectTrigger className="w-full">
                    <CustomSelectValue placeholder="샘플러 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    <CustomSelectItem value="DDIM">DDIM</CustomSelectItem>
                    <CustomSelectItem value="DPMSolverMultistep">DPMSolverMultistep</CustomSelectItem>
                    <CustomSelectItem value="HeunDiscrete">HeunDiscrete</CustomSelectItem>
                    <CustomSelectItem value="KarrasDPM">KarrasDPM</CustomSelectItem>
                    <CustomSelectItem value="K_EULER_ANCESTRAL">K_EULER_ANCESTRAL</CustomSelectItem>
                    <CustomSelectItem value="K_EULER">K_EULER</CustomSelectItem>
                    <CustomSelectItem value="PNDM">PNDM</CustomSelectItem>
                  </CustomSelectContent>
                </CustomSelect>
                <p className="text-xs text-gray-400">
                  이미지 생성에 사용할 샘플러를 선택합니다. 각 샘플러는 다른 특성을 가집니다.
                </p>
              </div>

              {/* Guidance Scale 설정 */}
              <div className="space-y-2">
                <CustomLabel className="text-sm font-medium">CFG 스케일</CustomLabel>
                <div className="flex items-center space-x-4">
                  <CustomSlider
                    value={[config.guidance_scale || 3.5]}
                    onValueChange={(value) => handleConfigChange('guidance_scale', value[0])}
                    min={1.0}
                    max={50.0}
                    step={0.5}
                    className="flex-1"
                  />
                  <span className="text-sm text-neutral-400 w-12 text-right">
                    {(config.guidance_scale || 3.5).toFixed(1)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  생성 과정에서 모델이 입력 텍스트(프롬프트)를 얼마나 중요하게 여길지 결정하는 변수
                </p>
              </div>

              {/* Steps 설정 */}
              <div className="space-y-2">
                <CustomLabel className="text-sm font-medium">스텝 수</CustomLabel>
                <div className="flex items-center space-x-4">
                  <CustomSlider
                    value={[config.num_inference_steps || 40]}
                    onValueChange={(value) => handleConfigChange('num_inference_steps', value[0])}
                    min={1}
                    max={100}
                    step={1}
                    className="flex-1"
                  />
                  <span className="text-sm text-neutral-400 w-12 text-right">
                    {config.num_inference_steps || 40}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  이미지 생성 과정에서 모델이 노이즈를 점진적으로 제거하며 이미지를 세밀화하는 데 사용되는 단계의 수
                </p>
              </div>

              {/* Strength 설정 */}
              <div className="space-y-2">
                <CustomLabel className="text-sm font-medium">이미지 영향력</CustomLabel>
                <div className="flex items-center space-x-4">
                  <CustomSlider
                    value={[config.strength || 0.4]}
                    onValueChange={(value) => handleConfigChange('strength', value[0])}
                    min={0}
                    max={1}
                    step={0.01}
                    className="flex-1"
                  />
                  <span className="text-sm text-neutral-400 w-12 text-right">
                    {(config.strength || 0.4).toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-gray-400">
                  Prompt strength when using img2img, 낮을수록 이미지의 영향이 강함. 높으면 프롬프트의 영향이 강함.
                </p>
              </div>
            </>
          )}
        </div>
      </CollapsiblePanel>
      
      {/* 변환 버튼 */}
      <Button 
        type="submit"
        disabled={
          isProcessing || 
          !selectedModelId || 
          (selectedModel?.requiredImages.sourceImage && !sourceImageFile) || 
          (selectedModel?.requiredImages.faceImage && !faceImageFile)
        }
        className="w-full h-12 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {status === 'generating' && '이미지 변환 중...'}
            {status === 'saving' && '이미지 저장 중...'}
          </>
        ) : (
          <>
            <Wand2 className="mr-2 h-4 w-4" />
            이미지 변환하기
          </>
        )}
      </Button>
    </form>
  );
} 