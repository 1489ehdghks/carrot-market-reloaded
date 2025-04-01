"use client";

import { useRef, useState, useCallback, useMemo, useEffect } from "react";
import { generateImageWithImage } from "../../actions";
import { Loader2, Wand2, ChevronsUpDown } from "lucide-react";
import { useImageUpload } from "../../hooks/useImageUpload";
import { useFormStatusManager } from "../../hooks/useFormStatusManager";
import { useCloudflareUpload } from "../../hooks/useCloudflareUpload";
import { handleGlobalError, UserFacingError } from "@/app/lib/error-handling";
import PromptTextarea from "../shared/PromptTextarea";
import { Button } from "@/widgets/elements/sub/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/form/select";
import { Label } from "@/components/ui/form/label";
import { IMAGE_MODELS, getImageModelById } from "../../data/imageModels";
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
  
  // 폼 제출 핸들러
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // 유효성 검사
      if (!prompt.trim()) {
        throw new UserFacingError('프롬프트를 입력해주세요');
      }
      
      if (!selectedModelId) {
        throw new UserFacingError('변환 모델을 선택해주세요');
      }
      
      // 모델별 필요 이미지 유효성 검사
      if (selectedModel?.requiredImages.sourceImage && !imageFile) {
        throw new UserFacingError('원본 이미지를 업로드해주세요');
      }
      
      if (selectedModel?.requiredImages.faceImage && !faceImageFile) {
        throw new UserFacingError('얼굴 참조 이미지를 업로드해주세요');
      }
      
      // 생성 시작
      onGenerationStart();
      startProcess('uploading');
      
      // 1. 필요한 이미지 업로드 진행
      let imageKey = null;
      if (selectedModel?.requiredImages.sourceImage && imageFile) {
        imageKey = await prepareImageUpload(imageFile);
        if (!imageKey) {
          throw new UserFacingError('원본 이미지 업로드에 실패했습니다');
        }
      }
      
      // 2. InstantID 모델을 위한 얼굴 이미지 업로드 (필요한 경우)
      let faceImageKey = null;
      if (selectedModel?.requiredImages.faceImage && faceImageFile) {
        faceImageKey = await prepareImageUpload(faceImageFile);
        if (!faceImageKey) {
          throw new UserFacingError('얼굴 참조 이미지 업로드에 실패했습니다');
        }
      }
      
      // 3. API 요청 준비
      startProcess('generating');
      
      // 모델별 API 요청 구현
      let result;
      
      if (selectedModelId === 'instantId') {
        // InstantID 모델 특수 처리
        // 얼굴 이미지는 반드시 필요
        if (!faceImageKey) {
          throw new UserFacingError('InstantID 모델에는 얼굴 참조 이미지가 필요합니다');
        }
        
        console.log('InstantID API 요청 데이터:', {
          prompt,
          negative_prompt: negativePrompt,
          face_image_url: faceImageKey,
          ip_adapter_scale: config.ip_adapter_scale || 0.8,
          enhance_face_region: config.enhance_face_region ?? true,
          width: imageWidth,
          height: imageHeight
        });
        
        // InstantID 모델은 별도의 API 엔드포인트 사용
        const instantIdResponse = await fetch('/api/image-to-image/instant-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negativePrompt,
            // imageKey가 null이면 빈 문자열 전송 (서버에서 무시될 예정)
            image_url: imageKey || '',
            face_image_url: faceImageKey,
            ip_adapter_scale: config.ip_adapter_scale || 0.8,
            enhance_face_region: config.enhance_face_region ?? true,
            width: imageWidth,
            height: imageHeight,
            num_inference_steps: config.num_inference_steps || 30,
            guidance_scale: config.guidance_scale || 5.0,
            seed: -1 // 항상 랜덤 시드 사용
          }),
        });
        
        if (!instantIdResponse.ok) {
          const errorData = await instantIdResponse.json().catch(() => ({ error: '응답 처리 중 오류가 발생했습니다' }));
          console.error('InstantID API 응답 오류:', errorData);
          throw new UserFacingError(errorData.error || errorData.details || 'InstantID 이미지 변환에 실패했습니다');
        }
        
        result = await instantIdResponse.json();
      } else {
        // 다른 모델들은 기본 이미지 변환 API 사용
        if (!imageKey) {
          throw new UserFacingError('이미지 변환에 필요한 원본 이미지가 없습니다');
        }
        
        result = await generateImageWithImage(
          prompt, 
          imageKey, 
          strength,
          imageWidth,
          imageHeight,
          true // 메타데이터 저장
        );
      }
      
      if (!result || !result.imageUrl) {
        throw new Error('이미지 변환에 실패했습니다');
      }
      
      // 4. 생성된 이미지 정보 저장
      startProcess('saving');
      const uploadResult = await uploadToPermanentStorage(
        result.imageUrl,
        result.id?.toString() || `temp-${Date.now()}`,
        imageWidth,
        imageHeight
      );
      
      if (!uploadResult.success || !uploadResult.url) {
        throw new Error('이미지 저장에 실패했습니다');
      }
      
      // 5. 완료 콜백 호출
      setSuccess();
      onGenerationComplete(
        uploadResult.url,
        uploadResult.id || String(Date.now()),
        uploadResult.thumbnailUrl || undefined
      );
      
    } catch (error) {
      console.error('이미지 변환 오류:', error);
      handleError(error);
    }
  };
  
  // 이미지 크기 설정 UI (로컬 스토리지 저장 부분 추가)
  const renderSizeSettings = () => (
    <div className="space-y-2">
      <Label className="text-lg font-medium">이미지 크기</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Select
            value={String(imageWidth)}
            onValueChange={handleWidthChange}
          >
            <p className="text-xs text-gray-400">너비</p>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="너비" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="512">512px</SelectItem>
              <SelectItem value="768">768px</SelectItem>
              <SelectItem value="1024">1024px</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <Select
            value={String(imageHeight)}
            onValueChange={handleHeightChange}
          >
            <p className="text-xs text-gray-400">높이</p>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="높이" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="512">512px</SelectItem>
              <SelectItem value="768">768px</SelectItem>
              <SelectItem value="1024">1024px</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 모델 선택 */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">변환 모델 선택</Label>
        <Select 
          value={selectedModelId} 
          onValueChange={handleModelChange}
        >
          <SelectTrigger className="w-full bg-neutral-800 border-neutral-700">
            <SelectValue placeholder="모델 선택" />
          </SelectTrigger>
          <SelectContent className="bg-neutral-800 border-neutral-700">
            {IMAGE_MODELS.map((model) => (
              <SelectItem 
                key={model.id} 
                value={model.id}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col">
                  <span>{model.name}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
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
          <Label className="text-sm font-medium">원본 이미지 (변환할 이미지)</Label>
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
            {status === 'uploading' && '이미지 업로드 중...'}
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