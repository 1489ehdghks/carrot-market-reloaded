"use client";

import { SUPPORTED_LOCALES, getUserLocale, setUserLocale, type Locale } from "@/lib/i18n";
import { useRouter } from "next/navigation";

export default function LocaleSwitcher() {
  const router = useRouter();
  const currentLocale = getUserLocale();

  const handleLocaleChange = (newLocale: Locale) => {
    setUserLocale(newLocale);
    router.refresh(); // 페이지 새로고침하여 새 언어 설정 적용
  };

  return (
    <div className="flex items-center gap-2">
      {SUPPORTED_LOCALES.map((locale) => (
        <button
          key={locale}
          onClick={() => handleLocaleChange(locale)}
          className={`px-2 py-1 rounded ${
            currentLocale === locale 
              ? "bg-neutral-700 text-white" 
              : "text-neutral-400 hover:text-white"
          }`}
        >
          {locale.toUpperCase()}
        </button>
      ))}
    </div>
  );
} 