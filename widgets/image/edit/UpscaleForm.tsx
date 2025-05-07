'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/widgets/elements/sub/button';
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import { CustomLabel } from '@/widgets/elements/custom-label';
import { Loader2, ZoomIn, Download, RefreshCw, Upload } from 'lucide-react';
import { CustomSlider } from '@/widgets/elements/custom-slider';
import { toast } from 'sonner';
import { EditModel, filterEditModelsByCategory } from '@/shared/models/image/editModels';
import { generateImageWithUpscale } from '@/app/(tabs)/image/actions';
import { 
  ReactCompareSlider, 
  ReactCompareSliderImage,
  ReactCompareSliderHandle
} from 'react-compare-slider';

// 컴포넌트 props 정의
interface UpscaleFormProps {
  selectedImage: {
    url: string;
    id?: string | number;
    prompt?: string;
  } | null;
  onImageEdited: (imageUrl: string, imageId?: string | number) => void;
}

export default function UpscaleForm({ selectedImage, onImageEdited }: UpscaleFormProps) {
  // 편집 중인지 여부
  const [isEditing, setIsEditing] = useState(false);
  // 업스케일 배율
  const [scale, setScale] = useState(4);
  // 로딩 진행률 상태
  const [progress, setProgress] = useState(0);
  // 진행률 타이머 참조
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  // 업스케일링 결과 이미지 URL
  const [resultImageUrl, setResultImageUrl] = useState<string | null>(null);
  // 로컬 이미지 (직접 업로드한 경우)
  const [localImage, setLocalImage] = useState<string | null>(null);
  // 파일 입력 참조
  const fileInputRef = useRef<HTMLInputElement>(null);
  // 드래그 중인지 여부
  const [isDragging, setIsDragging] = useState(false);
  
  // 업스케일 모델 정보 (현재는 하나지만 확장성 고려)
  const [upscaleModels, setUpscaleModels] = useState<EditModel[]>([]);
  const selectedModel = "nightmareai/real-esrgan";

  // 원본 이미지 크기와 추정 결과 크기
  const [originalSize, setOriginalSize] = useState({ width: 0, height: 0 });
  const [resultSize, setResultSize] = useState({ width: 0, height: 0 });

  // 실제 사용할 이미지 URL (로컬 이미지 또는 선택된 이미지)
  const effectiveImageUrl = localImage || (selectedImage?.url || null);

  // 컴포넌트 마운트 시 업스케일 모델 목록 로드
  useEffect(() => {
    // 업스케일 카테고리의 모델만 필터링
    const models = filterEditModelsByCategory('upscale');
    setUpscaleModels(models);
  }, []);

  // 로딩 진행률 시뮬레이션 시작
  const startProgressSimulation = useCallback(() => {
    // 이전 타이머가 있다면 정리
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
    }
    
    setProgress(0);
    
    // 진행률을 점진적으로 증가시키는 타이머 설정
    // 실제 업로드 진행 상황과는 관계없이 사용자에게 진행 중임을 보여주기 위한 시각적 피드백
    progressTimerRef.current = setInterval(() => {
      setProgress(prev => {
        // 진행률이 85%에 도달하면 더 이상 증가하지 않음 (실제 완료 시 100%로 설정됨)
        if (prev >= 85) {
          return prev;
        }
        // 처음에는 빠르게, 나중에는 느리게 증가
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
    // 작업 완료 시 진행률을 100%로 설정
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

  // 이미지가 변경되거나 스케일이 변경될 때 크기 업데이트
  useEffect(() => {
    if (effectiveImageUrl) {
      const img = new Image();
      img.onload = () => {
        setOriginalSize({ width: img.width, height: img.height });
        setResultSize({
          width: Math.round(img.width * scale),
          height: Math.round(img.height * scale)
        });
      };
      img.src = effectiveImageUrl;
    }
  }, [effectiveImageUrl, scale]);

  // 파일 크기 계산 (예상)
  const calculateEstimatedFileSize = useCallback(() => {
    const baseSize = (originalSize.width * originalSize.height * 4) / (1024 * 1024); // MB 단위, 4 bytes per pixel (RGBA)
    const scaledSize = baseSize * scale * scale;
    return scaledSize.toFixed(1);
  }, [originalSize.width, originalSize.height, scale]);

  // 업스케일 처리 함수
  const handleUpscale = async () => {
    if (!effectiveImageUrl) {
      toast.error('이미지가 선택되지 않았습니다.');
      return;
    }
    
    try {
      setIsEditing(true);
      startProgressSimulation();
      
      toast.info('업스케일링을 시작합니다...', {
        duration: 2000,
      });
      
      // 업스케일 API 호출
      const result = await generateImageWithUpscale({
        image: effectiveImageUrl,
        scale: scale
      });
      
      stopProgressSimulation();
      
      if (result.success && result.imageUrl) {
        toast.success('업스케일링이 완료되었습니다!');
        setResultImageUrl(result.imageUrl);
        onImageEdited(result.imageUrl, result.id || undefined);
      } else {
        toast.error(`업스케일링 실패: ${result.error || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      stopProgressSimulation();
      console.error('업스케일링 오류:', error);
      toast.error(`업스케일링 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsEditing(false);
    }
  };

  // 결과 이미지 다운로드
  const handleDownload = useCallback(async () => {
    if (!resultImageUrl) return;
    
    try {
      // 다운로드 시작 표시
      toast.info('이미지 다운로드 준비 중...');
      
      // fetch로 이미지 가져오기
      const response = await fetch(resultImageUrl);
      if (!response.ok) throw new Error('이미지 다운로드 실패');
      
      // blob으로 변환
      const blob = await response.blob();
      
      // 로컬 URL 생성
      const blobUrl = URL.createObjectURL(blob);
      
      // 다운로드 링크 생성 및 클릭
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `upscaled-${scale}x-${Date.now()}.png`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      
      // 정리
      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      }, 100);
      
      toast.success('이미지 다운로드가 시작되었습니다');
    } catch (error) {
      console.error('다운로드 오류:', error);
      toast.error('이미지 다운로드 중 오류가 발생했습니다');
      
      // 다운로드 실패 시 새 탭에서 열기 (대체 방법)
      window.open(resultImageUrl, '_blank');
    }
  }, [resultImageUrl, scale]);

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
    
    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하의 이미지만 업로드 가능합니다');
      return;
    }
    
    // 선택한 파일로 로컬 이미지 URL 생성
    const imageUrl = URL.createObjectURL(file);
    setLocalImage(imageUrl);
    setResultImageUrl(null); // 새 이미지를 선택하면 결과 초기화
    
    toast.success('이미지가 업로드되었습니다');
    
    // 파일 입력 초기화 (같은 파일 다시 선택 가능하도록)
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
    
    // 이미지 타입 체크
    if (!file.type.startsWith('image/')) {
      toast.error('이미지 파일만 업로드 가능합니다');
      return;
    }
    
    // 파일 크기 체크 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      toast.error('10MB 이하의 이미지만 업로드 가능합니다');
      return;
    }
    
    // 드롭한 파일로 로컬 이미지 URL 생성
    const imageUrl = URL.createObjectURL(file);
    setLocalImage(imageUrl);
    setResultImageUrl(null); // 새 이미지를 선택하면 결과 초기화
    
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
      
      {/* 이미지 미리보기 영역 - 상단에 배치 */}
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
                        <ReactCompareSliderImage src={resultImageUrl} alt="업스케일링 결과" />
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
                        <ZoomIn className="w-3 h-3" />
                        {scale}x 업스케일링 적용 예정
                      </span>
                    </div>
                  </div>
                  
                  {/* 이미지가 있을 때도 새 이미지 업로드 버튼 표시 */}
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
            원본 이미지를 더 높은 해상도로 변환합니다. 
          </div>
        </CustomCardContent>
      </CustomCard>

      {/* 컨트롤 패널 - 하단에 배치 */}
      <CustomCard className="border-none w-full">
        <CustomCardContent className="p-2">
          <div className="w-full mx-auto space-y-4">
            <div>
              <CustomLabel className="text-md pb-4">업스케일 배율</CustomLabel>
              <CustomSlider
                min={2}
                max={10}
                step={1}
                value={[scale]}
                onValueChange={(value) => setScale(value[0])}
                disabled={isEditing}
              />
              <div className="flex justify-between text-md text-muted-foreground mt-1">
                <span>2x</span>
                <span>{scale}x</span>
                <span>10x</span>
              </div>
            </div>

            <div className="mt-4">
              <h3 className="text-sm font-medium mb-2">이미지 정보</h3>
              <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-md">
                <p>원본 크기: {originalSize.width} x {originalSize.height} 픽셀</p>
                <p>변환 후 예상 크기: {resultSize.width} x {resultSize.height} 픽셀</p>
                <p>확대 비율: {scale}x ({scale * scale}배 증가)</p>
              </div>
            </div>

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
                onClick={resultImageUrl ? handleDownload : effectiveImageUrl ? handleUpscale : handleOpenFileSelector} 
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
                    <ZoomIn className="mr-2 h-4 w-4" />
                    {scale}x 업스케일 적용
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
