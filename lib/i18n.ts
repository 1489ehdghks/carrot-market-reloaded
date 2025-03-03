// 지원하는 언어 목록
export const SUPPORTED_LOCALES = ['ko', 'en'] as const;
export type Locale = typeof SUPPORTED_LOCALES[number];

// 기본 언어
export const DEFAULT_LOCALE: Locale = 'ko';

// 로컬 스토리지 키
const LOCALE_STORAGE_KEY = 'user-locale';

// 사용자 언어 설정 가져오기
export function getUserLocale(): Locale {
  if (typeof window === 'undefined') return DEFAULT_LOCALE;
  
  const savedLocale = localStorage.getItem(LOCALE_STORAGE_KEY) as Locale;
  if (savedLocale && SUPPORTED_LOCALES.includes(savedLocale)) {
    return savedLocale;
  }
  
  const browserLocale = window.navigator.language.split('-')[0] as Locale;
  if (SUPPORTED_LOCALES.includes(browserLocale)) {
    return browserLocale;
  }
  
  return DEFAULT_LOCALE;
}

// 사용자 언어 설정 저장
export function setUserLocale(locale: Locale) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
} 