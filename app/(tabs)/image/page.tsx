'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/widgets/shared/custom-tabs";
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import { CustomButton } from '@/widgets/elements/custom-button';
import { Download, Share2, Filter, Clock, RefreshCw } from 'lucide-react';
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/widgets/elements/custom-select';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getUserImages, getPublicImages } from './actions';
import { toast } from 'sonner';
import EmptyImageState from '@/widgets/image/shared/EmptyImageForm';
import { ImageSelectModal } from '@/widgets/shared/imageSelectModal';

// 동적 임포트로 필요할 때만 로드되도록 설정
const TextToImageForm = dynamic(() => import('@/widgets/image/textToImage/TextToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">텍스트-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const ImageToImageForm = dynamic(() => import('@/widgets/image/imageToImage/ImageToImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지-이미지 생성기 로딩 중...</div>,
  ssr: false
});

const EditImageForm = dynamic(() => import('@/widgets/image/edit/EditImageForm'), {
  loading: () => <div className="h-[500px] flex items-center justify-center">이미지 편집기 로딩 중...</div>,
  ssr: false
});

const ImageUploader = dynamic(() => import('@/widgets/shared/custom-ImageUploader'), {
  loading: () => <div className="h-[150px] flex items-center justify-center">이미지 업로드 로딩 중...</div>,
  ssr: false
});

const PublishDialog = dynamic(() => import('@/widgets/image/shared/PublishDialog'), {
  loading: () => null,
  ssr: false
});

// 로컬 스토리지 키 정의
const STORAGE_KEYS = {
  SELECTED_IMAGE: 'image_generator_selected_image',
  ACTIVE_TAB: 'image_generator_active_tab',
  IMAGE_FORMAT: 'image_generator_format',
  IS_PUBLIC: 'image_generator_is_public',
  RECOMMENDED_PROMPTS: 'image_generator_recommended_prompts',
  IMAGE_SORT: 'image_generator_sort',
  IMAGE_FILTER: 'image_generator_filter'
};

// 이미지 URL 처리 관련 헬퍼 함수
const getImageUrl = (image: any): string => {
  if (!image) return '';
  
  // isPermanent가 true인 경우 Cloudflare에 영구 저장된 URL을 사용
  if (image.isPermanent && image.thumbnailUrl) {
    return image.thumbnailUrl;
  }
  
  // 임시 URL의 경우 fileUrl 사용
  return image.fileUrl || '';
};

// 이미지 비율 계산 함수
const getAspectRatio = (image: any): string => {
  if (!image || !image.width || !image.height) return '1/1';
  return `${image.width}/${image.height}`;
};

// 이미지 크기 표시 함수 수정
const getImageSizeText = (image: any): string => {
  if (!image || !image.width || !image.height) return '';
  return `${image.width} × ${image.height}`;
};

export default function ImagePage() {
  const [activeTab, setActiveTab] = useState('text-to-image');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [isPublic, setIsPublic] = useState(false);
  const [imageFormat, setImageFormat] = useState('png');
  const [imageQuality, setImageQuality] = useState<number>(0.9);
  const [isPublishOpen, setIsPublishOpen] = useState(false);
  const [imageTitle, setImageTitle] = useState<string>('');
  
  // 이미지 목록 관련 상태
  const [imageCategory, setImageCategory] = useState<string>('all');
  const [imageSort, setImageSort] = useState<string>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [isSelectedImagePublic, setIsSelectedImagePublic] = useState<boolean>(false); // 선택된 이미지의 공개 상태
  const [showAdultContent, setShowAdultContent] = useState<boolean>(false); // 성인 컨텐츠 표시 여부
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 이미지 목록 로딩
  // @ts-ignore - 타입 오류 무시, 브라우저에서는 문제없이 작동함
  const { 
    data: imagesData, 
    fetchNextPage, 
    hasNextPage, 
    isFetchingNextPage, 
    isLoading: isLoadingImages,
    refetch: refetchImages
  } = useInfiniteQuery({
    queryKey: ['user-images', imageCategory, imageSort, sortDirection],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      // 타입 안전성을 위해 더 많은 노력이 필요하지만 지금은 any 타입으로 처리
      return await getUserImages({ 
        page: Number(pageParam), 
        category: imageCategory === 'all' ? undefined : imageCategory,
        orderBy: imageSort as any,
        direction: sortDirection
      });
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.success || !lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }
  });

  // 공개 이미지 목록 로딩
  // @ts-ignore - 타입 오류 무시, 브라우저에서는 문제없이 작동함
  const { 
    data: publicImagesData, 
    fetchNextPage: fetchNextPublicPage, 
    hasNextPage: hasNextPublicPage, 
    isFetchingNextPage: isFetchingNextPublicPage, 
    isLoading: isLoadingPublicImages,
    refetch: refetchPublicImages
  } = useInfiniteQuery({
    queryKey: ['public-images', imageCategory, imageSort, sortDirection, showAdultContent],
    initialPageParam: 1,
    queryFn: async ({ pageParam }) => {
      // 타입 안전성을 위해 더 많은 노력이 필요하지만 지금은 any 타입으로 처리
      return await getPublicImages({ 
        page: Number(pageParam), 
        category: imageCategory === 'all' ? undefined : imageCategory,
        orderBy: imageSort as any,
        direction: sortDirection,
        showAdult: showAdultContent
      });
    },
    getNextPageParam: (lastPage: any) => {
      if (!lastPage?.success || !lastPage?.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    }
  });

  // 로컬 스토리지에서 데이터 로드
  useEffect(() => {
    // 브라우저 환경에서만 실행
    if (typeof window !== 'undefined') {
      const storedImage = localStorage.getItem(STORAGE_KEYS.SELECTED_IMAGE);
      const storedTab = localStorage.getItem(STORAGE_KEYS.ACTIVE_TAB);
      const storedFormat = localStorage.getItem(STORAGE_KEYS.IMAGE_FORMAT);
      const storedIsPublic = localStorage.getItem(STORAGE_KEYS.IS_PUBLIC);
      const storedTitle = localStorage.getItem('image_title');
      const storedQuality = localStorage.getItem('image_quality');
      const storedSort = localStorage.getItem(STORAGE_KEYS.IMAGE_SORT);
      const storedFilter = localStorage.getItem(STORAGE_KEYS.IMAGE_FILTER);

      if (storedImage && storedImage.trim()) setSelectedImage(storedImage);
      if (storedTab) setActiveTab(storedTab);
      if (storedFormat) setImageFormat(storedFormat);
      if (storedIsPublic) setIsPublic(storedIsPublic === 'true');
      if (storedTitle) setImageTitle(storedTitle);
      if (storedQuality) setImageQuality(parseFloat(storedQuality));
      if (storedSort) setImageSort(storedSort);
      if (storedFilter) setImageCategory(storedFilter);
    }
  }, []);

  // 상태 변경 시 로컬 스토리지 업데이트
  useEffect(() => {
    if (selectedImage && selectedImage.trim()) {
      localStorage.setItem(STORAGE_KEYS.SELECTED_IMAGE, selectedImage);
    } else {
      localStorage.removeItem(STORAGE_KEYS.SELECTED_IMAGE);
    }
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TAB, activeTab);
    localStorage.setItem(STORAGE_KEYS.IMAGE_FORMAT, imageFormat);
    localStorage.setItem(STORAGE_KEYS.IS_PUBLIC, isPublic.toString());
    localStorage.setItem(STORAGE_KEYS.IMAGE_SORT, imageSort);
    localStorage.setItem(STORAGE_KEYS.IMAGE_FILTER, imageCategory);
    if (imageTitle) {
      localStorage.setItem('image_title', imageTitle);
    }
  }, [selectedImage, activeTab, imageFormat, isPublic, imageTitle, imageSort, imageCategory]);

  // 이미지 선택 핸들러
  const handleImageGenerated = (imageUrl: string, imageId: string, title?: string) => {
    setSelectedImage(imageUrl);
    setSelectedImageId(imageId);
    setIsSelectedImagePublic(false); // 새로 생성된 이미지는 기본적으로 비공개
    if (title) {
      setImageTitle(title);
    }
  };

  // 이미지 다운로드 핸들러
  const handleDownload = async () => {
    if (!selectedImage) {
      toast.error('다운로드할 이미지가 없습니다');
      return;
    }

    try {
      toast.info('이미지 준비 중...');
      
      // 파일명 생성 (특수문자 제거 및 공백을 하이픈으로 변경)
      const sanitizeFileName = (name: string) => {
        // 파일명으로 사용할 수 없는 특수문자 제거
        const sanitized = name
          .replace(/[\\/:*?"<>|]/g, '')
          .replace(/\s+/g, '-')
          .substring(0, 50); // 최대 50자로 제한
        return sanitized || 'image';
      };
      
      const now = new Date();
      const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
      const sanitizedTitle = sanitizeFileName(imageTitle || 'ai-image');
      const fileName = `lumi-${sanitizedTitle}-${dateStr}`;
      
      // CORS 이슈 해결을 위한 대체 방법 - Blob으로 직접 다운로드 시도
      try {
        // 이미지 로드
        const img = new Image();
        img.crossOrigin = 'anonymous'; // CORS 이슈 방지 시도
        
        // 이미지 로드 대기
        await new Promise((resolve, reject) => {
          img.onload = resolve;
          img.onerror = () => reject(new Error('이미지 로드 실패'));
          img.src = selectedImage;
        });

        // Canvas 생성 및 이미지 그리기
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          throw new Error('Canvas 컨텍스트 생성 실패');
        }
        ctx.drawImage(img, 0, 0);

        // MIME 타입 매핑
        const mimeTypes = {
          'png': 'image/png',
          'jpg': 'image/jpeg',
          'webp': 'image/webp'
        };
        
        // 품질 설정 (JPEG 및 WebP에만 적용)
        const quality = imageFormat === 'png' ? undefined : imageQuality;
        
        // 선택한 형식으로 Canvas에서 이미지 URL 생성
        const dataUrl = canvas.toDataURL(mimeTypes[imageFormat as keyof typeof mimeTypes], quality);
        
        // 다운로드 링크 생성 및 클릭
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `${fileName}.${imageFormat}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        toast.success(`이미지가 ${imageFormat.toUpperCase()} 형식으로 다운로드되었습니다`);
        return; // 성공하면 여기서 함수 종료
      } catch (canvasError) {
        console.warn('Canvas 방식 다운로드 실패, 대체 방법 시도:', canvasError);
        // Canvas 방식 실패 시 계속 진행하여 다른 방법 시도
      }

      // Canvas 방식 실패 시 직접 Fetch로 다운로드 시도
      const response = await fetch(selectedImage);
      if (!response.ok) {
        throw new Error(`이미지 다운로드 실패: ${response.status} ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `${fileName}.${imageFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Blob URL 해제
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
      
      toast.success(`이미지가 다운로드되었습니다 (원본 형식)`);
    } catch (error) {
      console.error('이미지 다운로드 오류:', error);
      toast.error('이미지 다운로드 중 오류가 발생했습니다. 다시 시도해 주세요.');
    }
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

  // 이미지 선택 핸들러
  const handleImageSelected = (imageUrl: string, imageId: string | number, isPublic: boolean = false) => {
    setSelectedImage(imageUrl);
    setSelectedImageId(imageId.toString());
    setIsSelectedImagePublic(isPublic);
    setIsModalOpen(true); // 모달 열기
  };

  // 이미지 목록 데이터 안전하게 준비
  // @ts-ignore - 타입 오류 무시, 브라우저에서는 문제없이 작동함
  const images = imagesData?.pages
    .filter((page: any) => page && page.success && Array.isArray(page.images))
    .flatMap((page: any) => page.images || []) || [];

  // 공개 이미지 목록 데이터 안전하게 준비
  // @ts-ignore - 타입 오류 무시, 브라우저에서는 문제없이 작동함
  const publicImages = publicImagesData?.pages
    .filter((page: any) => page && page.success && Array.isArray(page.images))
    .flatMap((page: any) => page.images || [])
    .filter((image: any) => showAdultContent || !image.isAdult) || []; // 성인 컨텐츠 필터링

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-2xl font-bold mb-6">이미지 생성</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 왼쪽: 입력 폼 영역 */}
        <div className="lg:col-span-2">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => setActiveTab(value)}
            className="w-full"
          >
            <TabsList className="mb-4">
              <TabsTrigger value="text-to-image">text to image</TabsTrigger>
              <TabsTrigger value="image-to-image">image to image</TabsTrigger>
              <TabsTrigger value="edit-image">edit</TabsTrigger>
              <TabsTrigger value="my-images">내 이미지</TabsTrigger>
              <TabsTrigger value="public-images">공개 이미지</TabsTrigger>
            </TabsList>
            
            {/* Text to Image 탭 */}
            <TabsContent value="text-to-image">
              <CustomCard>
                <CustomCardContent className="pt-6">
                  <TextToImageForm 
                    onGenerationStart={() => {}} 
                    onGenerationComplete={handleImageGenerated} 
                    onError={handleError} 
                  />
                </CustomCardContent>
              </CustomCard>
            </TabsContent>
            
            {/* Image to Image 탭 */}
            <TabsContent value="image-to-image">
              <CustomCard>
                <CustomCardContent className="pt-6">
                  <ImageToImageForm 
                    onGenerationStart={() => {}} 
                    onGenerationComplete={handleImageGenerated} 
                    onError={handleError} 
                  />
                </CustomCardContent>
              </CustomCard>
            </TabsContent>
            
            {/* Edit Image 탭 */}
            <TabsContent value="edit-image">
              <CustomCard>
                <CustomCardContent className="pt-6">
                  <ImageUploader 
                    onImageUploaded={(file, preview) => console.log('편집할 이미지:', file, preview)} 
                  />
                  <div className="h-4"></div>
                  {selectedImage && (
                    <div className="p-4 border rounded-md">
                      <h3 className="text-lg font-medium mb-3">이미지 편집</h3>
                      <CustomButton onClick={() => toast.success('편집 기능이 곧 추가될 예정입니다.')}>
                        편집 시작하기
                      </CustomButton>
                    </div>
                  )}
                </CustomCardContent>
              </CustomCard>
            </TabsContent>
            
            {/* 내 이미지 탭 */}
            <TabsContent value="my-images">
              <CustomCard>
                <CustomCardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">내 이미지 갤러리</h3>
                    <div className="flex space-x-2">
                      <CustomButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetchImages()}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                        새로고침
                      </CustomButton>
                    </div>
                  </div>
                  
                  {/* 필터링 옵션 */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Filter size={16} />
                      <span className="text-sm">카테고리:</span>
                      <CustomSelect 
                        value={imageCategory} 
                        onValueChange={(val) => setImageCategory(val)}
                      >
                        <CustomSelectTrigger className="h-8 min-w-[120px]">
                          <CustomSelectValue />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="all">전체</CustomSelectItem>
                          <CustomSelectItem value="2d">2D</CustomSelectItem>
                          <CustomSelectItem value="2.5d">2.5D</CustomSelectItem>
                          <CustomSelectItem value="realistic">실사</CustomSelectItem>
                          <CustomSelectItem value="anime">애니메이션</CustomSelectItem>
                          <CustomSelectItem value="portrait">인물</CustomSelectItem>
                          <CustomSelectItem value="landscape">풍경</CustomSelectItem>
                          <CustomSelectItem value="concept">컨셉아트</CustomSelectItem>
                          <CustomSelectItem value="other">기타</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span className="text-sm">정렬:</span>
                      <CustomSelect 
                        value={imageSort} 
                        onValueChange={(val) => setImageSort(val)}
                      >
                        <CustomSelectTrigger className="h-8 min-w-[120px]">
                          <CustomSelectValue />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="created_at">최신순</CustomSelectItem>
                          <CustomSelectItem value="views">조회순</CustomSelectItem>
                          <CustomSelectItem value="downloads">다운로드순</CustomSelectItem>
                          <CustomSelectItem value="title">제목순</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                      
                      <CustomButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="h-8 px-2"
                      >
                        {sortDirection === 'asc' ? '오름차순' : '내림차순'}
                      </CustomButton>
                    </div>
                  </div>
                  
                  {/* 이미지 그리드 */}
                  {isLoadingImages ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin h-8 w-8 border-4 border-orange-500 rounded-full border-t-transparent"></div>
                    </div>
                  ) : images.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 border border-dashed rounded-lg text-center">
                      <p className="text-neutral-500">이미지가 없습니다</p>
                      <CustomButton 
                        onClick={() => setActiveTab('text-to-image')}
                        variant="outline"
                      >
                        이미지 생성하기
                      </CustomButton>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {images.map((image: any) => (
                          <div 
                            key={image.id || `img-${Math.random()}`} 
                            className={`relative group cursor-pointer overflow-hidden rounded-md 
                              ${selectedImageId === String(image.id) ? 'ring-2 ring-orange-500' : ''}`}
                            onClick={() => handleImageSelected(getImageUrl(image), image.id, image.isPublic)}
                          >
                            {/* 이미지 크기 비율 유지를 위한 패딩 기법 */}
                            <div className="relative pb-[100%]">
                              <img
                                src={getImageUrl(image)}
                                alt={image.title || '내 이미지'}
                                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform"
                                style={{aspectRatio: getAspectRatio(image)}}
                                loading="lazy"
                                onError={(e) => {
                                  // 이미지 로드 실패 시 기본 이미지로 대체
                                  (e.target as HTMLImageElement).src = '/image/placeholder.png';
                                }}
                              />
                              
                              {/* 이미지 정보 오버레이 */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-white text-xs truncate">{image.title || '제목 없음'}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <div className="text-xs text-white/80">
                                    {getImageSizeText(image)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 더보기 버튼 */}
                      {hasNextPage && (
                        <div className="mt-6 text-center">
                          <CustomButton
                            variant="outline"
                            onClick={() => fetchNextPage()}
                            disabled={isFetchingNextPage}
                          >
                            {isFetchingNextPage ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                로딩 중...
                              </>
                            ) : '더 보기'}
                          </CustomButton>
                        </div>
                      )}
                    </>
                  )}
                </CustomCardContent>
              </CustomCard>
            </TabsContent>

            {/* 공개 이미지 탭 */}
            <TabsContent value="public-images">
              <CustomCard>
                <CustomCardContent className="pt-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">모든 공개 이미지</h3>
                    <div className="flex space-x-2">
                      <CustomButton 
                        variant="outline" 
                        size="sm"
                        onClick={() => refetchPublicImages()}
                        className="flex items-center gap-1"
                      >
                        <RefreshCw size={14} />
                        새로고침
                      </CustomButton>
                    </div>
                  </div>
                  
                  {/* 필터링 옵션 */}
                  <div className="flex flex-wrap gap-4 mb-6">
                    <div className="flex items-center gap-2">
                      <Filter size={16} />
                      <span className="text-sm">카테고리:</span>
                      <CustomSelect 
                        value={imageCategory} 
                        onValueChange={(val) => setImageCategory(val)}
                      >
                        <CustomSelectTrigger className="h-8 min-w-[120px]">
                          <CustomSelectValue />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="all">전체</CustomSelectItem>
                          <CustomSelectItem value="2d">2D</CustomSelectItem>
                          <CustomSelectItem value="2.5d">2.5D</CustomSelectItem>
                          <CustomSelectItem value="realistic">실사</CustomSelectItem>
                          <CustomSelectItem value="anime">애니메이션</CustomSelectItem>
                          <CustomSelectItem value="portrait">인물</CustomSelectItem>
                          <CustomSelectItem value="landscape">풍경</CustomSelectItem>
                          <CustomSelectItem value="concept">컨셉아트</CustomSelectItem>
                          <CustomSelectItem value="other">기타</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Clock size={16} />
                      <span className="text-sm">정렬:</span>
                      <CustomSelect 
                        value={imageSort} 
                        onValueChange={(val) => setImageSort(val)}
                      >
                        <CustomSelectTrigger className="h-8 min-w-[120px]">
                          <CustomSelectValue />
                        </CustomSelectTrigger>
                        <CustomSelectContent>
                          <CustomSelectItem value="created_at">최신순</CustomSelectItem>
                          <CustomSelectItem value="views">조회순</CustomSelectItem>
                          <CustomSelectItem value="downloads">다운로드순</CustomSelectItem>
                          <CustomSelectItem value="title">제목순</CustomSelectItem>
                        </CustomSelectContent>
                      </CustomSelect>
                      
                      <CustomButton 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc')}
                        className="h-8 px-2"
                      >
                        {sortDirection === 'asc' ? '오름차순' : '내림차순'}
                      </CustomButton>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-auto">
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={showAdultContent}
                          onChange={(e) => setShowAdultContent(e.target.checked)}
                          className="rounded"
                        />
                        성인 컨텐츠 표시
                      </label>
                    </div>
                  </div>
                  
                  {/* 이미지 그리드 */}
                  {isLoadingPublicImages ? (
                    <div className="flex justify-center items-center h-40">
                      <div className="animate-spin h-8 w-8 border-4 border-orange-500 rounded-full border-t-transparent"></div>
                    </div>
                  ) : publicImages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 space-y-4 border border-dashed rounded-lg text-center">
                      <p className="text-neutral-500">공개된 이미지가 없습니다</p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {publicImages.map((image: any) => (
                          <div 
                            key={image.id || `img-${Math.random()}`} 
                            className={`relative group cursor-pointer overflow-hidden rounded-md 
                              ${selectedImageId === String(image.id) ? 'ring-2 ring-orange-500' : ''}`}
                            onClick={() => handleImageSelected(getImageUrl(image), image.id, true)}
                          >
                            {/* 이미지 크기 비율 유지를 위한 패딩 기법 */}
                            <div className="relative pb-[100%]">
                              <img
                                src={getImageUrl(image)}
                                alt={image.title || '공개 이미지'}
                                className="absolute inset-0 w-full h-full object-cover transform group-hover:scale-105 transition-transform"
                                style={{aspectRatio: getAspectRatio(image)}}
                                loading="lazy"
                                onError={(e) => {
                                  // 이미지 로드 실패 시 기본 이미지로 대체
                                  (e.target as HTMLImageElement).src = '/image/no-image.png';
                                }}
                              />
                              
                              {/* 성인 콘텐츠 표시 */}
                              {image.isAdult && (
                                <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-1 py-0.5 rounded">
                                  19+
                                </div>
                              )}
                              
                              {/* 이미지 정보 오버레이 */}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                                <p className="text-white text-xs truncate">{image.title || '제목 없음'}</p>
                                <div className="flex items-center justify-between gap-1 mt-1">
                                  <div className="text-xs text-white/80">
                                    {getImageSizeText(image)}
                                  </div>
                                  {image.user && (
                                    <div className="text-xs text-white/80">
                                      {image.user.username || '익명'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* 더보기 버튼 */}
                      {hasNextPublicPage && (
                        <div className="mt-6 text-center">
                          <CustomButton
                            variant="outline"
                            onClick={() => fetchNextPublicPage()}
                            disabled={isFetchingNextPublicPage}
                          >
                            {isFetchingNextPublicPage ? (
                              <>
                                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                로딩 중...
                              </>
                            ) : '더 보기'}
                          </CustomButton>
                        </div>
                      )}
                    </>
                  )}
                </CustomCardContent>
              </CustomCard>
            </TabsContent>
          </Tabs>
        </div>
        
        {/* 오른쪽: 결과 및 옵션 영역 */}
        <div>
          <CustomCard className="mb-4 overflow-hidden">
            <CustomCardContent className="p-0">
              {selectedImage && selectedImage.trim() ? (
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
            </CustomCardContent>
          </CustomCard>
          
          <CustomCard>
            <CustomCardContent className="py-4">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">이미지 형식</span>
                  <CustomSelect 
                    value={imageFormat} 
                    onValueChange={setImageFormat}
                  >
                    <CustomSelectTrigger className="w-[120px]">
                      <CustomSelectValue placeholder="이미지 형식" />
                    </CustomSelectTrigger>
                    <CustomSelectContent>
                      <CustomSelectItem value="png">PNG</CustomSelectItem>
                      <CustomSelectItem value="jpg">JPG</CustomSelectItem>
                      <CustomSelectItem value="webp">WebP</CustomSelectItem>
                    </CustomSelectContent>
                  </CustomSelect>
                </div>
                
                {imageFormat !== 'png' && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm">이미지 품질</span>
                    <input
                      type="range"
                      min="0.5"
                      max="1"
                      step="0.1"
                      value={imageQuality}
                      className="w-[120px]"
                      onChange={(e) => {
                        const qualityValue = parseFloat(e.target.value);
                        setImageQuality(qualityValue);
                        localStorage.setItem('image_quality', String(qualityValue));
                      }}
                    />
                  </div>
                )}
                
                <div className="flex gap-2">
                  <CustomButton 
                    variant="outline" 
                    className="flex-1"
                    onClick={handleDownload}
                    disabled={!selectedImage}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    다운로드
                  </CustomButton>
                  <CustomButton 
                    variant={isSelectedImagePublic ? "secondary" : "outline"}
                    className="flex-1"
                    onClick={handleShare}
                    disabled={!selectedImage}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {isSelectedImagePublic ? "공유되었습니다" : "공유하기"}
                  </CustomButton>
                </div>
              </div>
            </CustomCardContent>
          </CustomCard>
        </div>
      </div>
      
      {/* 공유 다이얼로그 */}
      {isPublishOpen && selectedImageId && (
        <PublishDialog 
          imageId={selectedImageId} 
          isOpen={isPublishOpen}
          onOpenChange={(open) => setIsPublishOpen(open)}
          onSuccess={(imageId, title, category) => {
            toast.success(`이미지가 ${category} 카테고리로 공개되었습니다`);
            // 이미지 목록 새로고침
            refetchImages();
          }}
          defaultCategory="2d"
          imageUrl={selectedImage || undefined}
        />
      )}
      
      {/* 모달 추가 */}
      {isModalOpen && selectedImageId && selectedImage && (
        <ImageSelectModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          imageId={Number(selectedImageId)}
          imageUrl={selectedImage}
        />
      )}
    </div>
  );
} 