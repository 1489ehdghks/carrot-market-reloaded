import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * 클래스명을 병합하는 유틸리티 함수
 * 
 * tailwind 클래스들을 효율적으로 병합할 수 있게 해줍니다.
 * 
 * @example
 * cn("text-red-500", isError && "bg-red-100")
 * 
 * @param inputs 클래스명 배열
 * @returns 병합된 클래스명 문자열
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
} 