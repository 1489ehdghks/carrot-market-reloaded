"use client";

import { useRef, useState, useCallback, useMemo } from "react";
import { generateImageWithImage } from "../actions";
import { Loader2, Wand2, ChevronsUpDown } from "lucide-react";
import { useImageUpload } from "../hooks/useImageUpload";
import { useFormStatusManager } from "../hooks/useFormStatusManager";
import { useCloudflareUpload } from "../hooks/useCloudflareUpload";
import { handleGlobalError, UserFacingError } from "@/app/lib/error-handling";
import PromptTextarea from "./PromptTextarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { IMAGE_MODELS, getImageModelById } from "../data/imageModels";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { CollapsiblePanel } from "./CollapsiblePanel";

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
  const [selectedModelId, setSelectedModelId] = useState<string>("styleTransfer");
  const [config, setConfig] = useState<Record<string, any>>({});
  
  // InstantID 관련 상태
  const [faceImageFile, setFaceImageFile] = useState<File | null>(null);
  const [faceImagePreview, setFaceImagePreview] = useState<string | null>(null);
  const faceImageRef = useRef<HTMLInputElement>(null);
  
  // 기본 이미지 크기
  const [imageWidth, setImageWidth] = useState<number>(768);
  const [imageHeight, setImageHeight] = useState<number>(768);
  
  // 선택된 모델 정보
  const selectedModel = useMemo(() => {
    return getImageModelById(selectedModelId) || IMAGE_MODELS[0];
  }, [selectedModelId]);
  
  // 모델 선택 핸들러
  const handleModelChange = (modelId: string) => {
    setSelectedModelId(modelId);
    
    // 선택된 모델의 기본 설정으로 초기화
    const newModel = getImageModelById(modelId);
    if (newModel?.configOptions) {
      const defaultConfig: Record<string, any> = {};
      Object.entries(newModel.configOptions).forEach(([key, optionConfig]) => {
        defaultConfig[key] = optionConfig.default;
      });
      setConfig(defaultConfig);
    } else {
      setConfig({});
    }
  };
  
  // 설정 변경 핸들러
  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
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
      
      if (!imageFile) {
        throw new UserFacingError('이미지를 업로드해주세요');
      }
      
      if (selectedModelId === 'instantId' && !faceImageFile) {
        throw new UserFacingError('InstantID 모델을 사용하려면 얼굴 참조 이미지가 필요합니다');
      }
      
      // 생성 시작
      onGenerationStart();
      startProcess('uploading');
      
      // 1. 이미지 업로드 진행
      const imageKey = await prepareImageUpload(imageFile);
      
      // 2. InstantID 모델을 위한 얼굴 이미지 업로드 (필요한 경우)
      let faceImageKey = null;
      if (selectedModelId === 'instantId' && faceImageFile) {
        faceImageKey = await prepareImageUpload(faceImageFile);
      }
      
      // 3. API 요청 준비
      startProcess('generating');
      
      // 모델별 API 요청 구현
      let result;
      
      if (selectedModelId === 'instantId') {
        // InstantID 모델은 별도의 API 엔드포인트 사용
        const instantIdResponse = await fetch('/api/image-to-image/instant-id', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            prompt: prompt,
            negative_prompt: negativePrompt,
            image_url: imageKey,
            face_image_url: faceImageKey,
            ip_adapter_scale: config.ip_adapter_scale || 0.8,
            enhance_face_region: config.enhance_face_region || true,
            width: config.width || imageWidth,
            height: config.height || imageHeight,
            num_inference_steps: config.num_inference_steps || 30,
            guidance_scale: config.guidance_scale || 5.0,
            seed: config.seed || -1
          }),
        });
        
        if (!instantIdResponse.ok) {
          const errorData = await instantIdResponse.json();
          throw new Error(errorData.error || 'InstantID 이미지 변환에 실패했습니다');
        }
        
        result = await instantIdResponse.json();
      } else {
        // 다른 모델들은 기본 이미지 변환 API 사용
        result = await generateImageWithImage(
          prompt,
          imageKey,
          strength,
          imageWidth,
          imageHeight
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
  
  // 모델별 설정 필드 렌더링
  const renderConfigField = (key: string, fieldConfig: any) => {
    const value = config[key] !== undefined ? config[key] : fieldConfig.default;
    
    switch (fieldConfig.type) {
      case 'number':
        return (
          <div className="space-y-2" key={key}>
            <div className="flex justify-between">
              <Label className="text-sm font-medium">
                {fieldConfig.name}
              </Label>
              <span className="text-sm text-gray-400">
                {value}
              </span>
            </div>
            <Slider
              value={[value]}
              min={fieldConfig.min || 0}
              max={fieldConfig.max || 100}
              step={fieldConfig.step || 1}
              onValueChange={([val]) => handleConfigChange(key, val)}
              className="w-full"
            />
            <p className="text-xs text-gray-400 mt-1">
              {fieldConfig.description}
            </p>
          </div>
        );
        
      case 'select':
        return (
          <div className="space-y-2" key={key}>
            <Label className="text-sm font-medium">
              {fieldConfig.name}
            </Label>
            <Select
              value={String(value)}
              onValueChange={(val) => handleConfigChange(key, val)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={fieldConfig.name} />
              </SelectTrigger>
              <SelectContent>
                {fieldConfig.options?.map((option: any) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400 mt-1">
              {fieldConfig.description}
            </p>
          </div>
        );
        
      case 'boolean':
        return (
          <div className="flex items-center justify-between" key={key}>
            <div className="space-y-1">
              <Label className="text-sm font-medium">
                {fieldConfig.name}
              </Label>
              <p className="text-xs text-gray-400">
                {fieldConfig.description}
              </p>
            </div>
            <Switch
              checked={Boolean(value)}
              onCheckedChange={(checked) => handleConfigChange(key, checked)}
            />
          </div>
        );
        
      default:
        return null;
    }
  };
  
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
                  <span className="text-xs text-gray-400">{model.description}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        {/* 선택된 모델 정보 */}
        <div className="mt-2 p-3 bg-neutral-900 rounded-lg border border-neutral-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium">{selectedModel.name}</h3>
            <div className="flex items-center space-x-2">
              <CustomTooltip title="모델 품질"
                description="높을수록 더 좋은 품질의 이미지를 생성할 수 있습니다."
              >
                <div className="px-2 py-1 bg-orange-800/30 rounded text-xs">
                  품질: {selectedModel.features.quality}
                </div>
              </CustomTooltip>
              
              <CustomTooltip title="처리 속도" 
                description="빠를수록 이미지 생성 시간이 단축됩니다."
              >
                <div className="px-2 py-1 bg-blue-800/30 rounded text-xs">
                  속도: {selectedModel.features.speed}
                </div>
              </CustomTooltip>
            </div>
          </div>
          <p className="text-sm text-gray-400">{selectedModel.description}</p>
        </div>
      </div>
      
      {/* 이미지 업로드 영역 */}
      <div className="w-full aspect-square bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="변환할 이미지" 
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => clearImage()}
              className="absolute bottom-3 right-3 bg-neutral-800 p-2 rounded-lg text-white text-xs hover:bg-neutral-700"
            >
              이미지 변경
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">이미지 업로드</h3>
            <p className="text-sm text-neutral-400 mb-4">변환하고 싶은 이미지를 업로드해주세요</p>
            <button
              type="button"
              onClick={() => document.getElementById('image-input')?.click()}
              className="px-4 py-2 bg-neutral-800 rounded-lg text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              이미지 선택
            </button>
          </div>
        )}
        <input
          type="file"
          id="image-input"
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* 프롬프트 입력 영역 */}
      <PromptTextarea 
        prompt={prompt}
        negativePrompt={negativePrompt}
        onPromptChange={setPrompt}
        onNegativePromptChange={setNegativePrompt}
        promptTokenLimit={1500}
        negativeTokenLimit={500}
        className="bg-neutral-800 rounded-lg"
      />
      
      {/* 기본 설정 */}
      <div className="space-y-2">
        <div className="flex justify-between">
          <Label className="text-sm font-medium">변형 강도</Label>
          <span className="text-sm text-gray-400">{strength}</span>
        </div>
        <Slider
          value={[strength]}
          min={0}
          max={1}
          step={0.05}
          onValueChange={([val]) => setStrength(val)}
          className="w-full"
        />
        <p className="text-xs text-gray-400 mt-1">
          값이 클수록 원본 이미지에서 더 크게 변형됩니다. 0에 가까울수록 원본과 유사하고, 1에 가까울수록 프롬프트에 따라 완전히 새로운 이미지가 생성됩니다.
        </p>
      </div>
      
      {/* InstantID 모델일 경우 얼굴 참조 이미지 업로드 */}
      {selectedModelId === 'instantId' && (
        <div className="space-y-2 border border-neutral-800 rounded-lg p-4 bg-neutral-900/50">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">얼굴 참조 이미지</Label>
            <CustomTooltip 
              title="얼굴 참조 이미지"
              description="변환된 이미지에 적용할 얼굴 특성이 담긴 이미지를 업로드하세요. 얼굴이 잘 보이는 정면 사진이 좋습니다."
            >
              <div className="text-xs text-gray-400 cursor-help">도움말</div>
            </CustomTooltip>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-24 h-24 bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden">
              {faceImagePreview ? (
                <img 
                  src={faceImagePreview} 
                  alt="얼굴 참조 이미지" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
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
                  얼굴 이미지 선택
                </Button>
              )}
              <p className="text-xs text-gray-400">
                얼굴이 선명하게 보이는 정면 사진을 사용하세요
              </p>
            </div>
            <input
              type="file"
              ref={faceImageRef}
              onChange={handleFaceImageUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>
      )}
      
      {/* 고급 설정 패널 */}
      <CollapsiblePanel title="고급 설정" defaultOpen={false}>
        <div className="space-y-6 p-4">
          {/* 이미지 크기 설정 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">너비</Label>
              <Select
                value={String(imageWidth)}
                onValueChange={(val) => setImageWidth(Number(val))}
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
            </div>
            
            <div className="space-y-2">
              <Label className="text-sm font-medium">높이</Label>
              <Select
                value={String(imageHeight)}
                onValueChange={(val) => setImageHeight(Number(val))}
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
            </div>
          </div>
          
          {/* 모델별 설정 */}
          {selectedModel?.configOptions && Object.entries(selectedModel.configOptions).map(([key, fieldConfig]) => 
            renderConfigField(key, fieldConfig)
          )}
        </div>
      </CollapsiblePanel>
      
      {/* 변환 버튼 */}
      <Button 
        type="submit"
        disabled={isProcessing || !imageFile || (selectedModelId === 'instantId' && !faceImageFile)}
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