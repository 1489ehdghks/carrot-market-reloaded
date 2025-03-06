"use client";

import { useState, useEffect } from "react";
import { generateImageWithText } from "../../actions";
import { ImageSettings } from "./SettingsExporter";
import PromptInput from "./PromptInput";
import ModelSelector from "./ModelSelector";
import SettingsPanel from "./SettingsPanel";
import SettingsExporter from "./SettingsExporter";
import GenerationButton from "./GenerationButton";

export interface ClientFormProps {
  models: any[];
  samplers: string[];
  defaultModel: any;
  onGenerationStart?: () => void;
  onGenerationComplete?: (imageUrl: string, imageId: string) => void;
  onGenerationError?: (error: Error) => void;
}

export default function ImageGenerationFormClient({
  models,
  samplers, 
  defaultModel,
  onGenerationStart,
  onGenerationComplete,
  onGenerationError
}: ClientFormProps) {
  // Form state
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedModelId, setSelectedModelId] = useState(defaultModel?.id || "");
  
  // Form values
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [steps, setSteps] = useState(30);
  const [cfgScale, setCfgScale] = useState(7);
  const [sampler, setSampler] = useState(samplers[0] || "");
  const [vae, setVae] = useState(true);
  
  // Load saved values from localStorage on mount
  useEffect(() => {
    const savedPrompt = localStorage.getItem("imagePrompt");
    const savedNegativePrompt = localStorage.getItem("imageNegativePrompt");
    
    if (savedPrompt) setPrompt(savedPrompt);
    if (savedNegativePrompt) setNegativePrompt(savedNegativePrompt);
    
    // Try to load saved settings
    try {
      const savedSettings = localStorage.getItem("imageGenerationSettings");
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        setWidth(settings.width || 1024);
        setHeight(settings.height || 1024);
        setSteps(settings.steps || 30);
        setCfgScale(settings.cfgScale || 7);
        setSampler(settings.sampler || samplers[0]);
        setVae(settings.vae !== undefined ? settings.vae : true);
        
        // Only set model if it exists in available models
        if (settings.modelId && models.some(m => m.id === settings.modelId)) {
          setSelectedModelId(settings.modelId);
        }
      }
    } catch (error) {
      console.error("Failed to load saved settings:", error);
    }
  }, [models, samplers]);
  
  // Save settings to localStorage when they change
  useEffect(() => {
    const settings = {
      width,
      height,
      steps,
      cfgScale,
      sampler,
      vae,
      modelId: selectedModelId
    };
    
    localStorage.setItem("imageGenerationSettings", JSON.stringify(settings));
  }, [width, height, steps, cfgScale, sampler, vae, selectedModelId]);
  
  // Handle model change
  const handleModelChange = (modelId: string, recommendedSettings?: any) => {
    setSelectedModelId(modelId);
    
    // Apply recommended settings if available
    if (recommendedSettings) {
      if (recommendedSettings.width) setWidth(recommendedSettings.width);
      if (recommendedSettings.height) setHeight(recommendedSettings.height);
      if (recommendedSettings.steps) setSteps(recommendedSettings.steps);
      if (recommendedSettings.cfgScale) setCfgScale(recommendedSettings.cfgScale);
      if (recommendedSettings.sampler && samplers.includes(recommendedSettings.sampler)) {
        setSampler(recommendedSettings.sampler);
      }
      if (recommendedSettings.vae !== undefined) setVae(recommendedSettings.vae);
    }
  };
  
  // Settings for import/export
  const currentSettings: ImageSettings = {
    prompt,
    negativePrompt,
    modelId: selectedModelId,
    width,
    height,
    steps,
    cfgScale,
    sampler,
    vae
  };
  
  // Handle form submission
  const handleGenerate = async () => {
    if (isGenerating || !prompt) return;
    
    setIsGenerating(true);
    if (onGenerationStart) onGenerationStart();
    
    try {
      // 선택된 모델의 apiModel 값을 찾습니다
      const selectedModel = models.find(m => m.id === selectedModelId);
      const apiModel = selectedModel?.apiModel || "";
      
      // 이미지 생성 API 호출 시 추가 파라미터로 크기 전달
      const result = await generateImageWithText({
        prompt,
        negativePrompt,
        modelId: selectedModelId,
        apiModel,
        size: `${width}x${height}`,
        steps,
        cfgScale,
        vae: vae ? "true" : "false" // 문자열로 변환
      });
      
      // API 응답 형식에 맞게 결과 처리
      if (result && typeof result === 'object') {
        // Successful image generation
        if ('imageUrl' in result && 'id' in result) {
          if (onGenerationComplete) {
            onGenerationComplete(result.imageUrl as string, result.id.toString());
          }
        } 
        // Error case
        else if ('error' in result) {
          if (onGenerationError) {
            onGenerationError(new Error(result.error as string || "Generation failed"));
          }
        }
        // Unexpected response format
        else {
          if (onGenerationError) {
            onGenerationError(new Error("Unexpected response format"));
          }
        }
      } else {
        if (onGenerationError) {
          onGenerationError(new Error("Invalid response from server"));
        }
      }
    } catch (error) {
      console.error("Generation error:", error);
      if (onGenerationError) {
        onGenerationError(error instanceof Error ? error : new Error("Unknown error"));
      }
    } finally {
      setIsGenerating(false);
    }
  };
  
  // Import settings handler
  const handleImportSettings = (settings: ImageSettings) => {
    setPrompt(settings.prompt);
    setNegativePrompt(settings.negativePrompt);
    
    // Only set model if it exists in available models
    if (settings.modelId && models.some(m => m.id === settings.modelId)) {
      setSelectedModelId(settings.modelId);
    }
    
    setWidth(settings.width);
    setHeight(settings.height);
    setSteps(settings.steps);
    setCfgScale(settings.cfgScale);
    setSampler(settings.sampler);
    setVae(settings.vae);
  };
  
  return (
    <form 
      onSubmit={(e) => {
        e.preventDefault();
        handleGenerate();
      }}
      className="space-y-4"
    >
      <PromptInput
        initialPrompt={prompt}
        initialNegativePrompt={negativePrompt}
        onPromptChange={setPrompt}
        onNegativePromptChange={setNegativePrompt}
        maxTokensPrompt={5000}
        maxTokensNegative={2000}
      />
      
      <ModelSelector
        models={models}
        selectedModelId={selectedModelId}
        onModelChange={handleModelChange}
      />
      
      <SettingsPanel
        width={width}
        height={height}
        steps={steps}
        cfgScale={cfgScale}
        sampler={sampler}
        vae={vae}
        onWidthChange={setWidth}
        onHeightChange={setHeight}
        onStepsChange={setSteps}
        onCfgScaleChange={setCfgScale}
        onSamplerChange={setSampler}
        onVaeChange={setVae}
        samplers={samplers}
        disabled={isGenerating}
      />
      
      <SettingsExporter 
        settings={currentSettings}
        onImportSettings={handleImportSettings}
      />
      
      <GenerationButton 
        isGenerating={isGenerating} 
        disabled={!prompt || isGenerating}
      />
    </form>
  );
} 