"use client";

import { useState, useRef, useEffect } from "react";
import { generateImageWithFlux } from "../actions";
import Image from "next/image";

interface ImageToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: number) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export default function ImageToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false
}: ImageToImageFormProps) {
  const [imagePrompt, setImagePrompt] = useState("");
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [strength, setStrength] = useState(0.8);
  const [isGenerating, setIsGenerating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // 로컬 스토리지에서 이전 입력 데이터 복원
  useEffect(() => {
    const savedImagePrompt = localStorage.getItem('imagePrompt');
    if (savedImagePrompt) setImagePrompt(savedImagePrompt);
    
    const savedStrength = localStorage.getItem('strength');
    if (savedStrength) setStrength(parseFloat(savedStrength));
  }, []);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setUploadedImage(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imagePrompt.trim() || !uploadedImage) return;
    
    setIsGenerating(true);
    onGenerationStart();
    
    try {
      const result = await generateImageWithFlux(imagePrompt, uploadedImage, strength);
      
      // 입력 데이터 로컬 스토리지에 저장
      localStorage.setItem('imagePrompt', imagePrompt);
      localStorage.setItem('strength', strength.toString());
      
      onGenerationComplete(result.fileUrl, result.id);
    } catch (err: any) {
      onError(err.message || "이미지 변환에 실패했습니다");
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block mb-2">이미지 업로드</label>
        <div className="flex flex-col items-center p-4 border-2 border-dashed border-neutral-700 rounded-lg">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageUpload}
            accept="image/*"
            className="hidden"
          />
          
          {uploadedImage ? (
            <div className="relative w-full h-64 mb-4">
              <Image
                src={uploadedImage}
                alt="업로드된 이미지"
                fill
                className="object-contain"
              />
            </div>
          ) : (
            <div className="p-8 text-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded-lg"
              >
                이미지 선택
              </button>
              <p className="text-sm text-neutral-400 mt-2">또는 여기에 이미지를 끌어다 놓으세요</p>
            </div>
          )}
          
          {uploadedImage && (
            <button
              type="button"
              onClick={() => setUploadedImage(null)}
              className="px-3 py-1 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-sm mt-4"
            >
              이미지 변경
            </button>
          )}
        </div>
      </div>
      
      <div>
        <label className="block mb-2">이미지 변환 프롬프트</label>
        <textarea
          value={imagePrompt}
          onChange={(e) => setImagePrompt(e.target.value)}
          className="w-full h-32 bg-neutral-800 rounded-lg p-4 resize-none"
          placeholder="이미지를 어떻게 변환할지 설명해주세요..."
          required
        />
      </div>
      
      <div>
        <label className="flex justify-between mb-2">
          <span>변환 강도</span>
          <span>{Math.round(strength * 100)}%</span>
        </label>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full accent-orange-500"
        />
        <div className="flex justify-between text-xs text-neutral-400 mt-1">
          <span>낮음 (원본 유지)</span>
          <span>높음 (완전 변환)</span>
        </div>
      </div>
      
      <button
        type="submit"
        disabled={isGenerating || !imagePrompt.trim() || !uploadedImage}
        className="w-full px-6 py-3 bg-orange-500 hover:bg-orange-600 rounded-lg disabled:opacity-50 transition-colors"
      >
        {isGenerating ? "이미지 변환 중..." : "이미지 변환하기"}
      </button>
    </form>
  );
} 