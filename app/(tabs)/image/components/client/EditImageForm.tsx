'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/dataDisplay/card';
import { Label } from '@/components/ui/form/label';
import { Slider } from '@/components/ui/form/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/dataDisplay/tabs';
import { Loader2, Image as ImageIcon, PaintBucket, Eraser } from 'lucide-react';
import ImageUploader from '../shared/ImageUploader';

// 컴포넌트 props 정의
interface EditImageFormProps {
  selectedImage: {
    url: string;
    id?: string | number;
    prompt?: string;
  } | null;
  onImageEdited: (imageUrl: string, imageId?: string | number) => void;
}

export default function EditImageForm({ selectedImage, onImageEdited }: EditImageFormProps) {
  // 현재 편집 모드 상태
  const [mode, setMode] = useState<'inpaint' | 'outpaint' | 'mask'>('inpaint');
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

  // 선택된 이미지가 변경되면 편집할 이미지 업데이트
  useEffect(() => {
    if (selectedImage?.url) {
      setImageToEdit(selectedImage.url);
    }
  }, [selectedImage]);

  // 캔버스 초기화 함수
  const initCanvas = () => {
    if (!imageToEdit) return;
    
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
      
      setMaskCanvas(canvas);
    };
    img.src = imageToEdit;
  };

  // 모드가 변경되거나 이미지가 변경될 때 캔버스 초기화
  useEffect(() => {
    if (imageToEdit) {
      initCanvas();
    }
  }, [imageToEdit, mode]);

  // 이미지가 없을 경우 업로드 UI 표시
  if (!imageToEdit) {
    return (
      <div className="flex flex-col items-center justify-center space-y-4 p-8">
        <div className="text-center space-y-2">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="text-lg font-medium">편집할 이미지가 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            이미지를 업로드하거나 다른 탭에서 이미지를 생성한 후 이 탭으로 돌아오세요.
          </p>
        </div>
        <ImageUploader onImageUploaded={(file, previewUrl) => setImageToEdit(previewUrl)} />
      </div>
    );
  }

  // 인페인팅 처리 함수
  const handleInpaint = async () => {
    if (!imageToEdit || !maskCanvas) return;
    
    try {
      setIsEditing(true);
      
      // 마스크 데이터 URL 생성
      const maskData = maskCanvas.toDataURL('image/png');
      setMaskDataUrl(maskData);
      
      // 여기에 인페인팅 API 호출 로직 구현
      // 예시: 인페인팅 API 호출
      /* 실제 API 호출 코드
      const response = await fetch('/api/inpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: imageToEdit,
          maskUrl: maskData,
          prompt: selectedImage?.prompt || '',
        }),
      });
      
      if (!response.ok) {
        throw new Error('인페인팅 처리 중 오류가 발생했습니다.');
      }
      
      const data = await response.json();
      onImageEdited(data.imageUrl, data.imageId);
      */
      
      // 임시 코드 (API 호출로 대체 필요)
      console.log('인페인팅 처리 중...', { imageUrl: imageToEdit, maskUrl: maskData?.substring(0, 50) + '...' });
      setTimeout(() => {
        // API 호출 결과로 바꿔야 함
        onImageEdited(imageToEdit, selectedImage?.id);
        setIsEditing(false);
      }, 1500);
      
    } catch (error) {
      console.error('인페인팅 오류:', error);
      setIsEditing(false);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* 편집 도구 패널 */}
      <div className="md:col-span-1 space-y-4">
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-medium mb-4">편집 도구</h3>
            
            <Tabs defaultValue="inpaint" onValueChange={(value) => setMode(value as any)}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="inpaint">인페인팅</TabsTrigger>
                <TabsTrigger value="outpaint">아웃페인팅</TabsTrigger>
                <TabsTrigger value="mask">마스킹</TabsTrigger>
              </TabsList>
              
              <TabsContent value="inpaint" className="space-y-4 pt-4">
                <div className="space-y-2">
                  <Label>브러시 크기</Label>
                  <Slider
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
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1">
                    <PaintBucket className="h-4 w-4 mr-2" />
                    페인트
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <Eraser className="h-4 w-4 mr-2" />
                    지우개
                  </Button>
                </div>
                
                <Button onClick={handleInpaint} disabled={isEditing} className="w-full">
                  {isEditing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      처리 중...
                    </>
                  ) : '인페인팅 적용'}
                </Button>
              </TabsContent>
              
              <TabsContent value="outpaint" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  아웃페인팅 기능을 사용하면 이미지 외부 영역을 확장할 수 있습니다.
                </p>
                <Button disabled className="w-full">준비 중인 기능입니다</Button>
              </TabsContent>
              
              <TabsContent value="mask" className="space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">
                  마스킹 기능으로 이미지의 특정 부분만 선택하여 처리할 수 있습니다.
                </p>
                <Button disabled className="w-full">준비 중인 기능입니다</Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        
        {/* 프롬프트 정보 */}
        {selectedImage?.prompt && (
          <Card>
            <CardContent className="p-4">
              <h3 className="text-sm font-medium mb-2">원본 프롬프트</h3>
              <p className="text-xs text-muted-foreground">{selectedImage.prompt}</p>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 이미지 편집 영역 */}
      <div className="md:col-span-2">
        <Card>
          <CardContent className="p-4">
            <div className="relative rounded-md overflow-hidden border border-border">
              <img 
                src={imageToEdit} 
                alt="편집 이미지" 
                className="w-full h-auto object-contain"
              />
              
              {/* 마스크 오버레이 (구현 필요) */}
              {maskDataUrl && (
                <div className="absolute inset-0 pointer-events-none opacity-50">
                  <img 
                    src={maskDataUrl} 
                    alt="마스크" 
                    className="w-full h-full object-contain"
                  />
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 