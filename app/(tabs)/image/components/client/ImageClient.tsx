"use client";

import { useState } from "react";
import GeneratedImage from "../GeneratedImage";
import TextToImageForm from "../TextToImageForm";

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