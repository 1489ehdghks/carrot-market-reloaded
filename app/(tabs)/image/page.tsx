"use client";

import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import TextToImageForm from "./components/TextToImageForm";
import ImageToImageForm from "./components/ImageToImageForm";
import GeneratedImage from "./components/GeneratedImage";

export default function ImageGenerationPage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleGenerationStart = () => {
    setIsGenerating(true);
    setError(null);
  };
  
  const handleGenerationComplete = (imageUrl: string, imageId: number) => {
    setGeneratedImage(imageUrl);
    setGeneratedImageId(imageId);
    setIsGenerating(false);
  };
  
  const handleError = (message: string) => {
    setError(message);
    setIsGenerating(false);
  };
  
  const resetImage = () => {
    setGeneratedImage(null);
    setGeneratedImageId(null);
  };

  return (
    <div className="flex flex-col md:flex-row h-full">
      {/* 왼쪽 컨트롤 패널 */}
      <div className="w-full md:w-[400px] lg:w-[450px] p-4 border-r border-neutral-800 h-full overflow-y-auto">
        <h1 className="text-2xl font-bold mb-6">AI 이미지 생성</h1>
        
        <Tabs defaultValue="text2image" className="w-full">
          <TabsList className="mb-4 w-full grid grid-cols-2">
            <TabsTrigger value="text2image">Text to Image</TabsTrigger>
            <TabsTrigger value="image2image">Image to Image</TabsTrigger>
          </TabsList>
          
          <TabsContent value="text2image" className="space-y-4 pb-20">
            <TextToImageForm 
              onGenerationStart={handleGenerationStart}
              onGenerationComplete={handleGenerationComplete}
              onError={handleError}
              compact={true}
            />
          </TabsContent>
          
          <TabsContent value="image2image" className="space-y-4 pb-20">
            <ImageToImageForm
              onGenerationStart={handleGenerationStart}
              onGenerationComplete={handleGenerationComplete}
              onError={handleError}
              compact={true}
            />
          </TabsContent>
        </Tabs>
        
        {error && (
          <div className="p-4 bg-red-900/50 border border-red-800 rounded-lg mt-4">
            {error}
          </div>
        )}
      </div>
      
      {/* 오른쪽 결과 패널 */}
      <div className="flex-1 p-4 bg-neutral-950 overflow-y-auto">
        {isGenerating ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 border-4 border-t-orange-500 border-neutral-700 rounded-full animate-spin" />
            <p className="mt-4 text-neutral-400">AI가 이미지를 처리하고 있습니다...</p>
          </div>
        ) : generatedImage ? (
          <GeneratedImage 
            imageUrl={generatedImage}
            imageId={generatedImageId}
            onReset={resetImage}
          />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center text-neutral-500">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <h3 className="text-xl font-medium mb-2">이미지가 여기에 표시됩니다</h3>
            <p className="max-w-md">
              왼쪽 패널에서 프롬프트와 모델을 선택한 후 이미지 생성하기 버튼을 클릭하세요.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 