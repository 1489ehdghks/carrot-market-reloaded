import { EditModel } from '@/shared/models/image/editModels';
import { CustomLabel } from '@/widgets/elements/custom-label';
import { 
  CustomSelect, 
  CustomSelectContent, 
  CustomSelectItem, 
  CustomSelectTrigger, 
  CustomSelectValue 
} from '@/widgets/elements/custom-select';
import { CustomTooltip } from './custom-tooltip';
import { Info } from 'lucide-react';

interface ModelSelectorProps {
  models: EditModel[];
  selectedModel: string;
  onModelChange: (modelId: string) => void;
  label?: string;
  className?: string;
}

export function ModelSelector({
  models,
  selectedModel,
  onModelChange,
  label = "모델",
  className = ""
}: ModelSelectorProps) {
  const selectedModelData = models.find(model => model.id === selectedModel);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2">
        <CustomLabel className="text-base font-medium">{label}</CustomLabel>
        {selectedModelData && (
          <CustomTooltip 
            title={selectedModelData.name}
            description={
              <div className="space-y-2">
                <div className="text-sm text-neutral-400">{selectedModelData.description}</div>
                <div className="text-xs text-neutral-500">
                  {selectedModelData.tokenPrice}토큰
                </div>
              </div>
            }
          >
            <Info className="w-4 h-4 text-muted-foreground cursor-help hover:text-primary transition-colors" />
          </CustomTooltip>
        )}
      </div>
      <CustomSelect 
        value={selectedModel} 
        onValueChange={onModelChange}
      >
        <CustomSelectTrigger className="w-full">
          <CustomSelectValue placeholder="모델 선택" />
        </CustomSelectTrigger>
        <CustomSelectContent>
          {models.map((model) => (
            <CustomSelectItem key={model.id} value={model.id}>
              <div className="flex items-center justify-between w-full">
                <span className="font-medium">{model.name}</span>
                <span className="text-xs text-muted-foreground px-2">{model.tokenPrice}토큰</span>
              </div>
            </CustomSelectItem>
          ))}
        </CustomSelectContent>
      </CustomSelect>
    </div>
  );
} 