import { useState, useEffect } from 'react';
import { 
  CustomDialog, 
  CustomDialogContent, 
  CustomDialogHeader,
  CustomDialogTitle
} from '@/widgets/shared/custom-dialog';
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import { CustomButton } from '@/widgets/elements/custom-button';
import { getImageModalData, ImageModalData } from '@/features/image/process/imageModalService';
import { useNotification } from '@/widgets/shared/custom-notification';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/widgets/shared/custom-tabs';
import { Copy, Check } from 'lucide-react';

interface ImageSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageId: number;
  imageUrl: string;
}

export function ImageSelectModal({ isOpen, onClose, imageId, imageUrl }: ImageSelectModalProps) {
  const { showNotification } = useNotification();
  const [imageData, setImageData] = useState<ImageModalData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('prompt');
  const [copied, setCopied] = useState(false);
  const [negCopied, setNegCopied] = useState(false);

  useEffect(() => {
    if (isOpen && imageId) {
      loadImageData();
    }
  }, [isOpen, imageId]);

  const loadImageData = async () => {
    try {
      setIsLoading(true);
      const data = await getImageModalData(imageId);
      if (data) {
        setImageData(data);
      }
    } catch (error) {
      showNotification({
        title: '오류',
        message: '이미지 정보를 불러오는데 실패했습니다',
        type: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = async (text: string, isNegative = false) => {
    try {
      await navigator.clipboard.writeText(text);
      if (isNegative) {
        setNegCopied(true);
        setTimeout(() => setNegCopied(false), 2000);
      } else {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
      showNotification({
        title: '복사 완료',
        message: '프롬프트가 클립보드에 복사되었습니다',
        type: 'success'
      });
    } catch (err) {
      showNotification({
        title: '복사 실패',
        message: '클립보드에 복사할 수 없습니다',
        type: 'error'
      });
    }
  };

  return (
    <CustomDialog open={isOpen} onOpenChange={onClose}>
      <CustomDialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0 md:p-6">
        <CustomDialogHeader className="p-4 md:p-4">
            <CustomDialogTitle className="text-xl font-semibold">{imageData?.title}</CustomDialogTitle>
        </CustomDialogHeader>
        
        <div className="space-y-4 p-4 md:p-0">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 이미지 영역 - 모바일에서는 상단, 데스크탑에서는 왼쪽 */}
            <CustomCard>
              <CustomCardContent className="p-0 overflow-hidden">
                <img 
                  src={imageUrl} 
                  alt="선택된 이미지" 
                  className="w-full h-auto object-contain"
                />
              </CustomCardContent>
            </CustomCard>
            
            {/* 정보 영역 - 모바일에서는 하단, 데스크탑에서는 오른쪽 */}
            <div className="flex flex-col">
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="w-full mb-4">
                  <TabsTrigger value="prompt" className="flex-1 text-base">prompt</TabsTrigger>
                  <TabsTrigger value="info" className="flex-1 text-base">info</TabsTrigger>
                </TabsList>

                {isLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-orange-500 rounded-full border-t-transparent"></div>
                  </div>
                ) : imageData && (
                  <>
                    <TabsContent value="prompt" className="space-y-5 mt-2">
                      <div>
                        <div className="flex justify-between items-center mb-2">
                          <label className="text-sm font-medium">prompt</label>
                          <CustomButton 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => copyToClipboard(imageData.prompt)}
                            className="h-8 px-3"
                          >
                            {copied ? (
                              <Check className="w-4 h-4 mr-1" />
                            ) : (
                              <Copy className="w-4 h-4 mr-1" />
                            )}
                            {copied ? '복사됨' : '복사'}
                          </CustomButton>
                        </div>
                        <div className="relative">
                          <textarea
                            value={imageData.prompt}
                            disabled
                            className="w-full p-4 border rounded-md bg-zinc-800 text-gray-200 text-sm font-sans leading-relaxed"
                            rows={6}
                          />
                        </div>
                      </div>

                      {imageData.negativePrompt && (
                        <div>
                          <div className="flex justify-between items-center mb-2">
                            <label className="text-sm font-medium">nagative prompt</label>
                            <CustomButton 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => copyToClipboard(imageData.negativePrompt || '', true)}
                              className="h-8 px-3"
                            >
                              {negCopied ? (
                                <Check className="w-4 h-4 mr-1" />
                              ) : (
                                <Copy className="w-4 h-4 mr-1" />
                              )}
                              {negCopied ? '복사됨' : '복사'}
                            </CustomButton>
                          </div>
                          <textarea
                            value={imageData.negativePrompt}
                            disabled
                            className="w-full p-4 border rounded-md bg-zinc-800 text-gray-200 text-sm font-sans leading-relaxed"
                            rows={4}
                          />
                        </div>
                      )}
                    </TabsContent>

                    <TabsContent value="info" className="space-y-4 mt-2">
                      <div className="flex items-center gap-4">
                        <img 
                          src={imageData.user?.avatar || '/default-profile.png'} 
                          alt={imageData.user?.username || '사용자'}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <p className="font-medium">{imageData.user?.username || '사용자'}</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="p-3 border rounded-md">
                        <div className="text-sm text-gray-500">모델</div>
                        <div className="font-medium mt-1">{imageData.model}</div>
                    </div>
                        
                    <div className="p-3 border rounded-md">
                        <div className="text-sm text-gray-500">샘플러</div>
                        <div className="font-medium mt-1">{imageData.sampler}</div>
                    </div>
                      </div>
                        
                      <div className="p-3 border rounded-md">
                        <div className="text-sm text-gray-500">이미지 크기</div>
                        <div className="font-medium mt-1">{imageData.width} × {imageData.height}</div>
                      </div>
                    </TabsContent>
                  </>
                )}
              </Tabs>
            </div>
          </div>
        </div>
      </CustomDialogContent>
    </CustomDialog>
  );
} 