import { Metadata } from 'next';
import InstantIdForm from '../components/image-to-image/InstantIdForm';

export const metadata: Metadata = {
  title: '얼굴 특성 적용 - 개인화된 AI 이미지 생성',
  description: '얼굴 이미지를 통해 얼굴 특성을 추출하고 새로운 이미지에 적용하여 개인화된 이미지를 생성합니다.',
};

export default function InstantIdPage() {
  return (
    <div className="container mx-auto max-w-4xl py-6 px-4">
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-2">얼굴 특성 적용 (Face Swap)</h1>
        <p className="text-neutral-400">
          얼굴 이미지에서 특성을 추출하여 AI 생성 이미지에 적용합니다. 
          자신의 얼굴 특성을 반영한 다양한 스타일의 이미지를 생성해보세요.
        </p>
      </div>
      
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6">
        <InstantIdForm />
      </div>
    </div>
  );
} 