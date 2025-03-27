'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/dataDisplay/tabs";
import { Card, CardContent } from '@/components/ui/dataDisplay/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Settings } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/form/select';
import { Switch } from '@/components/ui/form/switch';
import { toast } from 'sonner';
import EmptyImageState from './components/shared/EmptyImageState';

// 동적 임포트로 필요할 때만 로드되도록 설정
const TextToImageForm = dynamic(() => import('./components/textToImage/TextToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">텍스트-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const ImageToImageForm = dynamic(() => import('./components/imageToImage/ImageToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const EditImageForm = dynamic(() => import('./components/client/EditImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지 편집기 로딩 중...</div>,
  ssr: false
});

const ImageUploader = dynamic(() => import('./components/shared/ImageUploader'), {
  loading: () => <div className="h-[150px] flex items-center justify-center">이미지 업로드 로딩 중...</div>,
  ssr: false
});

// 동적으로 PublishDialog 컴포넌트 가져오기
const PublishDialog = dynamic(() => import('./components/shared/PublishDialog'), {
  loading: () => null,
  ssr: false
});

// 로컬 스토리지 키 정의
const STORAGE_KEYS = {
  SELECTED_IMAGE: 'image_generator_selected_image',
  ACTIVE_TAB: 'image_generator_active_tab',
  IMAGE_FORMAT: 'image_generator_format',
  IS_PUBLIC: 'image_generator_is_public',
  RECOMMENDED_PROMPTS: 'image_generator_recommended_prompts'
};

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [imageFormat, setImageFormat] = useState('png');
  const [isPublishOpen, setIsPublishOpen] = useState(false);

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem(STORAGE_KEYS.SELECTED_IMAGE);
      const storedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      const storedFormat = localStorage.getItem(STORAGE_KEYS.IMAGE_FORMAT);
      const storedIsPublic = localStorage.getItem(STORAGE_KEYS.IS_PUBLIC);

      if (storedImage) setSelectedImage(storedImage);
      if (storedTab) setActiveTab(storedTab);
      if (storedFormat) setImageFormat(storedFormat);
      if (storedIsPublic) setIsPublic(storedIsPublic === 'true');
    }
  }, []);

  // 상태 변경 시 로컬 스토리지 업데이트
  useEffect(() => {
    if (selectedImage) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_IMAGE, selectedImage);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    localStorage.setItem(STORAGE_KEYS.IMAGE_FORMAT, imageFormat);
    localStorage.setItem(STORAGE_KEYS.IS_PUBLIC, isPublic.toString());
  }, [selectedImage, activeTab, imageFormat, isPublic]);

  // 이미지 선택 핸들러
  const handleImageGenerated = (imageUrl: string, imageId: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageId(imageId);
  };

  // 이미지 다운로드 핸들러
  const handleDownload = () => {
    if (!selectedImage) {
      toast.error('다운로드할 이미지가 없습니다');
      return;
    }

    const link = document.createElement('a');
    link.href = selectedImage;
    link.download = `lumi-ai-image.${imageFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('이미지 다운로드 시작됨');
  };

  // 이미지 공유 핸들러
  const handleShare = () => {
    if (!selectedImage) {
      toast.error('공유할 이미지가 없습니다');
      return;
    }
    setIsPublishOpen(true);
  };

  // 오류 처리 핸들러
  const handleError = (message: string) => {
    toast.error(message);
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">Lumi AI 이미지 생성</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 입력 폼 영역 */}
        <div className="lg:col-span-2">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="text-to-image">텍스트로 이미지 생성</TabsTrigger>
              <TabsTrigger value="image-to-image">이미지 변환</TabsTrigger>
              <TabsTrigger value="edit-image">이미지 편집</TabsTrigger>
            </TabsList>
            
            <TabsContent value="text-to-image">
              <Card>
                <CardContent className="pt-6">
                  <TextToImageForm 
                    onGenerationStart={() => {}} 
                    onGenerationComplete={handleImageGenerated} 
                    onError={handleError} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="image-to-image">
              <Card>
                <CardContent className="pt-6">
                  <ImageUploader 
                    onImageUploaded={(file, preview) => console.log('업로드된 이미지:', file, preview)} 
                  />
                  <div className="h-4"></div>
                  <TextToImageForm 
                    onGenerationStart={() => {}} 
                    onGenerationComplete={handleImageGenerated} 
                    onError={handleError} 
                  />
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="edit-image">
              <Card>
                <CardContent className="pt-6">
                  <ImageUploader 
                    onImageUploaded={(file, preview) => console.log('편집할 이미지:', file, preview)} 
                  />
                  <div className="h-4"></div>
                  {selectedImage && (
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-3">이미지 편집</h3>
                      <Button onClick={() => toast.success('편집 기능이 곧 추가될 예정입니다.')}>
                        편집 시작하기
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* 오른쪽: 결과 및 옵션 영역 */}
        <div>
          <Card className="mb-4 overflow-hidden">
            <CardContent className="p-0">
              {selectedImage ? (
                <div className="relative aspect-square">
                  <img 
                    src={selectedImage} 
                    alt="생성된 이미지" 
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <EmptyImageState />
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">이미지 형식</span>
                  <Select 
                    value={imageFormat} 
                    onValueChange={setImageFormat}
                  >
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="이미지 형식" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WebP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">공개 설정</span>
                  <Switch 
                    checked={isPublic} 
                    onCheckedChange={setIsPublic}
                  />
                </div>
                
                <div className="flex gap-2 pt-2">
                  <Button 
                    variant="default" 
                    className="flex-1"
                    onClick={handleDownload}
                    disabled={!selectedImage}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </Button>
                  <Button 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleShare}
                    disabled={!selectedImage}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    공유하기
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* 공유 다이얼로그 */}
      {isPublishOpen && selectedImageId && (
        <PublishDialog 
          imageId={selectedImageId} 
          isOpen={isPublishOpen}
          onOpenChange={(open) => setIsPublishOpen(open)}
        />
      )}
    </div>
  );
} 