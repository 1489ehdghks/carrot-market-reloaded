"use client";

import Image from "next/image";
import { useState, useEffect, useRef } from "react";
import { CustomTooltip } from "@/components/ui/custom-tooltip";
import ImagePublishButton from "./ImagePublishButton";
import { Button } from "@/components/ui/button";
import { DownloadIcon, RefreshCcw, Share2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { publishImage } from "../actions";
import { toast } from "sonner";

interface GeneratedImageProps {
  imageUrl: string;
  imageId: string | null;
  onReset: () => void;
}

export default function GeneratedImage({ imageUrl, imageId, onReset }: GeneratedImageProps) {
  const [showFormatOptions, setShowFormatOptions] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState<"png" | "jpg" | "webp">("png");
  const downloadLinkRef = useRef<HTMLAnchorElement>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [sharedUrl, setSharedUrl] = useState<string | null>(null);
  
  if (!imageUrl) return null;
  
  const handleDownload = async () => {
    try {
      // Get file name from URL
      const fileName = `image_${Date.now()}.${selectedFormat}`;
      
      // Create Blob URL for the image
      const response = await fetch(imageUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
      }
      
      const blobUrl = URL.createObjectURL(await response.blob());
      
      // Create an image element for format conversion
      const img = document.createElement('img') as HTMLImageElement;
      img.crossOrigin = "anonymous";
      
      img.onload = () => {
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // Draw image
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.error("Cannot get canvas 2D context");
          if (downloadLinkRef.current) {
            downloadLinkRef.current.href = blobUrl;
            downloadLinkRef.current.download = fileName;
            downloadLinkRef.current.click();
          }
          return;
        }
        
        // White background for JPG (handle PNG transparency)
        if (selectedFormat === 'jpg') {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
        
        ctx.drawImage(img, 0, 0);
        
        // Select mime type based on format
        let mimeType = 'image/png';
        if (selectedFormat === 'jpg') mimeType = 'image/jpeg';
        if (selectedFormat === 'webp') mimeType = 'image/webp';
        
        // Quality settings
        const quality = selectedFormat === 'png' ? 1.0 : 0.9;
        
        // Create blob from canvas
        canvas.toBlob((convertedBlob) => {
          if (!convertedBlob) {
            console.error("Failed to convert image format");
            
            // Fall back to original image
            if (downloadLinkRef.current) {
              downloadLinkRef.current.href = blobUrl;
              downloadLinkRef.current.download = fileName;
              downloadLinkRef.current.click();
            }
            return;
          }
          
          // Create object URL and trigger download
          const convertedUrl = URL.createObjectURL(convertedBlob);
          
          if (downloadLinkRef.current) {
            downloadLinkRef.current.href = convertedUrl;
            downloadLinkRef.current.download = fileName;
            downloadLinkRef.current.click();
            
            // Clean up object URLs
            setTimeout(() => {
              URL.revokeObjectURL(convertedUrl);
              URL.revokeObjectURL(blobUrl);
            }, 100);
          }
        }, mimeType, quality);
      };
      
      img.onerror = () => {
        console.error("Error loading image for conversion");
        
        // Fall back to original image download
        if (downloadLinkRef.current) {
          downloadLinkRef.current.href = blobUrl;
          downloadLinkRef.current.download = fileName;
          downloadLinkRef.current.click();
          
          // Clean up object URL
          setTimeout(() => {
            URL.revokeObjectURL(blobUrl);
          }, 100);
        }
      };
      
      // Start loading the image
      img.src = blobUrl;
      
    } catch (error) {
      console.error("Download error:", error);
      alert("Error downloading image. Please try again.");
    }
  };
  
  // 포맷 변경 함수 (실제 변환 로직 없이 단순 저장만 수행)
  const handleFormatChange = (format: "png" | "jpg" | "webp") => {
    setSelectedFormat(format);
    setShowFormatOptions(false);
  };
  
  // 클릭 이벤트 처리 (외부 클릭 시 드롭다운 닫기)
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(".format-selector")) {
        setShowFormatOptions(false);
      }
    };
    
    document.addEventListener("click", handleOutsideClick);
    return () => document.removeEventListener("click", handleOutsideClick);
  }, []);

  // 이미지 공유 핸들러
  const handleShare = async () => {
    try {
      setIsPublishing(true);
      
      if (!imageId) {
        toast.error("이미지 ID가 없습니다");
        return;
      }
      
      // imageId를 숫자로 변환 - publishImage 함수는 number 타입을 기대함
      const imageIdNum = parseInt(imageId, 10);
      if (isNaN(imageIdNum)) {
        toast.error("유효하지 않은 이미지 ID입니다");
        return;
      }
      
      // publishImage는 DB에서 업데이트된 이미지 객체를 반환함
      const updatedImage = await publishImage(imageIdNum);
      
      if (updatedImage && updatedImage.id) {
        // 공유 URL 생성 (이미지 데이터 사용)
        const shareUrl = `${window.location.origin}/shared/${updatedImage.id}`;
        setSharedUrl(shareUrl);
        toast.success("이미지가 성공적으로 공유되었습니다");
        
        // 클립보드에 URL 복사
        await navigator.clipboard.writeText(shareUrl);
        toast.success("URL이 클립보드에 복사되었습니다");
      } else {
        toast.error("이미지 공유에 실패했습니다");
      }
    } catch (error) {
      console.error("이미지 공유 중 오류 발생:", error);
      toast.error(error instanceof Error ? error.message : "이미지 공유 중 오류가 발생했습니다");
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="mt-8 rounded-xl border border-neutral-800 bg-neutral-900/50 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-medium">생성된 이미지</h2>
      </div>
      
      <div className="relative aspect-square w-full sm:w-3/4 md:w-2/3 lg:w-1/2 mx-auto rounded-lg overflow-hidden shadow-lg">
        <Image
          src={imageUrl}
          alt="생성된 이미지"
          fill
          className="object-contain"
        />
      </div>
      
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {/* 숨겨진 다운로드 링크 */}
        <a ref={downloadLinkRef} className="hidden" />
        
        <div className="relative format-selector">
          <button
            onClick={handleDownload}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors flex items-center gap-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            다운로드
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowFormatOptions(!showFormatOptions);
            }}
            className="px-2 py-2.5 bg-neutral-800 hover:bg-neutral-700 border-l border-neutral-700 rounded-r-lg transition-colors ml-[-1px]"
          >
            <div className="flex items-center">
              <span className="mr-1 text-xs uppercase">{selectedFormat}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
          
          {showFormatOptions && (
            <div className="absolute top-full left-0 mt-1 bg-neutral-800 rounded-lg border border-neutral-700 shadow-lg z-10">
              <div className="p-1">
                {["png", "jpg", "webp"].map((format) => (
                  <button
                    key={format}
                    className={`block w-full text-left px-3 py-2 text-sm rounded ${
                      selectedFormat === format ? "bg-neutral-700" : "hover:bg-neutral-700"
                    }`}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleFormatChange(format as "png" | "jpg" | "webp");
                    }}
                  >
                    {format.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        
        <CustomTooltip
          title="이미지 공개하기"
          description="이미지를 갤러리에 공개하면 다른 사용자들이 볼 수 있습니다. 공개된 이미지는 영구적으로 저장됩니다."
          content={
            <div>
              <p className="text-sm text-neutral-400">- 공개된 이미지는 모든 사용자에게 노출됩니다</p>
              <p className="text-sm text-neutral-400">- 이미지 URL이 영구적으로 저장됩니다</p>
              <p className="text-sm text-neutral-400">- 한번 공개된 이미지는 비공개로 전환할 수 없습니다</p>
            </div>
          }
        >
          <div>
            <ImagePublishButton imageId={imageId} />
          </div>
        </CustomTooltip>
      </div>
      
      <div className="mt-4">
        <Tabs defaultValue="download" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="download">다운로드</TabsTrigger>
            <TabsTrigger value="share">공유</TabsTrigger>
          </TabsList>
          
          <TabsContent value="download" className="space-y-4 py-2">
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant={selectedFormat === "png" ? "default" : "outline"}
                className="w-full"
                onClick={() => handleFormatChange("png")}
              >
                PNG
              </Button>
              <Button
                variant={selectedFormat === "jpg" ? "default" : "outline"}
                className="w-full"
                onClick={() => handleFormatChange("jpg")}
              >
                JPG
              </Button>
              <Button
                variant={selectedFormat === "webp" ? "default" : "outline"}
                className="w-full"
                onClick={() => handleFormatChange("webp")}
              >
                WEBP
              </Button>
            </div>
            
            <Button 
              className="w-full"
              onClick={handleDownload}
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              다운로드
            </Button>
          </TabsContent>
          
          <TabsContent value="share" className="space-y-4 py-2">
            {sharedUrl ? (
              <div className="space-y-2">
                <p className="text-sm text-neutral-400">이미지가 공개되었습니다:</p>
                <div className="flex items-center">
                  <input 
                    type="text" 
                    value={sharedUrl} 
                    readOnly
                    className="flex-1 bg-neutral-800 p-2 rounded-l-md text-sm"
                  />
                  <Button
                    className="rounded-l-none"
                    onClick={async () => {
                      await navigator.clipboard.writeText(sharedUrl);
                      toast.success("URL이 복사되었습니다");
                    }}
                  >
                    복사
                  </Button>
                </div>
              </div>
            ) : (
              <Button 
                className="w-full" 
                onClick={handleShare}
                disabled={isPublishing}
              >
                {isPublishing ? (
                  <>
                    <RefreshCcw className="mr-2 h-4 w-4 animate-spin" />
                    처리중...
                  </>
                ) : (
                  <>
                    <Share2 className="mr-2 h-4 w-4" />
                    이미지 공유하기
                  </>
                )}
              </Button>
            )}
            <p className="text-xs text-neutral-500">
              공유하면 다른 사람들이 이 이미지를 볼 수 있습니다.
            </p>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
} 