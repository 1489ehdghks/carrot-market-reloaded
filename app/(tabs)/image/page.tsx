'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Share2, Settings } from 'lucide-react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import EmptyImageState from './components/EmptyImageState';

// 동적 임포트로 필요할 때만 로드되도록 설정
const TextToImageForm = dynamic(() => import('./components/TextToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">텍스트-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const ImageToImageForm = dynamic(() => import('./components/ImageToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const EditImageForm = dynamic(() => import('./components/client/EditImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지 편집기 로딩 중...</div>,
  ssr: false
});

const ImageUploader = dynamic(() => import('./components/ImageUploader'), {
  loading: () => <div className="h-[150px] flex items-center justify-center">이미지 업로드 로딩 중...</div>,
  ssr: false
});

// 동적으로 PublishDialog 컴포넌트 가져오기
const PublishDialog = dynamic(() => import('./components/PublishDialog'), {
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
  // 선택된 이미지를 전역적으로 관리
  const [selectedImage, setSelectedImage] = useState<{
    url: string;
    id?: string | number;
    prompt?: string;
    title?: string;
  } | null>(null);
  
  // 활성화된 탭 상태 관리
  const [activeTab, setActiveTab] = useState('text-to-image');
  
  // 이미지 포맷 상태 관리
  const [imageFormat, setImageFormat] = useState<string>('PNG');
  
  // 이미지 공개 여부 상태 관리
  const [isPublic, setIsPublic] = useState<boolean>(false);
  
  // 공개하기 다이얼로그 상태
  const [publishDialogOpen, setPublishDialogOpen] = useState<boolean>(false);
  
  // AI 추천 프롬프트 상태
  const [recommendedPrompts, setRecommendedPrompts] = useState<string[]>([
    '더 선명한 이미지',
    '같은 장면대 다른 시간대',
    '다른 스타일',
    '배경 변경'
  ]);

  // 로컬 스토리지에 상태 저장하는 헬퍼 함수
  const saveToLocalStorage = (data: {
    selectedImage: { url: string; id?: string | number; prompt?: string } | null;
    activeTab: string;
    imageFormat: string;
    isPublic: boolean;
    recommendedPrompts: string[];
  }) => {
    if (typeof window === 'undefined') return;
    
    try {
      if (data.selectedImage) {
        localStorage.setItem(STORAGE_KEYS.SELECTED_IMAGE, JSON.stringify(data.selectedImage));
      } else {
        localStorage.removeItem(STORAGE_KEYS.SELECTED_IMAGE);
      }
      
      localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, data.activeTab);
      localStorage.setItem(STORAGE_KEYS.IMAGE_FORMAT, data.imageFormat);
      localStorage.setItem(STORAGE_KEYS.IS_PUBLIC, data.isPublic.toString());
      localStorage.setItem(STORAGE_KEYS.RECOMMENDED_PROMPTS, JSON.stringify(data.recommendedPrompts));
    } catch (error) {
      console.error('설정을 저장하는 중 오류가 발생했습니다:', error);
    }
  };

  // 로컬 스토리지에서 상태 불러오는 헬퍼 함수
  const loadFromLocalStorage = () => {
    if (typeof window === 'undefined') return;
    
    try {
      // 선택된 이미지 불러오기
      const savedImage = localStorage.getItem(STORAGE_KEYS.SELECTED_IMAGE);
      if (savedImage) {
        setSelectedImage(JSON.parse(savedImage));
      }
      
      // 활성화 탭 불러오기
      const savedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      if (savedTab) {
        setActiveTab(savedTab);
      }
      
      // 이미지 포맷 불러오기
      const savedFormat = localStorage.getItem(STORAGE_KEYS.IMAGE_FORMAT);
      if (savedFormat) {
        setImageFormat(savedFormat);
      }
      
      // 공개 여부 불러오기
      const savedPublic = localStorage.getItem(STORAGE_KEYS.IS_PUBLIC);
      if (savedPublic) {
        setIsPublic(savedPublic === 'true');
      }
      
      // 추천 프롬프트 불러오기
      const savedPrompts = localStorage.getItem(STORAGE_KEYS.RECOMMENDED_PROMPTS);
      if (savedPrompts) {
        setRecommendedPrompts(JSON.parse(savedPrompts));
      }
    } catch (error) {
      console.error('설정을 불러오는 중 오류가 발생했습니다:', error);
    }
  };

  // 컴포넌트 마운트 시 로컬 스토리지에서 설정 불러오기
  useEffect(() => {
    loadFromLocalStorage();
  }, []);

  // 이미지가 생성되었을 때 호출되는 함수
  const handleImageGenerated = (imageUrl: string, imageId?: string | number, prompt?: string) => {
    const newImage = { 
      url: imageUrl, 
      id: imageId,
      prompt
    };
    setSelectedImage(newImage);
    
    // 로컬 스토리지에 현재 상태 저장
    saveToLocalStorage({
      selectedImage: newImage,
      activeTab,
      imageFormat,
      isPublic,
      recommendedPrompts
    });
  };
  
  // 이미지 수정 후 새 이미지로 업데이트
  const handleImageEdited = (imageUrl: string, imageId?: string | number) => {
    const newImage = {
      url: imageUrl,
      id: imageId,
      prompt: selectedImage?.prompt
    };
    setSelectedImage(newImage);
    
    // 로컬 스토리지에 현재 상태 저장
    saveToLocalStorage({
      selectedImage: newImage,
      activeTab,
      imageFormat,
      isPublic,
      recommendedPrompts
    });
  };
  
  // 이미지 업로드 시 이미지 설정 및 이미지-이미지 탭으로 전환
  const handleImageUploaded = (file: File, previewUrl: string) => {
    const newImage = {
      url: previewUrl
    };
    setSelectedImage(newImage);
    const newTab = 'image-to-image';
    setActiveTab(newTab);
    
    // 로컬 스토리지에 현재 상태 저장
    saveToLocalStorage({
      selectedImage: newImage,
      activeTab: newTab,
      imageFormat,
      isPublic,
      recommendedPrompts
    });
  };
  
  // 이미지 다운로드 함수
  const handleDownload = async () => {
    if (!selectedImage?.url) return;
    
    try {
      // 이미지 URL에서 파일 다운로드
      const response = await fetch(selectedImage.url);
      if (!response.ok) {
        throw new Error('이미지를 불러오는데 실패했습니다');
      }
      
      const blob = await response.blob();
      
      // 선택된 포맷으로 이미지 변환 (필요한 경우)
      let downloadBlob = blob;
      if (imageFormat.toLowerCase() !== 'png') {
        // Canvas를 사용하여 이미지 포맷 변환
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        
        await new Promise<void>((resolve) => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(
                (newBlob) => {
                  if (newBlob) downloadBlob = newBlob;
                  resolve();
                },
                `image/${imageFormat.toLowerCase()}`,
                imageFormat.toLowerCase() === 'jpg' ? 0.95 : 1
              );
            } else {
              resolve();
            }
          };
        });
        
        URL.revokeObjectURL(img.src);
      }
      
      // 다운로드 링크 생성
      const fileName = `generated-image-${Date.now()}.${imageFormat.toLowerCase()}`;
      const downloadUrl = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      
      // 리소스 정리
      document.body.removeChild(link);
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      
      toast.success(`이미지가 ${imageFormat} 형식으로 다운로드되었습니다`);
    } catch (error) {
      console.error("다운로드 오류:", error);
      toast.error("다운로드 중 오류가 발생했습니다");
    }
  };
  
  // 이미지 공개 여부 토글 함수
  const togglePublic = () => {
    if (!selectedImage?.id) {
      toast.error('공개할 이미지가 없습니다');
      return;
    }
    
    setPublishDialogOpen(true);
  };
  
  // 공개 성공 후 상태 업데이트
  const handlePublishSuccess = (imageId: number, title: string) => {
    setIsPublic(true);
    toast.success('이미지가 공개되었습니다');
    
    // 로컬 스토리지에 현재 상태 저장
    saveToLocalStorage({
      selectedImage: selectedImage ? {
        ...selectedImage,
      } : null,
      activeTab,
      imageFormat,
      isPublic: true,
      recommendedPrompts
    });
  };
  
  // 추천 프롬프트 선택 함수
  const selectPrompt = (prompt: string) => {
    // 선택된 프롬프트를 사용하여 새 이미지 생성 로직
    console.log('선택된 프롬프트:', prompt);
    // 실제 구현에서는 TextToImageForm의 프롬프트 필드에 값을 설정하거나
    // 프롬프트로 직접 이미지 생성 API를 호출
  };

  // 탭 변경 핸들러
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    saveToLocalStorage({
      selectedImage,
      activeTab: value,
      imageFormat,
      isPublic,
      recommendedPrompts
    });
  };

  // 이미지 포맷 변경 핸들러
  const handleFormatChange = (value: string) => {
    setImageFormat(value);
    saveToLocalStorage({
      selectedImage,
      activeTab,
      imageFormat: value,
      isPublic,
      recommendedPrompts
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* 왼쪽: 이미지 생성 설정 */}
        <Card className="w-full border-gray-700 text-white overflow-hidden shadow-md">
          <CardContent className="p-0">
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <TabsList className="flex w-full h-12 border-b border-gray-700">
                <TabsTrigger 
                  value="text-to-image" 
                  className="flex-1 py-3 w-full rounded-xl text-sm border-b-2 border-transparent data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:font-medium transition-colors"
                >
                  텍스트 → 이미지
                </TabsTrigger>
                <TabsTrigger 
                  value="image-to-image" 
                  className="flex-1 py-3 text-sm border-b-2 border-transparent data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:font-medium transition-colors"
                >
                  이미지 → 이미지
                </TabsTrigger>
                <TabsTrigger 
                  value="edit-image" 
                  className="flex-1 py-3 text-sm border-b-2 border-transparent data-[state=active]:bg-zinc-700 data-[state=active]:text-white data-[state=active]:font-medium transition-colors"
                >
                  편집
                </TabsTrigger>
              </TabsList>
              
              <TabsContent 
                value="text-to-image" 
                className="transition-all p-5"
              >
                <TextToImageForm 
                  onGenerationStart={() => {}}
                  onGenerationComplete={(imageUrl, imageId) => 
                    handleImageGenerated(imageUrl, imageId)}
                  onError={(message) => console.error(message)}
                />
              </TabsContent>
              
              <TabsContent 
                value="image-to-image" 
                className="transition-all p-1"
              >
                <div className="space-y-6 p-5">
                  <ImageToImageForm 
                    onGenerationStart={() => {}}
                    onGenerationComplete={(imageUrl, imageId) => 
                      handleImageGenerated(imageUrl, imageId)}
                  />
                </div>
              </TabsContent>
              
              <TabsContent 
                value="edit-image" 
                className="transition-all p-1"
              >
                <div className="p-5">
                  <EditImageForm 
                    selectedImage={selectedImage}
                    onImageEdited={handleImageEdited}
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* 오른쪽: 생성된 이미지 표시 */}
        <Card className="w-full h-full flex flex-col text-white shadow-md border-gray-700 bg-zinc-900/50">
          <CardContent className="p-6 w-full flex-1 flex flex-col">
            <div className="flex flex-col h-full">
              {/* 이미지 영역 - 항상 표시 */}
              <div className="w-full max-w-[500px] mx-auto aspect-square relative border border-gray-700 rounded-md overflow-hidden mb-6 shadow-sm">
                {selectedImage ? (
                  <img 
                    src={selectedImage.url} 

                    className="object-contain w-full h-full"
                  />
                ) : (
                  <EmptyImageState 
                    message="이미지를 생성해 보세요!" 
                    showUploadButton={true} 
                    onUploadClick={() => document.getElementById('image-uploader')?.click()} 
                  />
                )}
              </div>
              
              {/* 이미지 컨트롤 영역 - 항상 표시 */}
              <div className="flex justify-between items-center w-full mb-6">
                <div className="flex-1 flex justify-start">
                  <Select value={imageFormat} onValueChange={handleFormatChange}>
                    <SelectTrigger className="w-32 border-gray-700 bg-zinc-800 text-white">
                      <SelectValue placeholder="포맷" />
                    </SelectTrigger>
                    <SelectContent className="bg-zinc-800 text-white border-gray-700">
                      <SelectItem value="PNG">PNG</SelectItem>
                      <SelectItem value="JPG">JPG</SelectItem>
                      <SelectItem value="WEBP">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="flex-1 flex justify-center">
                  <Button 
                    variant="outline" 
                    onClick={handleDownload}
                    disabled={!selectedImage}
                    className="rounded-lg space-x-2 h-12 w-32 border-gray-700 bg-zinc-800 text-white hover:bg-gray-700"
                  >
                    <Download className="h-4 w-4 mr-1" />
                    <span>다운로드</span>
                  </Button>
                </div>
                
                <div className="flex-1 flex justify-end">
                  <Button 
                    variant="outline" 
                    onClick={togglePublic}
                    disabled={!selectedImage}
                    className={`rounded-lg space-x-2 h-12 w-32 border-gray-700 ${isPublic ? 'bg-orange-700 text-white' : 'bg-gray-800 text-white hover:bg-gray-700'}`}
                  >
                    <Share2 className="h-4 w-4 mr-1" />
                    <span>{isPublic ? '공개됨' : '공개하기'}</span>
                  </Button>
                </div>
              </div>
              
              {/* 프롬프트 표시 */}
              {selectedImage?.prompt && (
                <div className="w-full p-4 rounded-md text-sm mb-6 border border-gray-700 bg-gray-900/50">
                  <p className="font-medium">사용된 프롬프트:</p>
                  <p className="mt-2 text-gray-300">{selectedImage.prompt}</p>
                </div>
              )}
              
              {/* AI 추천 프롬프트 영역 */}
              <div className="w-full border border-gray-700 rounded-md p-5">
                <h3 className="font-medium text-sm mb-4 flex items-center">
                  <span>AI 추천 프롬프트</span>
                  <div className="ml-auto flex items-center space-x-3">
                    <Switch
                      id="ai-recommendations"
                      checked={true}
                      className="scale-90"
                    />
                    <Settings className="h-4 w-4 text-gray-400" />
                  </div>
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {recommendedPrompts.map((prompt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      className="justify-start text-sm h-auto py-3 px-4 border-gray-700 bg-gray-900 hover:bg-orange-800/30 text-white"
                      onClick={() => selectPrompt(prompt)}
                    >
                      <span className="text-left truncate">{prompt}</span>
                    </Button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 공개하기 다이얼로그 추가 */}
      <PublishDialog 
        imageId={selectedImage?.id || null}
        isOpen={publishDialogOpen}
        onOpenChange={setPublishDialogOpen}
        onSuccess={handlePublishSuccess}
      />
      
      {/* 이미지 업로드를 위한 숨겨진 input */}
      <input 
        type="file" 
        id="image-uploader" 
        accept="image/*" 
        className="hidden" 
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            const previewUrl = URL.createObjectURL(file);
            handleImageUploaded(file, previewUrl);
          }
        }} 
      />
    </div>
  );
} 