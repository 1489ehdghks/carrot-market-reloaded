"use client";

import { useState, useRef, useEffect } from "react";
import { generateImageWithImage, getImageUploadUrl, saveGeneratedImage } from "../actions";
import { Loader2, Wand2 } from "lucide-react";

interface ImageToImageFormProps {
  onGenerationStart: () => void;
  onGenerationComplete: (imageUrl: string, imageId: string) => void;
  onError: (message: string) => void;
  compact?: boolean;
}

export default function ImageToImageForm({ 
  onGenerationStart, 
  onGenerationComplete, 
  onError,
  compact = false
}: ImageToImageFormProps) {
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [sourceImage, setSourceImage] = useState<File | null>(null);
  const [strength, setStrength] = useState(0.8);
  const [isGenerating, setIsGenerating] = useState(false);
  const [loadingState, setLoadingState] = useState<'idle' | 'generating' | 'uploading' | 'saving'>('idle');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'prompt' | 'negative'>('prompt');
  const [promptTokenCount, setPromptTokenCount] = useState(0);
  const [negativeTokenCount, setNegativeTokenCount] = useState(0);
  
  // Token count calculation
  const calculateTokens = (text: string): number => {
    if (!text) return 0;
    // Approximate token count calculation (English: 1 token ≈ 4 chars, Korean: 1 token ≈ 2-3 chars)
    const koreanCharCount = (text.match(/[\u3131-\uD79D]/g) || []).length;
    const otherCharCount = text.length - koreanCharCount;
    return Math.ceil(koreanCharCount / 2.5 + otherCharCount / 4);
  };
  
  // Handle prompt change
  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setPrompt(newPrompt);
    const newTokens = calculateTokens(newPrompt);
    setPromptTokenCount(newTokens);
    
    // Save to local storage
    localStorage.setItem('imagePrompt', newPrompt);
    
    // Token limit warning
    if (newTokens > 1500) {
      console.warn("Prompt token count exceeds 1500 limit");
    }
  };
  
  const handleNegativePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newPrompt = e.target.value;
    setNegativePrompt(newPrompt);
    const newTokens = calculateTokens(newPrompt);
    setNegativeTokenCount(newTokens);
    
    // Save to local storage
    localStorage.setItem('imageNegativePrompt', newPrompt);
    
    // Token limit warning
    if (newTokens > 500) {
      console.warn("Negative prompt token count exceeds 500 limit");
    }
  };
  
  // 로컬 스토리지에서 이전 입력 데이터 복원
  useEffect(() => {
    const savedImagePrompt = localStorage.getItem('imagePrompt');
    if (savedImagePrompt) {
      setPrompt(savedImagePrompt);
      setPromptTokenCount(calculateTokens(savedImagePrompt));
    }
    
    const savedNegativePrompt = localStorage.getItem('imageNegativePrompt');
    if (savedNegativePrompt) {
      setNegativePrompt(savedNegativePrompt);
      setNegativeTokenCount(calculateTokens(savedNegativePrompt));
    }
    
    const savedStrength = localStorage.getItem('strength');
    if (savedStrength) setStrength(parseFloat(savedStrength));
  }, []);
  
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // 이미지 파일 검증
    if (!file.type.startsWith('image/')) {
      onError('Please upload only image files');
      return;
    }
    
    // 이미지 크기 검증 (10MB 제한)
    if (file.size > 10 * 1024 * 1024) {
      onError('Image size must be 10MB or less');
      return;
    }
    
    const tempUrl = URL.createObjectURL(file);
    setPreviewUrl(tempUrl);
    setSourceImage(file);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!prompt.trim() || !sourceImage) {
      onError('Please provide both an image and a prompt');
      return;
    }
    
    if (promptTokenCount > 1500) {
      onError('Prompt cannot exceed 1500 tokens');
      return;
    }
    
    if (negativeTokenCount > 500) {
      onError('Negative prompt cannot exceed 500 tokens');
      return;
    }
    
    try {
      setIsGenerating(true);
      onGenerationStart();
      
      // Save input data to local storage
      localStorage.setItem('imagePrompt', prompt);
      localStorage.setItem('imageNegativePrompt', negativePrompt);
      localStorage.setItem('strength', strength.toString());
      
      // 1. Get image upload URL
      setLoadingState('uploading');
      const { uploadUrl, fileKey } = await getImageUploadUrl();
      
      // 2. Upload source image
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: sourceImage,
        headers: {
          'Content-Type': sourceImage.type,
        }
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Error occurred during image upload');
      }
      
      // 3. Call image generation API
      setLoadingState('generating');
      const result = await generateImageWithImage(
        prompt,
        fileKey,
        strength
      ) as { tempUrl: string; prompt: string; originalImage: string };
      
      if (!result || !result.tempUrl) {
        throw new Error('Image generation failed');
      }
      
      // 4. Save generated image information
      setLoadingState('saving');
      const savedImage = await saveGeneratedImage({
        prompt: prompt,
        negativePrompt: negativePrompt,
        fileUrl: result.tempUrl,
        modelId: "img2img-model",
        width: 768,
        height: 768
      });
      
      // 5. Call completion callback
      if (savedImage && savedImage.id) {
        onGenerationComplete(savedImage.fileUrl, String(savedImage.id));
      }
    } catch (error) {
      console.error('Error during image generation:', error);
      onError(error instanceof Error ? error.message : 'Error occurred during image generation');
    } finally {
      setIsGenerating(false);
      setLoadingState('idle');
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 이미지 업로드 영역 */}
      <div className="w-full aspect-square bg-neutral-900 border border-neutral-800 rounded-lg flex flex-col items-center justify-center overflow-hidden relative">
        {previewUrl ? (
          <>
            <img 
              src={previewUrl} 
              alt="Uploaded image" 
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setPreviewUrl(null);
                setSourceImage(null);
                if (fileInputRef.current) fileInputRef.current.value = '';
              }}
              className="absolute bottom-3 right-3 bg-neutral-800 p-2 rounded-lg text-white text-xs hover:bg-neutral-700"
            >
              Change image
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-6 text-center">
            <div className="mb-4 w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">Upload image</h3>
            <p className="text-sm text-neutral-400 mb-4">Please upload the image you want to transform</p>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-neutral-800 rounded-lg text-sm font-medium text-white hover:bg-neutral-700 transition-colors"
            >
              Select image
            </button>
          </div>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleImageUpload}
          accept="image/*"
          className="hidden"
        />
      </div>
      
      {/* 프롬프트 입력 영역 - 탭 디자인 개선 */}
      <div className="w-full mb-4">
        <div className="flex space-x-3 border-b border-neutral-700 mb-2">
          <button
            type="button"
            onClick={() => setActiveTab('prompt')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'prompt' 
                ? 'border-orange-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Prompt
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('negative')}
            className={`py-2 px-4 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'negative' 
                ? 'border-orange-500 text-white' 
                : 'border-transparent text-neutral-400 hover:text-neutral-300'
            }`}
          >
            Negative Prompt
          </button>
        </div>
        
        {activeTab === 'prompt' ? (
          <div className="relative">
            <textarea
              value={prompt}
              onChange={handlePromptChange}
              className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
              placeholder="Describe what you want to generate..."
              required
            />
            <div className="absolute bottom-2 right-2 text-xs flex gap-2">
              <span className={promptTokenCount > 1500 ? 'text-red-500' : 'text-neutral-400'}>
                {promptTokenCount}/1500 tokens
              </span>
            </div>
          </div>
        ) : (
          <div className="relative">
            <textarea
              value={negativePrompt}
              onChange={handleNegativePromptChange}
              className="w-full h-28 bg-neutral-800 rounded-b-lg p-3 pb-8 resize-none text-sm border-0 focus:ring-0 focus:outline-none"
              placeholder="Describe what you want to avoid in the generated image..."
            />
            <div className="absolute bottom-2 right-2 text-xs flex gap-2">
              <span className={negativeTokenCount > 500 ? 'text-red-500' : 'text-neutral-400'}>
                {negativeTokenCount}/500 tokens
              </span>
            </div>
          </div>
        )}
      </div>
      
      {/* 제어 설정 */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <label htmlFor="strength" className="block text-sm font-medium text-neutral-200">
            Transformation strength: {strength.toFixed(1)}
          </label>
          <span className="text-xs text-neutral-400">
            {strength < 0.4 ? 'Weak transformation' : strength > 0.7 ? 'Strong transformation' : 'Medium transformation'}
          </span>
        </div>
        <input
          type="range"
          id="strength"
          min="0.1"
          max="0.9"
          step="0.1"
          value={strength}
          onChange={(e) => setStrength(parseFloat(e.target.value))}
          className="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
      </div>
      
      <div className="flex items-center justify-end gap-4">
        <button
          type="submit"
          disabled={
            isGenerating || 
            !prompt.trim() || 
            !negativePrompt.trim() || 
            !sourceImage || 
            promptTokenCount > 1500 || 
            negativeTokenCount > 500
          }
          className="w-full px-6 py-3.5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 rounded-lg disabled:opacity-50 transition-colors flex justify-center items-center gap-2 font-medium shadow-lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5" />
              <span>Generate image</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
} 