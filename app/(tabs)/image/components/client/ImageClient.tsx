"use client";

import { useState } from "react";
import GeneratedImage from "../shared/GeneratedImage";
import TextToImageForm from "../textToImage/TextToImageForm";

export default function ImageClient() {
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [generatedImageId, setGeneratedImageId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
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
  
  const handleUrlUpdate = (imageId: string, permanentUrl: string) => {
    console.log("영구 URL로 업데이트:", { imageId, permanentUrl });
    
    if (imageId === generatedImageId) {
      setGeneratedImageUrl(permanentUrl);
      console.log("이미지 URL이 영구 URL로 업데이트되었습니다:", permanentUrl);
    }
  };
  
  const handleResetImage = () => {
    setGeneratedImageUrl(null);
    setGeneratedImageId(null);
  };
  
  return (
    <>
      <div>
        <TextToImageForm 
          onGenerationStart={handleGenerationStart}
          onGenerationComplete={handleGenerationComplete}
          onError={handleGenerationError}
          onUrlUpdate={handleUrlUpdate}
        />
      </div>
      
      <div>
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-500 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        {isGenerating && (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-orange-500"></div>
          </div>
        )}
        
        {generatedImageUrl && !isGenerating && (
          <GeneratedImage 
            imageUrl={generatedImageUrl} 
            imageId={generatedImageId!} 
            onReset={handleResetImage}
          />
        )}
      </div>
    </>
  );
} 