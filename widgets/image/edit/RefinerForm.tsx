'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/widgets/elements/sub/button';
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import { CustomLabel } from '@/widgets/elements/custom-label';
import { Loader2, Download, RefreshCw, Upload } from 'lucide-react';
import { CustomSlider } from '@/widgets/elements/custom-slider';
import { toast } from 'sonner';
import { EditModel, filterEditModelsByCategory, getEditModelById } from '@/shared/models/image/editModels';
import { generateImageWithRefiner } from '@/app/(tabs)/image/actions';
import { 
  ReactCompareSlider, 
  ReactCompareSliderImage,
  ReactCompareSliderHandle
} from 'react-compare-slider';
import PromptTextarea from '../shared/PromptTextarea';
import { ModelSelector } from '@/widgets/shared/custom-ModelSelector-sm';

// 컴포넌트 props 정의
interface RefinerFormProps {
  selectedImage: {
    url: string;
    id?: string | number;
    prompt?: string;
  } | null;
  onImageEdited: (imageUrl: string, imageId?: string | number) => void;
}

export default function RefinerForm({ selectedImage, onImageEdited }: RefinerFormProps) {
  // 편집 중인지 여부
  const [isEditing, setIsEditing] = useState(false);
  // 로딩 진행률 상태
  const [progress, setProgress] = useState(0);
  // 진행률 타이머 참조
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 리파이닝 결과 이미지 URL
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  // 로컬 이미지 (직접 업로드한 경우)
  const [localImage, setLocalImage] = useState<string | null>(null);
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 드래그 중인지 여부
  const [isDragging, setIsDragging] = useState(false);
  
  // 프롬프트 상태
  const [prompt, setPrompt] = useState('');
  const [negativePrompt, setNegativePrompt] = useState('');
  const [resemblance, setResemblance] = useState(0.6);
  const [guidanceScale, setGuidanceScale] = useState(4);
  const [scheduler, setScheduler] = useState('DDIM');
  const [selectedModel, setSelectedModel] = useState<string>("fermatresearch/magic-image-refiner");
  const [refinerModels, setRefinerModels] = useState<EditModel[]>([]);
  
  // 추가 옵션 상태
  const [creativity, setCreativity] = useState(0.35);
  const [sdModel, setSdModel] = useState<string>("epicrealism_naturalSinRC1VAE.safetensors [84d76a0328]");
  
  // 선택된 모델 정보
  const [modelConfig, setModelConfig] = useState<any>(null);

  // 실제 사용할 이미지 URL (로컬 이미지 또는 선택된 이미지)
  const effectiveImageUrl = localImage || (selectedImage?.url || null);

  // 모델 변경 시 처리
  const handleModelChange = (modelId: string) => {
    setSelectedModel(modelId);
    const model = getEditModelById(modelId);
    
    if (model) {
      setModelConfig(model.configOptions || {});
      
      // 기본값으로 설정
      if (model.configOptions) {
        if (model.configOptions.resemblance && model.configOptions.resemblance.default !== undefined) {
          setResemblance(model.configOptions.resemblance.default as number);
        }
        
        if (model.configOptions.guidance_scale && model.configOptions.guidance_scale.default !== undefined) {
          setGuidanceScale(model.configOptions.guidance_scale.default as number);
        }
        
        if (model.configOptions.scheduler && model.configOptions.scheduler.default !== undefined) {
          setScheduler(model.configOptions.scheduler.default as string);
        }
        
        if (model.configOptions.creativity && model.configOptions.creativity.default !== undefined) {
          setCreativity(model.configOptions.creativity.default as number);
        }
        
        if (model.configOptions.sd_model && model.configOptions.sd_model.default !== undefined) {
          setSdModel(model.configOptions.sd_model.default as string);
        }
        
        // 프롬프트 기본값 설정 (clarity-refiner에만 있음)
        if (model.id === 'philz1337x/clarity-upscaler') {
          if (model.configOptions.prompt && model.configOptions.prompt.default !== undefined) {
            setPrompt(model.configOptions.prompt.default as string);
          }
          
          if (model.configOptions.negative_prompt && model.configOptions.negative_prompt.default !== undefined) {
            setNegativePrompt(model.configOptions.negative_prompt.default as string);
          }
        }
      }
    }
  };

  // 컴포넌트 마운트 시 프롬프트 로드
  useEffect(() => {
    const savedPrompt = localStorage.getItem('refinerPrompt');
    const savedNegativePrompt = localStorage.getItem('refinerNegativePrompt');
    
    if (!savedPrompt) {
      setPrompt('UHD 4k vogue');
    } else {
      setPrompt(savedPrompt);
    }
    
    if (!savedNegativePrompt) {
      setNegativePrompt('teeth, tooth, open mouth, longbody, lowres, bad anatomy, bad hands, missing fingers, extra digit, fewer digits, cropped, worst quality, low quality, mutant');
    } else {
      setNegativePrompt(savedNegativePrompt);
    }
  }, []);

  // 컴포넌트 마운트 시 리파이너 모델 목록 로드
  useEffect(() => {
    // 리파이너 카테고리의 모델만 필터링
    const models = filterEditModelsByCategory('refiner');
    setRefinerModels(models);
    
    // 초기 모델 설정
    if (models.length > 0) {
      const defaultModel = models.find(m => m.id === selectedModel) || models[0];
      handleModelChange(defaultModel.id);
    }
  }, []);

  // 로딩 진행률 시뮬레이션 시작
  const startProgressSimulation = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    setProgress(0);
    
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        if (prev >= 85) return prev;
        const increment = prev < 30 ? 5 : prev < 60 ? 3 : 1;
        return prev + increment;
      });
    }, 600);
  }, []);

  // 진행률 시뮬레이션 정지
  const stopProgressSimulation = useCallback(() => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
    setProgress(100);
  }, []);

  // 컴포넌트 언마운트 시 타이머 정리
  useEffect(() => {
    return () => {
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };
  }, []);

  // 리파이닝 처리 함수
  const handleRefine = async () => {
    if (!effectiveImageUrl) {
      toast.error('이미지가 선택되지 않았습니다.');
      return;
    }
    
    try {
      setIsEditing(true);
      startProgressSimulation();
      
      // 프롬프트 저장
      localStorage.setItem('refinerPrompt', prompt);
      localStorage.setItem('refinerNegativePrompt', negativePrompt);
      
      toast.info('리파이닝을 시작합니다...', {
        duration: 2000,
      });
      
      // 모델에 따른 매개변수 구성
      const params: any = {
        image: effectiveImageUrl,
        prompt,
        negativePrompt,
        model: selectedModel
      };
      
      // 모델별 추가 매개변수
      if (selectedModel === 'fermatresearch/magic-image-refiner') {
        params.resemblance = resemblance;
        params.guidanceScale = guidanceScale;
        params.scheduler = scheduler;
      } else if (selectedModel === 'philz1337x/clarity-upscaler') {
        params.resemblance = resemblance;
        params.guidanceScale = guidanceScale;
        params.scheduler = scheduler;
        params.creativity = creativity;
        params.sdModel = sdModel;
      }
      
      // 리파이닝 API 호출
      const result = await generateImageWithRefiner(params);
      
      stopProgressSimulation();
      
      if (result.success && result.imageUrl) {
        toast.success('리파이닝이 완료되었습니다!');
        setResultImageUrl(result.imageUrl);
        onImageEdited(result.imageUrl, result.id || undefined);
      } else {
        toast.error(`리파이닝 실패: ${result.error || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      stopProgressSimulation();
      console.error('리파이닝 오류:', error);
      toast.error(`리파이닝 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsEditing(false);
    }
  };

  // 결과 이미지 다운로드
  const handleDownload = useCallback(async () => {
    if (!resultImageUrl) return;
    
    try {
      toast.info('이미지 다운로드 준비 중...');
      
      const response = await fetch(resultImageUrl);
      if (!response.ok) throw new Error('이미지 다운로드 실패');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `refined-${Date.now()}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success('이미지 다운로드가 시작되었습니다');
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('이미지 다운로드 중 오류가 발생했습니다');
      window.open(resultImageUrl, '_blank');
    }
  }, [resultImageUrl]);

  // 초기화 함수
  const handleReset = useCallback(() => {
    setResultImageUrl(null);
    setProgress(0);
    toast.info('초기화되었습니다');
  }, []);

  // 파일 선택 창 열기
  const handleOpenFileSelector = useCallback(() => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  // 이미지 파일 선택 처리
  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하의 이미지만 업로드 가능합니다');
      return;
    }
    
    const imageUrl = URL.createObjectURL(file);
    setLocalImage(imageUrl);
    setResultImageUrl(null);
    
    toast.success('이미지가 업로드되었습니다');
    
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  // 드래그 이벤트 핸들러
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);
  
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하의 이미지만 업로드 가능합니다');
      return;
    }
    
    const imageUrl = URL.createObjectURL(file);
    setLocalImage(imageUrl);
    setResultImageUrl(null);
    
    toast.success('이미지가 업로드되었습니다');
  }, []);

  return (
    <div className="space-y-4">
      {/* 숨겨진 파일 입력 필드 */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/*"
        onChange={handleFileChange}
      />

      {/* 모델 선택기 추가 */}
      <ModelSelector
        models={refinerModels}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
        label="Refiner Model"
      />
      
      {/* 이미지 미리보기 영역 */}
      <CustomCard className="border-none w-3/4 mx-auto">
        <CustomCardContent className="p-4 flex flex-col">
          {effectiveImageUrl ? (
            <div className="relative rounded-md overflow-hidden max-w-full">
              {resultImageUrl ? (
                // Before/After 비교 슬라이더
                <div className="relative">
                  <ReactCompareSlider
                    itemOne={
                      <div className="relative">
                        <ReactCompareSliderImage src={effectiveImageUrl} alt="원본 이미지" />
                        <div className="absolute top-4 left-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
                          Before
                        </div>
                      </div>
                    }
                    itemTwo={
                      <div className="relative">
                        <ReactCompareSliderImage src={resultImageUrl} alt="리파이닝 결과" />
                        <div className="absolute top-4 right-4 bg-black/70 text-white px-3 py-1 rounded-md text-sm font-medium">
                          After
                        </div>
                      </div>
                    }
                    handle={
                      <ReactCompareSliderHandle
                        buttonStyle={{
                          backdropFilter: 'blur(4px)',
                          background: 'white',
                          border: 0,
                          color: '#333'
                        }}
                      />
                    }
                    className="rounded-md"
                  />
                  <div className="absolute bottom-4 right-4 flex gap-2">
                    <Button 
                      size="sm" 
                      onClick={handleReset}
                      className="bg-black/70 hover:bg-black/90"
                    >
                      <RefreshCw className="w-4 h-4 mr-1" />
                      초기화
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleDownload}
                      className="bg-black/70 hover:bg-black/90"
                    >
                      <Download className="w-4 h-4 mr-1" />
                      다운로드
                    </Button>
                  </div>
                </div>
              ) : (
                // 원본 이미지만 표시
                <>
                  <img 
                    src={effectiveImageUrl} 
                    alt="원본 이미지" 
                    className="w-full h-auto"
                  />
                  
                  <div className="absolute inset-0 bg-gradient-to-tr from-black/70 via-transparent to-transparent p-4 flex flex-col justify-end">
                    <div className="text-white text-xs">
                      <span className="bg-black/70 px-2 py-1 rounded flex items-center gap-1">
                        리파이닝 적용 예정
                      </span>
                    </div>
                  </div>
                  
                  <div className="absolute top-4 right-4">
                    <Button 
                      size="sm" 
                      onClick={handleOpenFileSelector}
                      className="bg-black/70 hover:bg-black/90"
                    >
                      <Upload className="w-4 h-4 mr-1" />
                      새 이미지
                    </Button>
                  </div>
                </>
              )}
              
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col">
                  <Loader2 className="h-8 w-8 animate-spin text-white mb-2" />
                  <div className="text-white text-sm font-medium">처리 중... {progress}%</div>
                  <div className="w-3/4 mt-2 bg-gray-700 rounded-full h-2.5">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            // 이미지가 없을 때 업로드 영역 표시
            <div 
              className={`bg-muted rounded-md p-8 w-full h-64 flex flex-col items-center justify-center cursor-pointer border-2 border-dashed transition-colors ${isDragging ? 'border-primary bg-primary/10' : 'border-muted-foreground/20'}`}
              onClick={handleOpenFileSelector}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              <Upload className="w-10 h-10 text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-center mb-2">
                이미지를 드래그하거나 클릭하여 업로드하세요
              </p>
              <p className="text-xs text-muted-foreground/70 text-center">
                최대 10MB, JPG, PNG, WebP 형식 지원
              </p>
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-4 text-center max-w-md">
            이미지의 품질을 개선하고 세부 사항을 향상시킵니다.
          </div>
        </CustomCardContent>
      </CustomCard>

      {/* 컨트롤 패널 */}
      <CustomCard className="border-none w-full">
        <CustomCardContent className="p-2">
          <div className="w-full mx-auto space-y-4">
            {/* 프롬프트 입력 영역 - 커스텀 컴포넌트 사용 */}
            <PromptTextarea 
              prompt={prompt}
              negativePrompt={negativePrompt}
              onPromptChange={(value) => {
                setPrompt(value);
              }}
              onNegativePromptChange={(value) => {
                setNegativePrompt(value);
              }}
              promptTokenLimit={1500}
              negativeTokenLimit={500}
            />

            {/* 모델별 설정 옵션 */}
            {modelConfig && (
              <>
                {/* 공통 옵션: resemblance */}
                {modelConfig.resemblance && (
                  <div>
                    <CustomLabel className="text-md pb-2">{modelConfig.resemblance.name || '원본 유사도'}</CustomLabel>
                    <CustomSlider
                      min={modelConfig.resemblance.min || 0}
                      max={modelConfig.resemblance.max || 1}
                      step={modelConfig.resemblance.step || 0.1}
                      value={[resemblance]}
                      onValueChange={(value) => setResemblance(value[0])}
                      disabled={isEditing}
                    />
                    <div className="flex justify-between text-md text-muted-foreground mt-1">
                      <span>{modelConfig.resemblance.min || 0}</span>
                      <span>{resemblance.toFixed(1)}</span>
                      <span>{modelConfig.resemblance.max || 1}</span>
                    </div>
                  </div>
                )}

                {/* 공통 옵션: guidance_scale */}
                {modelConfig.guidance_scale && (
                  <div>
                    <CustomLabel className="text-md pb-2">{modelConfig.guidance_scale.name || '가이던스 스케일'}</CustomLabel>
                    <CustomSlider
                      min={modelConfig.guidance_scale.min || 1}
                      max={modelConfig.guidance_scale.max || 10}
                      step={modelConfig.guidance_scale.step || 0.1}
                      value={[guidanceScale]}
                      onValueChange={(value) => setGuidanceScale(value[0])}
                      disabled={isEditing}
                    />
                    <div className="flex justify-between text-md text-muted-foreground mt-1">
                      <span>{modelConfig.guidance_scale.min || 1}</span>
                      <span>{guidanceScale.toFixed(1)}</span>
                      <span>{modelConfig.guidance_scale.max || 10}</span>
                    </div>
                  </div>
                )}

                {/* clarity-upscaler 전용: creativity */}
                {selectedModel === 'philz1337x/clarity-upscaler' && modelConfig.creativity && (
                  <div>
                    <CustomLabel className="text-md pb-2">{modelConfig.creativity.name || '창의성'}</CustomLabel>
                    <CustomSlider
                      min={modelConfig.creativity.min || 0.01}
                      max={modelConfig.creativity.max || 1}
                      step={modelConfig.creativity.step || 0.01}
                      value={[creativity]}
                      onValueChange={(value) => setCreativity(value[0])}
                      disabled={isEditing}
                    />
                    <div className="flex justify-between text-md text-muted-foreground mt-1">
                      <span>{modelConfig.creativity.min || 0.01}</span>
                      <span>{creativity.toFixed(2)}</span>
                      <span>{modelConfig.creativity.max || 1}</span>
                    </div>
                  </div>
                )}

                {/* clarity-upscaler 전용: sd_model */}
                {selectedModel === 'philz1337x/clarity-upscaler' && modelConfig.sd_model && (
                  <div>
                    <CustomLabel className="text-md pb-2">{modelConfig.sd_model.name || 'SD 모델'}</CustomLabel>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={sdModel}
                      onChange={(e) => setSdModel(e.target.value)}
                      disabled={isEditing}
                    >
                      {modelConfig.sd_model.options && modelConfig.sd_model.options.map((option: any) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* 공통 옵션: scheduler */}
                {modelConfig.scheduler && (
                  <div>
                    <CustomLabel className="text-md pb-2">{modelConfig.scheduler.name || '스케줄러'}</CustomLabel>
                    <select
                      className="w-full p-2 border rounded-md"
                      value={scheduler}
                      onChange={(e) => setScheduler(e.target.value)}
                      disabled={isEditing}
                    >
                      {modelConfig.scheduler.options && modelConfig.scheduler.options.map((option: any) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            <div className="flex gap-2">
              {resultImageUrl && (
                <Button 
                  onClick={handleReset} 
                  disabled={isEditing || !resultImageUrl} 
                  variant="outline"
                  className="flex-1"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  초기화
                </Button>
              )}
              
              <Button 
                onClick={resultImageUrl ? handleDownload : effectiveImageUrl ? handleRefine : handleOpenFileSelector} 
                disabled={isEditing || (resultImageUrl === null && effectiveImageUrl === null)} 
                className="flex-1"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : resultImageUrl ? (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    결과 다운로드
                  </>
                ) : effectiveImageUrl ? (
                  <>
                    리파이닝 적용
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    이미지 업로드
                  </>
                )}
              </Button>
            </div>
            
            <p className="text-xs text-muted-foreground mt-2 text-center">
              이미지 크기가 클수록 처리 시간이 길어집니다.
            </p>
          </div>
        </CustomCardContent>
      </CustomCard>
    </div>
  );
} 