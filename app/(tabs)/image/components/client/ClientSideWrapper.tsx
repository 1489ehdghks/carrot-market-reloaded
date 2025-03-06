"use client";

import { useState } from "react";
import TextToImageForm from "../TextToImageForm";
import GeneratedImage from "../GeneratedImage";
import { DownloadIcon, Upload, Settings, Eye, EyeOff } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface RecommendationItem {
  title: string;
  prompt: string;
}

type ImageFormat = "png" | "jpg" | "webp";

export default function ClientSideWrapper() {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAiRecommendations, setShowAiRecommendations] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<ImageFormat>("png");
  
  const handleGenerationStart = () => {
    setIsGenerating(true);
    setError(null);
  };
  
  const handleGenerationComplete = (imageUrl: string, imageId: string) => {
    setGeneratedImageUrl(imageUrl);
    setGeneratedImageId(imageId);
    setIsGenerating(false);
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
      
      // 공유 URL 생성 (실제로는 API 호출 필요)
      const shareUrl = `${window.location.origin}/shared/${imageIdNum}`;
      
      // 클립보드에 복사
      await navigator.clipboard.writeText(shareUrl);
      toast.success("이미지가 공개되었으며 URL이 클립보드에 복사되었습니다");
    } catch (error) {
      console.error("이미지 공개 오류:", error);
      toast.error("이미지 공개 중 오류가 발생했습니다");
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
  
  return (
    <div className="container mx-auto px-4">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 왼쪽: 이미지 폼 영역 */}
        <div className="lg:col-span-5 space-y-4">
          <TextToImageForm 
            onGenerationStart={handleGenerationStart}
            onGenerationComplete={handleGenerationComplete}
            onError={handleGenerationError}
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
              {isGenerating && (
                <div className="h-[450px] flex items-center justify-center">
                  <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
                    <p className="text-neutral-400">이미지 생성 중...</p>
                  </div>
                </div>
              )}
              
              {generatedImageUrl && !isGenerating && (
                <div className="p-4">
                  <img
                    src={generatedImageUrl}
                    alt="생성된 이미지"
                    className="w-full h-auto max-h-[450px] object-contain mx-auto rounded-md"
                  />
                </div>
              )}
              
              {!isGenerating && !generatedImageUrl && (
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
            {generatedImageUrl && !isGenerating && (
              <div className="flex flex-wrap gap-3 items-center">
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
                  title="이미지 초기화" 
                  description="현재 생성된 이미지를 지웁니다. 새로운 이미지를 생성할 때 깨끗한 상태에서 시작할 수 있습니다."
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
          {generatedImageUrl && !isGenerating && (
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
    </div>
  );
} 