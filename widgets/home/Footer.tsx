import LocaleSwitcher from "@/components/feature/common/locale-switcher";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-[#0D0D0D] py-12 text-neutral-400 border-t border-neutral-800">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Lumi AI</h3>
            <p className="text-sm">AI 이미지 생성을 더 쉽고 창의적으로 할 수 있는 Lumi AI 서비스입니다.</p>
          </div>
          
          <div>
            <LocaleSwitcher />
          </div>
        </div>
        
        <div className="border-t border-neutral-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-xs">&copy; {currentYear} Lumi AI. All rights reserved.</p>
          <div className="flex mt-4 md:mt-0 space-x-4">
            <a href="#" className="text-xs hover:text-[#FFB4B4] transition-colors">이용약관</a>
            <a href="#" className="text-xs hover:text-[#FFB4B4] transition-colors">개인정보처리방침</a>
          </div>
        </div>
      </div>
    </footer>
  );
} 