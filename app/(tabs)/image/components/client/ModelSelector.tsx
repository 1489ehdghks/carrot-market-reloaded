"use client";

import { useState, useEffect } from 'react';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface Model {
  id: string;
  name: string;
  apiModel: string;
  type: string;
  description?: string;
  recommendedSettings?: {
    [key: string]: any;
  };
}

interface ModelSelectorProps {
  models: Model[];
  selectedModelId: string;
  onModelChange: (modelId: string, recommendedSettings?: any) => void;
  onActivate?: (activated: boolean) => void;
  showDescription?: boolean;
  compact?: boolean;
}

export default function ModelSelector({
  models,
  selectedModelId,
  onModelChange,
  onActivate,
  showDescription = true,
  compact = false
}: ModelSelectorProps) {
  const [activated, setActivated] = useState(true);
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  
  // Find and set the selected model when models or selectedModelId changes
  useEffect(() => {
    const model = models.find(m => m.id === selectedModelId);
    setSelectedModel(model || null);
  }, [models, selectedModelId]);

  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newModelId = e.target.value;
    const model = models.find(m => m.id === newModelId);
    if (model) {
      onModelChange(newModelId, model.recommendedSettings);
      setSelectedModel(model);
    }
  };

  const handleActivationChange = (checked: boolean) => {
    setActivated(checked);
    if (onActivate) {
      onActivate(checked);
    }
  };

  return (
    <div className={`mb-4 ${compact ? 'mb-2' : ''}`}>
      <div className="flex justify-between items-center mb-2">
        <label className="block text-sm font-medium">AI Model</label>
        {onActivate && (
          <div className="flex items-center space-x-2">
            <Switch
              checked={activated}
              onCheckedChange={handleActivationChange}
              id="model-active"
            />
            <Label htmlFor="model-active" className="text-xs">Active</Label>
          </div>
        )}
      </div>
      
      <select
        value={selectedModelId}
        onChange={handleModelChange}
        className="w-full bg-neutral-800 rounded-lg p-2 text-sm"
        disabled={!activated}
      >
        {models.map((model) => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
      
      {showDescription && selectedModel?.description && !compact && (
        <p className="mt-1 text-xs text-neutral-400">{selectedModel.description}</p>
      )}
    </div>
  );
} 