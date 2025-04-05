"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { generateImageAction } from "@/app/(tabs)/image/actions";
import { Loader2, Wand2, ChevronsUpDown } from "lucide-react";
import { useImageUpload } from "@/features/image/hooks/useImageUpload";
import { useFormStatusManager } from "@/features/image/hooks/useFormStatusManager";
import { useCloudflareUpload } from "@/features/image/hooks/useCloudflareUpload";
import { handleGlobalError, UserFacingError } from "@/shared/constants/lib/error-handling";
import PromptTextarea from "../shared/PromptTextarea";
import { Button } from "@/widgets/elements/sub/button";
import { CustomSelect, CustomSelectContent, CustomSelectItem, CustomSelectTrigger, CustomSelectValue } from "@/widgets/elements/custom-select";
import { CustomLabel } from "@/widgets/elements/custom-label";
import { IMAGE_MODELS, getImageModelById } from "@/shared/models/image/imageModels";
import { CustomTooltip } from "@/widgets/shared/custom-tooltip";
import { CollapsiblePanel } from "../shared/CollapsiblePanel";
import InstantIDModelSettings from "./InstantIDModelSettings";
import StyleTransferModelSettings from "./StyleTransferModelSettings";

interface ImageToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string, thumbnailUrl?: string) => void;
  compact?: boolean;
}

export default function ImageToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  compact = false
}: ImageToImageFormProps) {
  // 커스텀 훅 사용
  const {
    imageFile,
    previewUrl,
    handleImageSelect,
    clearImage
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
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const faceImageRef = useRef<HTMLInputElement>(null);
  
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
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      if (faceImagePreview) {
        URL.revokeObjectURL(faceImagePreview);
      }
    };
  }, [previewUrl, faceImagePreview]);
  
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
  
  // 이미지 파일 선택 핸들러
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    try {
      await handleImageSelect(file);
    } catch (error) {
      console.error("Image upload error:", error);
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
    setFaceImageFile(null);
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
    const uploadResponse = await fetch('/api/image-upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('이미지 업로드 중 오류가 발생했습니다');
    }
    
    const { fileUrl, fileKey } = await uploadResponse.json();
    return fileKey; // 업로드된 이미지의 키 반환
  };
  
  // 이미지 생성 함수
  const generateImage = async ({
    prompt,
    modelId,
    width,
    height,
    sourceImage,
    useFaceSwap,
    faceImage
  }: {
    prompt: string;
    modelId: string;
    width: number;
    height: number;
    sourceImage: File;
    useFaceSwap?: boolean;
    faceImage?: File | null;
  }) => {
    try {
      const formData = new FormData();
      formData.append('sourceImage', sourceImage);

      const result = await generateImageAction({
        prompt,
        modelId,
        width,
        height,
        steps: config.num_inference_steps || 30,
        cfgScale: config.guidance_scale || 5.0,
        sampler: config.sampler || 'ddim',
        vae: config.vae || '',
        negativePrompt,
        useFaceSwap,
        faceImage: faceImage || undefined,
        faceSwapModelId: config.faceSwapModelId || '',
        faceSwapStrength: config.faceSwapStrength || 0.8,
        faceSwapOptions: config.faceSwapOptions || {}
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result;
    } catch (error) {
      console.error('이미지 생성 API 호출 중 오류:', error);
      throw error;
    }
  };
  
  // 이미지 생성 핸들러
  const handleImageGeneration = async () => {
    try {
      if (!imageFile) {
        handleError(new UserFacingError('원본 이미지가 필요합니다'));
        return;
      }

      if (!selectedModelId) {
        handleError(new UserFacingError('변환 모델을 선택해주세요'));
        return;
      }

      if (selectedModel?.requiredImages.sourceImage && !imageFile) {
        handleError(new UserFacingError('원본 이미지를 업로드해주세요'));
        return;
      }

      if (selectedModel?.requiredImages.faceImage && !faceImageFile) {
        handleError(new UserFacingError('얼굴 참조 이미지를 업로드해주세요'));
        return;
      }

      onGenerationStart();
      startProcess('generating');

      const result = await generateImage({
        prompt,
        modelId: selectedModelId,
        width: imageWidth,
        height: imageHeight,
        sourceImage: imageFile,
        useFaceSwap: selectedModel?.requiredImages.faceImage,
        faceImage: faceImageFile
      });

      if (!result.success) {
        handleError(new UserFacingError(result.error!));
        return;
      }

      startProcess('saving');
      const uploadResult = await uploadToPermanentStorage(
        result.imageUrl,
        result.imageId?.toString() || `temp-${Date.now()}`,
        imageWidth,
        imageHeight
      );

      if (!uploadResult.success || !uploadResult.url) {
        handleError(new UserFacingError('이미지 저장에 실패했습니다'));
        return;
      }

      setSuccess();
      onGenerationComplete(
        uploadResult.url,
        uploadResult.id || String(Date.now()),
        uploadResult.thumbnailUrl || undefined
      );

      // localStorage에 현재 상태 저장
      localStorage.setItem('model', selectedModelId);
      localStorage.setItem('width', imageWidth.toString());
      localStorage.setItem('height', imageHeight.toString());
      localStorage.setItem('steps', (config.num_inference_steps || 30).toString());
      localStorage.setItem('cfgScale', (config.guidance_scale || 5.0).toString());
      localStorage.setItem('sampler', config.sampler || 'ddim');
      localStorage.setItem('vae', config.vae || '');

      // 경고 메시지가 있는 경우 표시
      if (result.warning) {
        console.warn(result.warning);
      }

    } catch (error) {
      console.error('이미지 생성 중 오류 발생:', error);
      handleError(error instanceof UserFacingError ? error : new UserFacingError('알 수 없는 오류가 발생했습니다'));
    } finally {
      startProcess('idle');
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
  
  return (
    <form onSubmit={handleImageGeneration} className="space-y-6">
      {/* 모델 선택 */}
      <div className="space-y-2">
        <CustomLabel className="text-sm font-medium">변환 모델 선택</CustomLabel>
        <CustomSelect 
          value={selectedModelId} 
          onValueChange={handleModelChange}
        >
          <CustomSelectTrigger className="w-full bg-neutral-800 border-neutral-700">
            <CustomSelectValue placeholder="모델 선택" />
          </CustomSelectTrigger>
          <CustomSelectContent className="bg-neutral-800 border-neutral-700">
            {IMAGE_MODELS.map((model) => (
              <CustomSelectItem 
                key={model.id} 
                value={model.id}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span>{model.name}</span>
                </div>
              </CustomSelectItem>
            ))}
          </CustomSelectContent>
        </CustomSelect>
        
        {/* 선택된 모델 정보 */}
        {selectedModel && (
          <div className="p-3 bg-neutral-900 rounded-lg border border-neutral-800">
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-medium">{selectedModel.name}</h3>
              <div className="flex items-center space-x-2">
                <CustomTooltip title="모델 품질"
                  description="높을수록 더 좋은 품질의 이미지를 생성할 수 있습니다."
                >
                  <div className="px-2 py-1 bg-orange-800/30 rounded-lg text-xs">
                    {selectedModel.features.quality}
                  </div>
                </CustomTooltip>
                
                <CustomTooltip title="처리 속도" 
                  description="빠를수록 이미지 생성 시간이 단축됩니다."
                >
                  <div className="px-2 py-1 bg-blue-800/30 rounded text-xs">
                    {selectedModel.features.speed}
                  </div>
                </CustomTooltip>
                
                <CustomTooltip title="이용 가격" 
                  description="이 모델 사용 시 소모되는 크레딧 양입니다."
                >
                  <div className="px-2 py-1 bg-green-800/30 rounded text-xs">
                    {selectedModel.tokenPrice} token
                  </div>
                </CustomTooltip>
              </div>
            </div>
            <p className="text-sm text-gray-400">{selectedModel.description}</p>
          </div>
        )}
      </div>

      {/* 원본 이미지 업로드 영역 - 선택된 모델이 원본 이미지를 필요로 할 때만 표시 */}
      {selectedModel?.requiredImages.sourceImage && (
        <div className="space-y-2">
          <CustomLabel className="text-sm font-medium">원본 이미지 (변환할 이미지)</CustomLabel>
          <div className="border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
            <div className="flex items-center space-x-4">
              <div className="w-32 h-32 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
                {previewUrl ? (
                  <img 
                    src={previewUrl} 
                    alt="미리보기" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-10 h-10 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                )}
              </div>
              
              <div className="flex-1 space-y-2">
                {previewUrl ? (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={clearImage}
                    className="w-full"
                  >
                    이미지 변경
                  </Button>
                ) : (
                  <Button 
                    type="button" 
                    variant="outline"
                    onClick={() => document.getElementById('image-upload')?.click()}
                    className="w-full"
                  >
                    이미지 선택
                  </Button>
                )}
                <p className="text-xs text-gray-400">
                  최대 10MB, JPG, PNG, WEBP 형식 지원
                </p>
              </div>
              <input
                id="image-upload"
                type="file"
                onChange={handleImageUpload}
                accept="image/*"
                className="hidden"
              />
            </div>
          </div>
        </div>
      )}
      
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
      
      {/* 모델별 기본 설정 영역 - 조건부 렌더링 */}
      {selectedModelId === 'instantId' && selectedModel?.requiredImages.faceImage ? (
        <InstantIDModelSettings
          faceImagePreview={faceImagePreview}
          config={config}
          onConfigChange={handleConfigChange}
          onFaceImageClick={() => faceImageRef.current?.click()}
          clearFaceImage={clearFaceImage}
          faceImageRef={faceImageRef as React.RefObject<HTMLInputElement>}
          handleFaceImageUpload={handleFaceImageUpload}
          showAdvancedSettings={false}
        />
      ) : selectedModelId === 'styleTransfer' ? (
        <StyleTransferModelSettings
          strength={strength}
          onStrengthChange={handleStrengthChange}
          config={config}
          onConfigChange={handleConfigChange}
          showAdvancedSettings={false}
        />
      ) : (
        selectedModelId && (
          <div className="p-4 text-center text-neutral-400">
            기본 설정을 사용합니다
          </div>
        )
      )}
      
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
          ) : selectedModelId === 'instantId' ? (
            <InstantIDModelSettings
              faceImagePreview={faceImagePreview}
              config={config}
              onConfigChange={handleConfigChange}
              onFaceImageClick={() => faceImageRef.current?.click()}
              clearFaceImage={clearFaceImage}
              faceImageRef={faceImageRef as React.RefObject<HTMLInputElement>}
              handleFaceImageUpload={handleFaceImageUpload}
              showAdvancedSettings={true}
            />
          ) : selectedModelId === 'styleTransfer' ? (
            <StyleTransferModelSettings
              strength={strength}
              onStrengthChange={handleStrengthChange}
              config={config}
              onConfigChange={handleConfigChange}
              showAdvancedSettings={true}
            />
          ) : (
            <div className="text-center text-neutral-400 py-4">
              이 모델에 대한 고급 설정이 없습니다
            </div>
          )}
        </div>
      </CollapsiblePanel>
      
      {/* 변환 버튼 */}
      <Button 
        type="submit"
        disabled={
          isProcessing || 
          !selectedModelId || 
          (selectedModel?.requiredImages.sourceImage && !imageFile) || 
          (selectedModel?.requiredImages.faceImage && !faceImageFile)
        }
        className="w-full h-12 text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700"
      >
        {isProcessing ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            {status === 'generating' && '이미지 변환 중...'}
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