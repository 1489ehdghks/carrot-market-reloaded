"use client";

import { useState, useEffect, useRef } from "react";
import { useSearchParams } from 'next/navigation';
import TextToImageForm from "../TextToImageForm";
import GeneratedImage from "../GeneratedImage";
import { DownloadIcon, Upload, Settings, Eye, EyeOff, RefreshCw, X, AlertCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

interface RecommendationItem {
  title: string;
  prompt: string;
}

type ImageFormat = "png" | "jpg" | "webp";

export default function ClientSideWrapper() {
  const searchParams = useSearchParams();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>("png");
  const [loadingImageData, setLoadingImageData] = useState<boolean>(false);
  const [imageData, setImageData] = useState<any | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [showQrCode, setShowQrCode] = useState<boolean>(false);
  const [isInpaintMode, setIsInpaintMode] = useState<boolean>(false);
  const [inpaintPrompt, setInpaintPrompt] = useState<string>("");
  const [maskCanvas, setMaskCanvas] = useState<HTMLCanvasElement | null>(null);
  const [isImageModalOpen, setIsImageModalOpen] = useState<boolean>(false);
  const [fullSizeImageUrl, setFullSizeImageUrl] = useState<string | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [imageLoadError, setImageLoadError] = useState<boolean>(false);
  const defaultVariant = "normal";
  
  // URL에서 imageId를 가져와 이미지 데이터 로드
  useEffect(() => {
    const imageId = searchParams.get('imageId');
    if (imageId) {
      fetchImageData(parseInt(imageId));
    }
  }, [searchParams]);
  
  // 이미지 데이터 가져오기
  const fetchImageData = async (imageId: number) => {
    if (!imageId || isNaN(imageId)) return;
    
    try {
      setLoadingImageData(true);
      setImageLoadError(false);
      const response = await fetch(`/api/images/${imageId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '이미지를 불러오는데 실패했습니다');
      }
      
      const data = await response.json();
      
      if (!data.success || !data.image) {
        throw new Error('이미지 데이터가 유효하지 않습니다');
      }
      
      // 이미지 데이터 설정
      setImageData(data.image);
      // 고품질 URL로 변환하여 설정
      const optimizedUrl = getOptimizedImageUrl(data.image.fileUrl);
      setGeneratedImageUrl(optimizedUrl);
      setGeneratedImageId(data.image.id.toString());
      
      toast.success('이미지를 불러왔습니다');
    } catch (error: any) {
      console.error('이미지 로드 오류:', error);
      toast.error(error.message || '이미지를 불러오는데 실패했습니다');
      setImageLoadError(true);
    } finally {
      setLoadingImageData(false);
    }
  };
  
  // 이미지 생성 설정을 에디터에 적용
  const applyImageSettings = () => {
    if (!imageData || !imageData.settings) {
      toast.error('이미지 설정을 불러올 수 없습니다');
      return;
    }
    
    // 로컬 스토리지에 이미지 설정 저장
    if (imageData.settings.prompt) localStorage.setItem('textPrompt', imageData.settings.prompt);
    if (imageData.settings.negativePrompt) localStorage.setItem('negativePrompt', imageData.settings.negativePrompt);
    
    // 사이즈 처리 (width x height 형식)
    if (imageData.settings.width && imageData.settings.height) {
      localStorage.setItem('size', `${imageData.settings.width}x${imageData.settings.height}`);
    }
    
    if (imageData.settings.modelId) localStorage.setItem('model', imageData.settings.modelId);
    if (imageData.settings.steps) localStorage.setItem('steps', imageData.settings.steps.toString());
    if (imageData.settings.cfgScale) localStorage.setItem('cfgScale', imageData.settings.cfgScale.toString());
    if (imageData.settings.sampler) localStorage.setItem('sampler', imageData.settings.sampler);
    if (imageData.settings.vae) localStorage.setItem('vae', imageData.settings.vae);
    
    toast.success('이미지 설정이 에디터에 적용되었습니다');
    window.location.href = '/image'; // 설정을 적용한 후 새로고침
  };
  
  const handleGenerationStart = () => {
    setIsGenerating(true);
    setError(null);
  };
  
  const handleGenerationComplete = (imageUrl: string, imageId: string) => {
    console.log("이미지 생성 완료:", { imageUrl, imageId });
    
    // 안전한 로깅을 위한 타입 체크 추가
    console.log(`이미지 URL 타입: ${typeof imageUrl}`);
    if (typeof imageUrl === 'string') {
      console.log(`이미지 URL 길이: ${imageUrl.length}`);
      console.log(`이미지 URL: ${imageUrl.substring(0, 100)}${imageUrl.length > 100 ? '...' : ''}`);
    } else {
      console.log(`이미지 URL이 문자열이 아닙니다:`, imageUrl);
    }
    
    // URL이 문자열이 아닌 경우 처리
    if (typeof imageUrl !== 'string') {
      toast.error("생성된 이미지 URL이 유효하지 않습니다");
      return;
    }
    
    setGeneratedImageUrl(imageUrl);
    setGeneratedImageId(imageId);
    setIsGenerating(false);
    toast.success("이미지가 성공적으로 생성되었습니다");
    
    // URL이 정상적으로 적용되었는지 확인
    setTimeout(() => {
      console.log("현재 상태 확인:", { 
        url: generatedImageUrl,
        id: generatedImageId,
        isGenerating
      });
    }, 100);
  };
  
  // 영구 URL로 업데이트하는 함수
  const handleUrlUpdate = (imageId: string, permanentUrl: string) => {
    console.log("영구 URL로 업데이트:", { imageId, permanentUrl });
    
    // 현재 표시 중인 이미지의 ID와 일치하는 경우에만 업데이트
    if (imageId === generatedImageId) {
      setGeneratedImageUrl(permanentUrl);
      console.log("이미지 URL이 영구 URL로 업데이트되었습니다:", permanentUrl);
      
      // 조용히 업데이트 (토스트 알림 없음)
      // 또는 사용자에게 알림을 표시할 수도 있음
      // toast.success("이미지가 영구 저장소에 저장되었습니다");
    }
  };
  
  const handleGenerationError = (error: string) => {
    setError(error);
    setIsGenerating(false);
  };
  
  const handleResetImage = () => {
    setGeneratedImageUrl(null);
    setGeneratedImageId(null);
  };
  
  // 다운로드 버튼 핸들러
  const handleDownload = async () => {
    if (!generatedImageUrl) return;
    
    try {
      setIsDownloading(true);
      // 파일 이름 생성 (타임스탬프 추가)
      const fileName = `image_${Date.now()}.${selectedFormat}`;
      
      // 이미지 가져오기
      const response = await fetch(generatedImageUrl);
      if (!response.ok) {
        throw new Error("이미지를 가져오는데 실패했습니다");
      }
      
      const blob = await response.blob();
      
      // 이미지 포맷 변환 (필요한 경우)
      let downloadBlob = blob;
      if (selectedFormat !== "png") {
        const img = document.createElement('img');
        img.src = URL.createObjectURL(blob);
        
        await new Promise(resolve => {
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              canvas.toBlob(
                newBlob => {
                  if (newBlob) downloadBlob = newBlob;
                  resolve(null);
                },
                `image/${selectedFormat}`,
                selectedFormat === 'jpg' ? 0.95 : 1
              );
            } else {
              resolve(null);
            }
          };
        });
        
        URL.revokeObjectURL(img.src);
      }
      
      // 브라우저에서 다운로드 링크 생성 및 클릭
      const downloadUrl = URL.createObjectURL(downloadBlob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // 리소스 해제
      setTimeout(() => URL.revokeObjectURL(downloadUrl), 100);
      toast.success(`이미지가 ${selectedFormat.toUpperCase()} 형식으로 다운로드되었습니다`);
    } catch (error) {
      console.error("다운로드 오류:", error);
      toast.error("다운로드 중 오류가 발생했습니다");
    } finally {
      setIsDownloading(false);
    }
  };
  
  // 이미지 공개 버튼 핸들러
  const handlePublish = async () => {
    if (!generatedImageId) return;
    
    try {
      setIsPublishing(true);
      // 공개 처리 로직
      const imageIdNum = parseInt(generatedImageId, 10);
      
      if (isNaN(imageIdNum)) {
        throw new Error("유효하지 않은 이미지 ID입니다");
      }
      
      // 공개 API 호출
      const response = await fetch(`/api/images/${imageIdNum}/publish`, {
        method: 'POST',
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || "이미지 공개 중 오류가 발생했습니다");
      }
      
      const result = await response.json();
      
      // 공유 URL 생성
      const shareUrl = `${window.location.origin}/shared/${imageIdNum}`;
      setPublishedUrl(shareUrl);
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      toast.success("이미지가 공개되었으며 URL이 클립보드에 복사되었습니다");
    } catch (error: any) {
      console.error("이미지 공개 오류:", error);
      toast.error(error.message || "이미지 공개 중 오류가 발생했습니다");
    } finally {
      setIsPublishing(false);
    }
  };
  
  // AI 설정 버튼 핸들러
  const handleAiSettings = () => {
    toast.info("AI 추천 설정이 곧 추가될 예정입니다");
  };

  // AI 추천 프롬프트 데이터
  const aiRecommendations: RecommendationItem[] = [
    {
      title: "더 선명한 이미지",
      prompt: "같은 구도에서 더 선명하고 디테일한 이미지로 표현하기, 고해상도, 선명한 디테일",
    },
    {
      title: "다른 시간대",
      prompt: "같은 장면을 일몰 시간대에 연출, 황금빛 조명, 긴 그림자, 따뜻한 색조",
    },
    {
      title: "다른 스타일",
      prompt: "같은 구도를 수채화 스타일로 표현, 부드러운 색상, 물감 번짐 효과, 예술적 표현",
    },
    {
      title: "배경 변경",
      prompt: "같은 주제를 새로운 환경에서 연출, 다른 배경, 새로운 분위기, 대비되는 장면",
    }
  ];
  
  // 인페인팅 모드 토글 함수
  const toggleInpaintMode = () => {
    if (isInpaintMode) {
      // 인페인팅 모드 종료
      setIsInpaintMode(false);
      // 마스크 캔버스 초기화
      if (maskCanvas) {
        const ctx = maskCanvas.getContext('2d');
        if (ctx) {
          ctx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
        }
      }
    } else {
      // 인페인팅 모드 시작
      setIsInpaintMode(true);
      // 기존 프롬프트가 있다면 재사용
      if (imageData?.settings?.prompt) {
        setInpaintPrompt(imageData.settings.prompt);
      }
    }
  };
  
  // 인페인팅 적용 함수
  const applyInpainting = async () => {
    if (!maskCanvas || !generatedImageUrl || !inpaintPrompt) {
      toast.error("인페인팅에 필요한 정보가 부족합니다");
      return;
    }
    
    try {
      setIsGenerating(true);
      
      // 마스크 이미지를 base64로 변환
      const maskDataUrl = maskCanvas.toDataURL('image/png');
      
      // 인페인팅 API 호출
      const response = await fetch('/api/inpaint', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          imageUrl: generatedImageUrl,
          maskDataUrl: maskDataUrl,
          prompt: inpaintPrompt
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.error || '인페인팅 처리 중 오류가 발생했습니다');
      }
      
      const result = await response.json();
      
      // 결과 이미지 적용
      if (result.imageUrl && typeof result.imageUrl === 'string') {
        setGeneratedImageUrl(result.imageUrl);
        if (result.imageId) {
          setGeneratedImageId(result.imageId);
        }
        toast.success("인페인팅이 성공적으로 적용되었습니다");
      } else {
        throw new Error("인페인팅 결과가 유효하지 않습니다");
      }
      
      // 인페인팅 모드 종료
      setIsInpaintMode(false);
    } catch (error: any) {
      console.error("인페인팅 오류:", error);
      toast.error(error.message || "인페인팅 처리 중 오류가 발생했습니다");
    } finally {
      setIsGenerating(false);
    }
  };
  
  // 마스크 캔버스 초기화 함수
  const initMaskCanvas = (imgElement: HTMLImageElement) => {
    if (!imgElement) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = imgElement.naturalWidth;
    canvas.height = imgElement.naturalHeight;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      ctx.fillStyle = 'rgba(0,0,0,0)';
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    setMaskCanvas(canvas);
  };
  
  // 이미지 URL 최적화 함수 - 고품질 변형자 사용
  const getOptimizedImageUrl = (url: string): string => {
    // URL이 없는 경우 빈 문자열 반환
    if (!url) return '';
    
    // Cloudflare 이미지 URL 형식 확인 (https://imagedelivery.net/account/id/variant)
    if (url.includes('imagedelivery.net')) {
      try {
        // URL의 변형자 부분을 확인
        const urlParts = url.split('/');
        if (urlParts.length >= 4) {
          // public이나 thumbnail 등 저품질 변형자를 고품질로 교체
          const variant = urlParts[urlParts.length - 1];
          if (variant === 'public' || variant.includes('thumbnail')) {
            urlParts[urlParts.length - 1] = defaultVariant;
            return urlParts.join('/');
          }
        }
      } catch (error) {
        console.error("URL 변환 오류:", error);
      }
    }
    
    return url;
  };
  
  // 이미지 다시 불러오기 함수 - DB에서 재로드
  const reloadImage = () => {
    if (generatedImageId) {
      // DB에서 이미지 다시 로드
      const imageId = parseInt(generatedImageId);
      if (!isNaN(imageId)) {
        toast.info('이미지를 다시 불러오는 중...');
        fetchImageData(imageId);
      }
    } else if (generatedImageUrl) {
      // URL만 있는 경우 캐시 갱신
      setImageLoadError(false);
      const timestamp = Date.now();
      const optimizedUrl = getOptimizedImageUrl(generatedImageUrl) + `?t=${timestamp}`;
      
      // 이미지 요소 찾아서 src 변경
      const imgElement = document.querySelector('.generated-image') as HTMLImageElement;
      if (imgElement) {
        imgElement.src = optimizedUrl;
      }
      
      toast.info('이미지를 새로고침합니다...');
    }
  };
  
  // 이미지 클릭 핸들러 - 모달 열기
  const handleImageClick = () => {
    if (generatedImageUrl) {
      // 항상 고품질 URL 사용
      const highQualityUrl = getOptimizedImageUrl(generatedImageUrl);
      setFullSizeImageUrl(highQualityUrl);
      setIsImageModalOpen(true);
      
      // 스크롤 비활성화
      document.body.style.overflow = 'hidden';
    }
  };
  
  // 모달 닫기 핸들러
  const handleCloseModal = () => {
    setIsImageModalOpen(false);
    setFullSizeImageUrl(null);
    
    // 스크롤 활성화
    document.body.style.overflow = 'auto';
  };
  
  // 모달 외부 클릭 시 닫기
  const handleClickOutside = (e: React.MouseEvent<HTMLDivElement>) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      handleCloseModal();
    }
  };
  
  // 컴포넌트 언마운트 시 스크롤 복구
  useEffect(() => {
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽: 이미지 폼 영역 */}
        <div className="lg:col-span-5 space-y-4">
          <TextToImageForm 
            onGenerationStart={handleGenerationStart}
            onGenerationComplete={handleGenerationComplete}
            onError={handleGenerationError}
            onUrlUpdate={handleUrlUpdate}
          />
        </div>
        
        {/* 오른쪽: 이미지 결과 영역 */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg">
              {error}
            </div>
          )}
          
          {/* 이미지 표시 영역 */}
          <div className="space-y-4">
            <div className="w-full border border-neutral-800 rounded-lg bg-neutral-900 overflow-hidden">
              {(isGenerating || loadingImageData) && (
                <div className="h-[450px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="text-neutral-400">{loadingImageData ? '이미지 불러오는 중...' : '이미지 생성 중...'}</p>
                  </div>
                </div>
              )}
              
              {generatedImageUrl && !isGenerating && !loadingImageData && (
                <div className="p-4 relative">
                  <div className="relative">
                    <img
                      src={getOptimizedImageUrl(generatedImageUrl)}
                      alt="생성된 이미지"
                      className="w-full h-auto max-h-[450px] object-contain mx-auto rounded-md cursor-pointer transition-transform hover:brightness-110 generated-image"
                      onClick={handleImageClick}
                      onLoad={(e) => {
                        console.log("이미지 로드 성공:", generatedImageUrl);
                        setImageLoadError(false);
                        // 마스크 캔버스 초기화
                        initMaskCanvas(e.target as HTMLImageElement);
                      }}
                      onError={(e) => {
                        console.error("이미지 로드 실패:", generatedImageUrl, e);
                        setImageLoadError(true);
                      }}
                    />
                    
                    {/* 이미지 로드 실패 시 오버레이 */}
                    {imageLoadError && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 rounded-md">
                        <AlertCircle className="w-12 h-12 text-orange-500 mb-3" />
                        <p className="text-white mb-4">이미지를 불러오는데 실패했습니다</p>
                        <button
                          onClick={reloadImage}
                          className="flex items-center gap-2 px-4 py-2 bg-orange-600 hover:bg-orange-500 rounded-md transition-colors"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>이미지 다시 불러오기</span>
                        </button>
                      </div>
                    )}
                    
                    {/* 새로고침 버튼 - 크기 키우고 더 눈에 띄게 */}
                    <Button
                      className="absolute bottom-4 right-4 p-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center gap-2 shadow-md"
                      variant="outline"
                      onClick={reloadImage}
                    >
                      <RefreshCw className="w-5 h-5" />
                      <span>이미지 새로고침</span>
                    </Button>
                  </div>
                  
                  {/* 인페인팅 캔버스 오버레이 (인페인팅 모드일 때만 표시) */}
                  {isInpaintMode && maskCanvas && (
                    <div className="absolute inset-0 flex justify-center">
                      <canvas 
                        ref={(ref) => {
                          if (ref && maskCanvas) {
                            // 캔버스 참조 연결
                            ref.width = maskCanvas.width;
                            ref.height = maskCanvas.height;
                            // 기존 마스크 데이터 복사
                            const ctx = ref.getContext('2d');
                            if (ctx) {
                              ctx.drawImage(maskCanvas, 0, 0);
                            }
                            
                            // 마우스 이벤트 리스너
                            let isDrawing = false;
                            
                            ref.onmousedown = (e) => {
                              isDrawing = true;
                              const ctx = ref.getContext('2d');
                              if (ctx) {
                                const rect = ref.getBoundingClientRect();
                                const scaleX = ref.width / rect.width;
                                const scaleY = ref.height / rect.height;
                                const x = (e.clientX - rect.left) * scaleX;
                                const y = (e.clientY - rect.top) * scaleY;
                                
                                ctx.beginPath();
                                ctx.arc(x, y, 10, 0, Math.PI * 2);
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                                ctx.fill();
                              }
                            };
                            
                            ref.onmousemove = (e) => {
                              if (!isDrawing) return;
                              const ctx = ref.getContext('2d');
                              if (ctx) {
                                const rect = ref.getBoundingClientRect();
                                const scaleX = ref.width / rect.width;
                                const scaleY = ref.height / rect.height;
                                const x = (e.clientX - rect.left) * scaleX;
                                const y = (e.clientY - rect.top) * scaleY;
                                
                                ctx.beginPath();
                                ctx.arc(x, y, 10, 0, Math.PI * 2);
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                                ctx.fill();
                              }
                            };
                            
                            ref.onmouseup = () => {
                              isDrawing = false;
                              // 마스크 캔버스에 그린 내용 저장
                              const ctx = maskCanvas.getContext('2d');
                              if (ctx) {
                                ctx.drawImage(ref, 0, 0);
                              }
                            };
                            
                            ref.onmouseleave = () => {
                              isDrawing = false;
                            };
                          }
                        }}
                        className="w-full h-auto max-h-[450px] object-contain mx-auto rounded-md pointer-events-auto"
                        style={{ cursor: 'crosshair' }}
                      />
                    </div>
                  )}
                  
                  {/* 인페인팅 모드일 때 보이는 컨트롤 패널 */}
                  {isInpaintMode && (
                    <div className="absolute bottom-4 left-4 right-4 bg-black/70 p-3 rounded-lg">
                      <div className="mb-2">
                        <input
                          type="text"
                          value={inpaintPrompt}
                          onChange={(e) => setInpaintPrompt(e.target.value)}
                          className="w-full p-2 rounded bg-neutral-800 text-white"
                          placeholder="인페인팅 프롬프트 입력..."
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => setIsInpaintMode(false)}
                          className="px-3 py-1 bg-neutral-700 rounded hover:bg-neutral-600"
                        >
                          취소
                        </button>
                        <button
                          onClick={applyInpainting}
                          className="px-3 py-1 bg-orange-600 rounded hover:bg-orange-500"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Inpainting 아이콘 수정 */}
                  <CustomTooltip 
                    title="이미지 편집" 
                    description="이미지 부분 편집(Inpainting)를 통해 이미지의 특정 영역만 수정할 수 있습니다. 클릭하여 편집을 시작하세요."
                  >
                    <button 
                      className={`absolute top-6 right-6 p-2 ${isInpaintMode ? 'bg-orange-500' : 'bg-black/50 hover:bg-black/70'} rounded-full transition-colors`}
                      onClick={toggleInpaintMode}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 19l7-7 3 3-7 7-3-3z"></path>
                        <path d="M18 13l-1.5-7.5L2 2l3.5 14.5L13 18l5-5z"></path>
                        <path d="M2 2l7.586 7.586"></path>
                        <circle cx="11" cy="11" r="2"></circle>
                      </svg>
                    </button>
                  </CustomTooltip>
                </div>
              )}
              
              {!isGenerating && !generatedImageUrl && !loadingImageData && (
                <div className="h-[450px] flex items-center justify-center text-neutral-400">
                  <div className="text-center p-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto mb-4 text-neutral-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-lg">이미지가 여기에 생성됩니다</p>
                    <p className="text-sm text-neutral-500 mt-2">왼쪽 폼에서 프롬프트를 입력하고 이미지를 생성해보세요</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* 이미지 작업 버튼 영역 */}
            {generatedImageUrl && !isGenerating && !loadingImageData && (
              <div className="flex flex-wrap gap-3 items-center">
                {/* 이미지 설정 적용 버튼 - 이미지가 URL 파라미터로 로드된 경우에만 표시 */}
                {imageData && (
                  <Button
                    onClick={applyImageSettings}
                    variant="outline"
                    className="h-10 px-4 bg-blue-900/30 hover:bg-blue-800/40 text-blue-400 border-blue-800"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    설정 적용
                  </Button>
                )}
                
                <div className="flex-shrink-0">
                  <Select
                    value={selectedFormat}
                    onValueChange={(value) => setSelectedFormat(value as ImageFormat)}
                  >
                    <SelectTrigger className="w-24 h-10 bg-neutral-800 border-neutral-700">
                      <SelectValue placeholder="포맷" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="jpg">JPG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <CustomTooltip 
                  title="이미지 다운로드" 
                  description="선택한 포맷으로 이미지를 다운로드합니다. PNG는 투명 배경을 지원하고, JPG는 파일 크기가 작으며, WEBP는 최신 웹 최적화 포맷입니다."
                >
                  <button
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isDownloading ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <DownloadIcon className="w-4 h-4" />
                    )}
                    <span>다운로드</span>
                  </button>
                </CustomTooltip>
                
                <CustomTooltip 
                  title="이미지 공개" 
                  description="이미지를 공개 상태로 설정하고 공유 URL을 클립보드에 복사합니다. 누구나 링크를 통해 이미지를 볼 수 있게 됩니다."
                >
                  <button
                    onClick={handlePublish}
                    disabled={isPublishing}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors disabled:opacity-50"
                  >
                    {isPublishing ? (
                      <div className="w-4 h-4 border-2 border-t-transparent border-white rounded-full animate-spin"></div>
                    ) : (
                      <Upload className="w-4 h-4" />
                    )}
                    <span>이미지 공개</span>
                  </button>
                </CustomTooltip>
                
                <CustomTooltip 
                  title="이미지 내리기" 
                  description="현재 이미지를 보이지 않도록 합니다."
                >
                  <button
                    onClick={handleResetImage}
                    className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors ml-auto"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
                    </svg>
                    <span>초기화</span>
                  </button>
                </CustomTooltip>
              </div>
            )}
          </div>
          
          {/* AI 추천 프롬프트 영역 */}
          {generatedImageUrl && !isGenerating && !loadingImageData && (
            <div className="mt-6 border border-neutral-800 rounded-lg p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium">AI 추천 프롬프트</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-neutral-400">
                      {showAiRecommendations ? '켜짐' : '꺼짐'}
                    </span>
                    <Switch
                      checked={showAiRecommendations}
                      onCheckedChange={setShowAiRecommendations}
                    />
                  </div>
                  <button
                    onClick={handleAiSettings}
                    className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-full"
                  >
                    <Settings className="w-5 h-5" />
                  </button>
                </div>
              </div>
              
              {showAiRecommendations ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {aiRecommendations.map((rec, index) => (
                    <button
                      key={index}
                      className="p-4 text-left border border-neutral-700 rounded-lg bg-neutral-800/50 hover:border-orange-500 hover:bg-neutral-800 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{rec.title}</h4>
                        <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">추천</span>
                      </div>
                      <p className="text-sm text-neutral-400 line-clamp-2">{rec.prompt}</p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center p-6 bg-neutral-800/30 rounded-lg">
                  <EyeOff className="w-10 h-10 text-neutral-500 mb-3" />
                  <p className="text-neutral-400">AI 추천 프롬프트 기능이 비활성화되었습니다</p>
                  <p className="text-sm text-neutral-500 mt-1">기능을 활성화하려면 스위치를 켜세요</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* 이미지 확대 모달 - 품질 선택 제거 */}
      {isImageModalOpen && fullSizeImageUrl && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
          onClick={handleClickOutside}
        >
          <div 
            ref={modalRef}
            className="relative max-w-[95vw] max-h-[95vh] overflow-auto"
          >
            {/* 모달 상단의 품질 선택 제거하고 새로고침 버튼만 유지 */}
            <button
              onClick={(e) => {
                e.stopPropagation(); // 모달 닫힘 방지
                // 기본 고품질 변형자로 새로고침
                const optimizedUrl = getOptimizedImageUrl(generatedImageUrl || '');
                setFullSizeImageUrl(optimizedUrl + `?t=${Date.now()}`);
                toast.info('이미지를 새로고침합니다...');
              }}
              className="absolute top-4 left-4 p-3 bg-black/50 hover:bg-black/70 rounded-lg z-10 transition-colors flex items-center gap-2"
              aria-label="새로고침"
            >
              <RefreshCw className="w-5 h-5" />
              <span>새로고침</span>
            </button>
            
            <button
              onClick={handleCloseModal}
              className="absolute top-4 right-4 p-2 bg-black/50 hover:bg-black/70 rounded-full z-10 transition-colors"
              aria-label="닫기"
            >
              <X className="w-6 h-6" />
            </button>
            
            <img
              src={fullSizeImageUrl}
              alt="확대된 이미지"
              className="max-w-full max-h-[95vh] object-contain"
              onError={(e) => {
                toast.error("이미지 로드 실패, 다시 시도합니다");
                // URL만 갱신
                setTimeout(() => {
                  if (generatedImageUrl) {
                    const optimizedUrl = getOptimizedImageUrl(generatedImageUrl);
                    setFullSizeImageUrl(optimizedUrl + `?t=${Date.now()}`);
                  }
                }, 100);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 