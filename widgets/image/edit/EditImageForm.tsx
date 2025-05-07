'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/widgets/shared/custom-tabs';
import { CustomCard, CustomCardContent } from '@/widgets/elements/custom-card';
import InpaintingForm from '@/widgets/image/edit/InpaintingForm';
import UpscaleForm from '@/widgets/image/edit/UpscaleForm';
import RefinerForm from './RefinerForm';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';
import { Info } from "lucide-react";

interface EditImageFormProps {
  selectedImage: {
    url: string;
    id?: string | number;
    prompt?: string;
  } | null;
  onImageEdited: (imageUrl: string, imageId?: string | number) => void;
}

export default function EditImageForm({ selectedImage, onImageEdited }: EditImageFormProps) {
  const [mode, setMode] = useState<'inpaint' | 'upscale' | 'refiner'>('inpaint');
  

  return (
    <div className="gap-4">
      <CustomCard className="border-none">
        <CustomCardContent className="p-4">
          <Tabs defaultValue="inpaint" onValueChange={(value) => setMode(value as any)}>
            <TabsList className="flex w-full mb-4">
              <TabsTrigger value="inpaint" className="flex-1">
                <div className="flex items-center justify-center gap-1.5">
                <CustomTooltip description="마스킹한 영역을 수정할 수 있습니다.">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </CustomTooltip>
                  inpaint
                </div>
              </TabsTrigger>

              <TabsTrigger value="refiner" className="flex-1">
                <div className="flex items-center justify-center gap-1.5">
                <CustomTooltip description="품질 개선, 노이즈 제거, 선명도 향상, 색상 보정 등을 통해 선명하고 자연스럽게 만듭니다.">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </CustomTooltip>
                  refiner
                </div>
              </TabsTrigger>
              
              <TabsTrigger value="upscale" className="flex-1">
                <div className="flex items-center justify-center gap-1.5">
                <CustomTooltip description="이미지의 크기를 키우면서도 선명도를 유지할 수 있습니다.">
                    <Info className="w-5 h-5 text-muted-foreground" />
                  </CustomTooltip>
                  upscale
                </div>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="inpaint">
              <InpaintingForm
                selectedImage={selectedImage}
                onImageEdited={onImageEdited}
              />
            </TabsContent>
            
            <TabsContent value="upscale">
              <UpscaleForm
                selectedImage={selectedImage}
                onImageEdited={onImageEdited}
              />
            </TabsContent>

            <TabsContent value="refiner">
              <RefinerForm
                selectedImage={selectedImage}
                onImageEdited={onImageEdited}
              />
            </TabsContent>
          </Tabs>
        </CustomCardContent>
      </CustomCard>
      
    </div>
  );
} 