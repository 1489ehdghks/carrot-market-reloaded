import Replicate from "replicate";
import { getSession } from "@/shared/lib/auth";
import { cache } from "react";

// 캐싱된 세션 가져오기
export const getCachedSession = cache(async () => {
  return await getSession();
});

// Replicate 클라이언트 인스턴스 생성 (싱글톤 패턴)
export const getReplicateClient = (() => {
  let instance: Replicate | null = null;
  
  return () => {
    if (!instance) {
      instance = new Replicate({
        auth: process.env.REPLICATE_API_KEY || "",
        fetch: (url, options = {}) => {
          return fetch(url, {
            ...options,
            signal: AbortSignal.timeout(60000) // 60초 이상 자동 중지
          });
        }
      });
    }
    return instance;
  };
})(); 