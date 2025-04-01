'use client';

import { useState } from 'react';
import { CustomInput } from '@/widgets/elements/custom-input';
import { 
  CustomSelect,
  CustomSelectContent,
  CustomSelectItem,
  CustomSelectTrigger,
  CustomSelectValue,
  CustomSettingSelect
} from '@/widgets/elements/custom-select';
import { CustomSwitch } from '@/widgets/elements/custom-switch';
import { 
  CustomSlider,
  CustomSettingSlider
} from '@/widgets/elements/custom-slider';
import { CustomSettingToggle } from '@/widgets/elements/custom-toggle';
import { CustomTooltip } from '@/widgets/shared/custom-tooltip';
import { CustomButton } from '@/widgets/elements/custom-button';
import { 
  CustomDialog, 
  CustomDialogTrigger, 
  CustomDialogContent, 
  CustomDialogHeader, 
  CustomDialogTitle, 
  CustomDialogDescription, 
  CustomDialogFooter 
} from '@/widgets/shared/custom-dialog';
import { useToast } from '@/widgets/shared/custom-toast';

export default function TestFormPage() {
  // 커스텀 컴포넌트 상태 관리
  const [customInputValue, setCustomInputValue] = useState('');
  const [customSelectValue, setCustomSelectValue] = useState('옵션1');
  const [customSwitchValue, setCustomSwitchValue] = useState(false);
  const [customSliderValue, setCustomSliderValue] = useState([50]);
  const [customSettingToggleValue, setCustomSettingToggleValue] = useState(false);
  const [customSettingSliderValue, setCustomSettingSliderValue] = useState(50);
  const [customSettingSelectValue, setCustomSettingSelectValue] = useState('옵션1');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { toast } = useToast();

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-8">폼 컴포넌트 테스트</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Custom 폼 컴포넌트 */}
        <div className="space-y-6 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">폼 컴포넌트</h2>
          
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-medium mb-2">Input</h3>
              <CustomInput 
                placeholder="텍스트를 입력하세요" 
                value={customInputValue}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomInputValue(e.target.value)}
              />
              <p className="mt-2 text-sm text-gray-500">입력된 값: {customInputValue}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Select</h3>
              <CustomSelect value={customSelectValue} onValueChange={setCustomSelectValue}>
                <CustomSelectTrigger>
                  <CustomSelectValue placeholder="옵션 선택" />
                </CustomSelectTrigger>
                <CustomSelectContent>
                  <CustomSelectItem value="옵션1">옵션 1</CustomSelectItem>
                  <CustomSelectItem value="옵션2">옵션 2</CustomSelectItem>
                  <CustomSelectItem value="옵션3">옵션 3</CustomSelectItem>
                </CustomSelectContent>
              </CustomSelect>
              <p className="mt-2 text-sm text-gray-500">선택된 값: {customSelectValue}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Switch</h3>
              <div className="flex items-center space-x-2">
                <CustomSwitch 
                  checked={customSwitchValue} 
                  onCheckedChange={setCustomSwitchValue} 
                />
                <span>토글 상태: {customSwitchValue ? '켜짐' : '꺼짐'}</span>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Slider</h3>
              <CustomSlider 
                value={customSliderValue} 
                onValueChange={setCustomSliderValue}
                max={100}
                step={1}
              />
              <p className="mt-2 text-sm text-gray-500">슬라이더 값: {customSliderValue}</p>
            </div>
          </div>
        </div>
        
        {/* Custom 설정 컴포넌트 */}
        <div className="space-y-6 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">설정 컴포넌트</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Setting Toggle</h3>
              <CustomSettingToggle
                title="설정 켜기/끄기"
                description="이 설정을 활성화하면 특별한 기능이 작동합니다."
                defaultValue={customSettingToggleValue}
                onValueChange={setCustomSettingToggleValue}
              />
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Setting Slider</h3>
              <CustomSettingSlider
                title="효과 강도"
                description="효과의 강도를 조절합니다."
                defaultValue={customSettingSliderValue}
                onValueChange={setCustomSettingSliderValue}
                min={0}
                max={100}
                step={1}
              />
              <p className="mt-2 text-sm text-gray-500">현재 값: {customSettingSliderValue}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Setting Select</h3>
              <CustomSettingSelect
                title="모드 선택"
                description="작업에 사용할 모드를 선택하세요."
                defaultValue={customSettingSelectValue}
                onValueChange={setCustomSettingSelectValue}
                options={[
                  { value: "옵션1", label: "모드 1" },
                  { value: "옵션2", label: "모드 2" },
                  { value: "옵션3", label: "모드 3" }
                ]}
              />
            </div>
          </div>
        </div>

        {/* Shared 컴포넌트 */}
        <div className="space-y-6 p-6 border rounded-lg">
          <h2 className="text-2xl font-semibold mb-4">Shared 컴포넌트</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-2">Tooltip</h3>
              <CustomTooltip 
                title="툴팁 제목" 
                description="이 툴팁은 사용자에게 추가 정보를 제공합니다."
              >
                <CustomButton>툴팁 표시</CustomButton>
              </CustomTooltip>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Dialog</h3>
              <CustomDialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <CustomDialogTrigger asChild>
                  <CustomButton>다이얼로그 열기</CustomButton>
                </CustomDialogTrigger>
                <CustomDialogContent>
                  <CustomDialogHeader>
                    <CustomDialogTitle>다이얼로그 제목</CustomDialogTitle>
                    <CustomDialogDescription>
                      이 다이얼로그는 사용자와 중요한 상호작용을 위한 것입니다.
                    </CustomDialogDescription>
                  </CustomDialogHeader>
                  <div className="py-4">
                    다이얼로그 내용을 이 곳에 표시합니다.
                  </div>
                  <CustomDialogFooter>
                    <CustomButton onClick={() => setDialogOpen(false)}>
                      확인
                    </CustomButton>
                  </CustomDialogFooter>
                </CustomDialogContent>
              </CustomDialog>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Toast</h3>
              <CustomButton
                onClick={() => {
                  toast({
                    title: "알림",
                    description: "토스트 메시지가 표시되었습니다.",
                  })
                }}
              >
                토스트 표시
              </CustomButton>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">Color Variants</h3>
              <div className="space-y-2">
                <div>
                  <CustomButton variant="default" className="mr-2">Default</CustomButton>
                  <CustomButton variant="primary" className="mr-2">Primary (Sunset)</CustomButton>
                  <CustomButton variant="secondary" className="mr-2">Secondary</CustomButton>
                </div>
                <div>
                  <CustomButton variant="sunset" className="mr-2">Sunset</CustomButton>
                  <CustomButton variant="tangerine" className="mr-2">Tangerine</CustomButton>
                  <CustomButton variant="destructive" className="mr-2">Destructive</CustomButton>
                </div>
                <div>
                  <CustomButton variant="outline" className="mr-2">Outline</CustomButton>
                  <CustomButton variant="ghost" className="mr-2">Ghost</CustomButton>
                  <CustomButton variant="link">Link</CustomButton>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="text-lg font-medium mb-2">CSS Class Styles</h3>
              <div className="space-y-2">
                <div>
                  <button className="sunset-btn px-4 py-2 rounded-md mr-2">
                    <span>Sunset Button</span>
                  </button>
                  <button className="primary-btn px-4 py-2 rounded-md mr-2">
                    <span>Primary Button</span>
                  </button>
                  <button className="tangerine-btn px-4 py-2 rounded-md">
                    <span>Tangerine Button</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 