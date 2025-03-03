import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import "dayjs/locale/ko"
import "dayjs/locale/en"
import { getUserLocale } from "./i18n"

// 플러그인 설정
dayjs.extend(relativeTime)
dayjs.extend(utc)
dayjs.extend(timezone)

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatToTimeAgo(date: Date | string) {
  const userLocale = getUserLocale();
  const userTimezone = typeof window !== 'undefined' 
    ? Intl.DateTimeFormat().resolvedOptions().timeZone 
    : 'UTC';
  
  dayjs.locale(userLocale);
  
  const now = dayjs().tz(userTimezone);
  const past = dayjs(date).tz(userTimezone);  // UTC -> 사용자 시간대로 변환
  const diffInHours = now.diff(past, 'hour');
  
  // 24시간 이내일 경우 "n시간 전"
  if (diffInHours < 24) {
    return past.fromNow();  // "3시간 전" or "3 hours ago"
  }
  
  // 24시간 이상일 경우 날짜 표시
  if (userLocale === 'ko') {
    return past.format('YYYY.MM.DD HH:mm');  // "2024.03.15 14:30"
  }
  return past.format('MMM DD, YYYY HH:mm');  // "Mar 15, 2024 14:30"
}

export function formatDate(date: Date | string) {
  const userLocale = getUserLocale();
  dayjs.locale(userLocale);
  
  const past = dayjs(date);
  
  if (userLocale === 'ko') {
    return past.format('YYYY년 MM월 DD일 HH:mm');
  }
  return past.format('MMM DD, YYYY HH:mm');
}

export function formatToWon(price: number | null | undefined): string {
    // null, undefined 또는 NaN 처리
    if (price === null || price === undefined || isNaN(price)) {
        return '0';
    }
    return price.toLocaleString('ko-KR');
}