"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Upload, 
  Copy, 
  Check,
  FileUp,
  FileDown
} from "lucide-react";
import { toast } from "sonner";

export interface ImageSettings {
  prompt: string;
  negativePrompt: string;
  modelId: string;
  width: number;
  height: number;
  steps: number;
  cfgScale: number;
  sampler: string;
  vae: string;
}

interface SettingsExporterProps {
  settings: ImageSettings;
  onImportSettings: (settings: ImageSettings) => void;
}

export default function SettingsExporter({ 
  settings, 
  onImportSettings 
}: SettingsExporterProps) {
  const [copied, setCopied] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState('');

  // Export settings to JSON
  const exportSettings = () => {
    try {
      // Format settings for better readability
      const formattedSettings = {
        ...settings,
        _exported: new Date().toISOString(),
        _type: 'carrotGenSettings'
      };

      const settingsJson = JSON.stringify(formattedSettings, null, 2);
      
      // Create a blob and download it
      const blob = new Blob([settingsJson], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `carrot-settings-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success("Settings exported successfully");
    } catch (error) {
      console.error("Failed to export settings:", error);
      toast.error("Failed to export settings");
    }
  };

  // Copy settings to clipboard
  const copyToClipboard = async () => {
    try {
      const settingsJson = JSON.stringify({
        ...settings,
        _exported: new Date().toISOString(),
        _type: 'carrotGenSettings'
      });
      
      await navigator.clipboard.writeText(settingsJson);
      setCopied(true);
      toast.success("Settings copied to clipboard");
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy settings:", error);
      toast.error("Failed to copy to clipboard");
    }
  };

  // Import settings from text
  const importSettings = () => {
    try {
      const parsedSettings = JSON.parse(importText);
      
      // Validate if this is a proper settings object
      if (!parsedSettings._type || parsedSettings._type !== 'carrotGenSettings') {
        throw new Error("Invalid settings format");
      }
      
      // Extract only the relevant settings
      const {
        prompt, 
        negativePrompt, 
        modelId, 
        width, 
        height, 
        steps, 
        cfgScale, 
        sampler, 
        vae
      } = parsedSettings;
      
      // Apply imported settings
      onImportSettings({
        prompt: prompt || '',
        negativePrompt: negativePrompt || '',
        modelId: modelId || settings.modelId,
        width: width || settings.width,
        height: height || settings.height,
        steps: steps || settings.steps,
        cfgScale: cfgScale || settings.cfgScale,
        sampler: sampler || settings.sampler,
        vae: vae !== undefined ? vae : settings.vae
      });
      
      // Reset import UI
      setImportText('');
      setShowImport(false);
      toast.success("Settings imported successfully");
    } catch (error) {
      console.error("Failed to import settings:", error);
      toast.error("Invalid settings format. Please check and try again.");
    }
  };

  // Import settings from file
  const importFromFile = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          setImportText(content);
          importSettings();
        } catch (error) {
          console.error("Failed to read file:", error);
          toast.error("Failed to read settings file");
        }
      };
      reader.readAsText(file);
    };
    
    input.click();
  };

  return (
    <div className="mt-4 border border-neutral-700 rounded-lg p-3">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-sm font-medium">Settings Manager</h3>
        <div className="flex space-x-2">
          <Button
            type="button"
            size="sm"
            variant="outline" 
            onClick={() => setShowImport(!showImport)}
            className="text-xs h-8"
          >
            <Upload className="w-3 h-3 mr-1" />
            Import
          </Button>
          <Button
            type="button" 
            size="sm" 
            variant="outline"
            onClick={copyToClipboard}
            className="text-xs h-8"
          >
            {copied ? <Check className="w-3 h-3 mr-1" /> : <Copy className="w-3 h-3 mr-1" />}
            Copy
          </Button>
          <Button
            type="button" 
            size="sm" 
            variant="outline"
            onClick={exportSettings}
            className="text-xs h-8"
          >
            <Download className="w-3 h-3 mr-1" />
            Export
          </Button>
        </div>
      </div>

      {showImport && (
        <div className="mt-2 space-y-2">
          <textarea
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder="Paste settings JSON here..."
            className="w-full h-24 bg-neutral-800 rounded-lg p-2 text-xs"
          />
          <div className="flex justify-between">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={importFromFile}
              className="text-xs"
            >
              <FileUp className="w-3 h-3 mr-1" />
              From File
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={importSettings}
              className="text-xs"
              disabled={!importText}
            >
              Apply Settings
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 