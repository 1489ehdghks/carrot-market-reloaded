'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/widgets/elements/sub/button';
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import { CustomLabel } from '@/widgets/elements/custom-label';
import { CustomSlider } from '@/widgets/elements/custom-slider';
import { Loader2, PaintBucket, Eraser, Undo2, RotateCcw } from 'lucide-react';
import { generateImageWithInpainting } from '@/app/(tabs)/image/actions';
import { CustomInput } from '@/widgets/elements/custom-input';
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/widgets/elements/custom-select';
import { toast } from 'sonner';
import { EditModel, filterEditModelsByCategory } from '@/shared/models/image/editModels';
import PromptTextarea from '../shared/PromptTextarea';
import ModelSelector from '../shared/ModelSelector';

// 컴포넌트 props 정의
interface InpaintingFormProps {
  selectedImage: {
    url: string;
    id?: string | number;
    prompt?: string;
  } | null;
  onImageEdited: (imageUrl: string, imageId?: string | number) => void;
}

export default function InpaintingForm({ selectedImage, onImageEdited }: InpaintingFormProps) {
  // 편집 중인지 여부
  const [isEditing, setIsEditing] = useState(false);
  // 편집할 이미지 URL
  const [imageToEdit, setImageToEdit] = useState<string | null>(null);
  // 브러시 크기
  const [brushSize, setBrushSize] = useState(20);
  // 마스크 캔버스 참조
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  // 마스크 데이터 URL
  const [maskDataUrl, setMaskDataUrl] = useState<string | null>(null);
  // 실제 표시되는 캔버스 참조
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  // 그리기 모드 (그리기/지우기)
  const [drawMode, setDrawMode] = useState<'paint' | 'erase'>('paint');
  // 마우스 상태
  const [isDrawing, setIsDrawing] = useState(false);
  // 프롬프트 상태
  const [prompt, setPrompt] = useState<string>('');
  // 네거티브 프롬프트 상태
  const [negativePrompt, setNegativePrompt] = useState<string>('normal quality,worst quality, bad quality,panty,displeasing, lowres,bad finger,bad anatomy, bad perspective, bad proportions, bad aspect ratio, bad face, bad teeth, bad neck, bad arm, bad hands, bad ass, bad leg, bad feet, bad reflection, bad shadow, bad link, bad source, wrong hand, wrong feet, missing limb, missing eye, missing tooth, missing ear, missing finger, missing ear, extra faces, extra eyes, extra eyebrows, extra mouth, extra tongue, extra teeth, extra ears, extra breasts, extra arms, extra hands');
  // 마스크 히스토리
  const [maskHistory, setMaskHistory] = useState<string[]>([]);
  // 현재 히스토리 인덱스
  const [historyIndex, setHistoryIndex] = useState(-1);
  // 선택된 인페인팅 모델
  const [selectedModel, setSelectedModel] = useState<string>("realistic-vision-v5-inpainting");
  // 사용 가능한 인페인팅 모델 목록
  const [inpaintingModels, setInpaintingModels] = useState<EditModel[]>([]);

  // 컴포넌트 마운트 시 인페인팅 모델 목록 로드
  useEffect(() => {
    // 인페인팅 카테고리의 모델만 필터링
    const models = filterEditModelsByCategory('inpainting');
    setInpaintingModels(models);
  }, []);

  // 선택된 이미지가 변경되면 편집할 이미지 업데이트
  useEffect(() => {
    if (selectedImage?.url) {
      setImageToEdit(selectedImage.url);
      setPrompt(selectedImage.prompt || '');
    }
  }, [selectedImage]);

  // 캔버스 초기화 함수
  const initCanvas = () => {
    if (!imageToEdit || !canvasRef.current) return;
    
    // 캔버스 생성
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // 이미지 로드
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      // 캔버스 크기 설정
      canvas.width = img.width;
      canvas.height = img.height;
      
      // 투명 배경으로 초기화
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // 캔버스 표시
      const displayCanvas = canvasRef.current;
      if (displayCanvas) {
        displayCanvas.width = img.width;
        displayCanvas.height = img.height;
        const displayCtx = displayCanvas.getContext('2d');
        if (displayCtx) {
          displayCtx.clearRect(0, 0, displayCanvas.width, displayCanvas.height);
          displayCtx.drawImage(img, 0, 0);
        }
      }
      
      setMaskCanvas(canvas);
      setMaskHistory([]);
      setHistoryIndex(-1);
    };
    img.src = imageToEdit;
  };

  // 이미지가 변경될 때 캔버스 초기화
  useEffect(() => {
    if (imageToEdit) {
      initCanvas();
    }
  }, [imageToEdit]);

  // 캔버스 이벤트 핸들러
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!canvasRef.current || !maskCanvas) return;
    setIsDrawing(true);
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    drawOnMask(offsetX, offsetY, false);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
    if (!isDrawing || !canvasRef.current || !maskCanvas) return;
    const { offsetX, offsetY } = getCanvasCoordinates(e);
    drawOnMask(offsetX, offsetY, true);
  };

  const handleMouseUp = () => {
    if (isDrawing) {
      setIsDrawing(false);
      
      // 마스크 캔버스의 현재 상태를 히스토리에 저장
      if (maskCanvas) {
        const newMaskDataUrl = maskCanvas.toDataURL('image/png');
        // 이전 히스토리는 제거하고 새 히스토리 추가
        const newHistory = [...maskHistory.slice(0, historyIndex + 1), newMaskDataUrl];
        setMaskHistory(newHistory);
        setHistoryIndex(newHistory.length - 1);
        setMaskDataUrl(newMaskDataUrl);
      }
    }
  };

  const handleMouseLeave = () => {
    setIsDrawing(false);
  };

  // 캔버스 좌표 가져오기
  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    
    return {
      offsetX: (e.clientX - rect.left) * scaleX,
      offsetY: (e.clientY - rect.top) * scaleY
    };
  };

  // 마스크에 그리기
  const drawOnMask = (x: number, y: number, isMoving: boolean) => {
    if (!maskCanvas || !canvasRef.current) return;
    
    const originalCtx = canvasRef.current.getContext('2d');
    const maskCtx = maskCanvas.getContext('2d');
    
    if (!originalCtx || !maskCtx) return;
    
    // 마스크 캔버스에 그리기
    maskCtx.globalCompositeOperation = drawMode === 'erase' ? 'destination-out' : 'source-over';
    maskCtx.fillStyle = '#ffffff';
    maskCtx.strokeStyle = '#ffffff';
    maskCtx.lineWidth = brushSize;
    maskCtx.lineCap = 'round';
    
    if (isMoving) {
      maskCtx.lineTo(x, y);
      maskCtx.stroke();
    } else {
      maskCtx.beginPath();
      maskCtx.arc(x, y, brushSize / 2, 0, Math.PI * 2);
      maskCtx.fill();
      maskCtx.beginPath();
      maskCtx.moveTo(x, y);
    }
    
    // 이미지 위에 마스크 표시
    const img = new Image();
    img.onload = () => {
      originalCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
      originalCtx.drawImage(img, 0, 0);
      
      // 반투명한 마스크 표시
      originalCtx.globalAlpha = 0.5;
      originalCtx.fillStyle = '#ff0000'; // 빨간색 마스크
      
      // 마스크 적용
      const maskData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = maskCanvas.width;
      tempCanvas.height = maskCanvas.height;
      const tempCtx = tempCanvas.getContext('2d');
      
      if (tempCtx) {
        tempCtx.putImageData(maskData, 0, 0);
        originalCtx.drawImage(tempCanvas, 0, 0);
      }
      
      originalCtx.globalAlpha = 1.0;
    };
    img.src = imageToEdit!;
  };

  // 마스크 초기화
  const resetMask = () => {
    if (!maskCanvas) return;
    
    const maskCtx = maskCanvas.getContext('2d');
    if (maskCtx) {
      maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
      
      // 디스플레이 캔버스도 초기화
      if (canvasRef.current) {
        const displayCtx = canvasRef.current.getContext('2d');
        if (displayCtx) {
          const img = new Image();
          img.onload = () => {
            displayCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
            displayCtx.drawImage(img, 0, 0);
          };
          img.src = imageToEdit!;
        }
      }
      
      // 히스토리 초기화
      setMaskHistory([]);
      setHistoryIndex(-1);
      setMaskDataUrl(null);
    }
  };

  // 실행 취소
  const undoMask = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      const prevMaskUrl = maskHistory[newIndex];
      setMaskDataUrl(prevMaskUrl);
      
      // 마스크 캔버스 업데이트
      if (maskCanvas) {
        const maskCtx = maskCanvas.getContext('2d');
        if (maskCtx) {
          const img = new Image();
          img.onload = () => {
            maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
            maskCtx.drawImage(img, 0, 0);
            
            // 디스플레이 캔버스 업데이트
            if (canvasRef.current) {
              const displayCtx = canvasRef.current.getContext('2d');
              if (displayCtx) {
                const originalImg = new Image();
                originalImg.onload = () => {
                  displayCtx.clearRect(0, 0, canvasRef.current!.width, canvasRef.current!.height);
                  displayCtx.drawImage(originalImg, 0, 0);
                  
                  // 마스크 표시
                  displayCtx.globalAlpha = 0.5;
                  displayCtx.drawImage(img, 0, 0);
                  displayCtx.globalAlpha = 1.0;
                };
                originalImg.src = imageToEdit!;
              }
            }
          };
          img.src = prevMaskUrl;
        }
      }
    }
  };

  // 인페인팅 처리 함수
  const handleInpaint = async () => {
    if (!imageToEdit || !maskCanvas) {
      toast.error('이미지나 마스크가 준비되지 않았습니다.');
      return;
    }
    
    // 마스크 확인
    const maskCtx = maskCanvas.getContext('2d');
    if (!maskCtx) return;
    
    // 마스크 픽셀 데이터 확인
    const imageData = maskCtx.getImageData(0, 0, maskCanvas.width, maskCanvas.height);
    const hasData = Array.from(imageData.data).some(value => value > 0);
    
    if (!hasData) {
      toast.error('마스크 영역을 그려주세요.');
      return;
    }
    
    if (!prompt || prompt.trim() === '') {
      toast.error('프롬프트를 입력해주세요.');
      return;
    }
    
    try {
      setIsEditing(true);
      
      // 마스크 데이터 URL 생성
      const maskData = maskCanvas.toDataURL('image/png');
      
      toast.info('인페인팅 처리를 시작합니다...', {
        duration: 2000,
      });
      
      // 실제 API 호출
      const result = await generateImageWithInpainting({
        prompt,
        image: imageToEdit,
        mask: maskData,
        modelId: selectedModel,
        negativePrompt,
        strength: 0.8,
        steps: 30
      });
      
      if (result.success && result.imageUrl) {
        toast.success('인페인팅이 완료되었습니다!');
        onImageEdited(result.imageUrl, result.id || undefined);
      } else {
        toast.error(`인페인팅 실패: ${result.error || '알 수 없는 오류'}`);
      }
      
    } catch (error) {
      console.error('인페인팅 오류:', error);
      toast.error(`인페인팅 오류: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsEditing(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="md:flex gap-4 w-full">
        {/* 편집 도구 패널 */}
        <div className="space-y-4 w-full">
          <CustomCard className="border-none">
            <CustomCardContent className="p-4">
              {/* 인페인팅 모델 선택 드롭다운 */}
              <div className="space-y-2">
                <CustomLabel>인페인팅 모델</CustomLabel>
                <CustomSelect 
                  value={selectedModel} 
                  onValueChange={setSelectedModel}
                >
                  <CustomSelectTrigger className="w-full">
                    <CustomSelectValue placeholder="모델 선택" />
                  </CustomSelectTrigger>
                  <CustomSelectContent>
                    {inpaintingModels.map((model) => (
                      <CustomSelectItem key={model.id} value={model.id}>
                        {model.name} {model.tokenPrice && `(${model.tokenPrice}토큰)`}
                      </CustomSelectItem>
                    ))}
                  </CustomSelectContent>
                </CustomSelect>
              </div>
              
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

        {/* 이미지 편집 영역 */}
        <div className="md:w-2/3 mt-4 md:mt-0 w-full mx-auto">
          <CustomCard className="border-none items-center justify-center ">
            <CustomCardContent className="p-4">
              <div className="relative rounded-md overflow-hidden">
                <canvas
                  ref={canvasRef}
                  className="w-full h-auto"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseLeave}
                  style={{ cursor: 'crosshair' }}
                />
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                색칠된 영역이 수정될 부분입니다. 색칠한 후 인페인팅을 적용하세요.
              </div>
            </CustomCardContent>
          </CustomCard>
        </div>
              
              <div className="space-y-2 mt-4">
                <CustomLabel>브러시 크기</CustomLabel>
                <CustomSlider
                  min={5}
                  max={50}
                  step={1}
                  value={[brushSize]}
                  onValueChange={(value) => setBrushSize(value[0])}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>작게</span>
                  <span>{brushSize}px</span>
                  <span>크게</span>
                </div>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant={drawMode === 'paint' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setDrawMode('paint')}
                >
                  <PaintBucket className="h-4 w-4 mr-2" />
                  페인트
                </Button>
                <Button 
                  variant={drawMode === 'erase' ? 'default' : 'outline'} 
                  className="flex-1"
                  onClick={() => setDrawMode('erase')}
                >
                  <Eraser className="h-4 w-4 mr-2" />
                  지우개
                </Button>
              </div>
              
              <div className="flex space-x-2 mt-4">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={undoMask}
                  disabled={historyIndex <= 0}
                >
                  <Undo2 className="h-4 w-4 mr-2" />
                  실행취소
                </Button>
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={resetMask}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  초기화
                </Button>
              </div>
              
              <Button onClick={handleInpaint} disabled={isEditing} className="w-full mt-4">
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    처리 중...
                  </>
                ) : '인페인팅 적용'}
              </Button>
            </CustomCardContent>
          </CustomCard>
          
          {/* 프롬프트 정보 */}
          {selectedImage?.prompt && (
            <CustomCard>
              <CustomCardContent className="p-4">
                <h3 className="text-sm font-medium mb-2">원본 프롬프트</h3>
                <p className="text-xs text-muted-foreground">{selectedImage.prompt}</p>
              </CustomCardContent>
            </CustomCard>
          )}
        </div>
      </div>
    </div>
  );
}
