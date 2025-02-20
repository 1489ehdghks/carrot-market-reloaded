import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-20 border-t border-neutral-800">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="text-white font-bold">Lumi AI</span>
          </div>
          <div className="flex gap-6 text-neutral-400">
            <Link href="/terms" className="hover:text-white transition-colors">이용약관</Link>
            <Link href="/privacy" className="hover:text-white transition-colors">개인정보처리방침</Link>
            <Link href="/contact" className="hover:text-white transition-colors">문의하기</Link>
          </div>
          <div className="text-neutral-500 text-sm">
            © {currentYear} Lumi AI. All rights reserved.
          </div>
        </div>
      </div>
    </footer>
  );
} 