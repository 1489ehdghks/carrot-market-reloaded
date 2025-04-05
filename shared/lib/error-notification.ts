"use client";

import { useEffect } from "react";
import { useNotification } from "@/widgets/shared/custom-notification";
import { UserFacingError, SystemError, registerErrorHandler } from "../constants/lib/error-handling";

/**
 * 에러 알림 컴포넌트 - 에러 핸들러를 등록하고 알림을 표시합니다.
 * providers.tsx 내부에서 사용됩니다.
 */
export function ErrorNotificationListener() {
  const { showNotification } = useNotification();

  useEffect(() => {
    // 전역 에러 핸들러 등록
    const unregister = registerErrorHandler((error) => {
      // 사용자에게 표시 가능한 에러인 경우
      if (error instanceof UserFacingError) {
        showNotification({
          type: "error",
          title: "이미지 생성 오류",
          message: error.message,
          position: "center",
          duration: 7000, // 더 오래 표시 (7초)
        });
      }
      // 시스템 에러인 경우 간략한 메시지만 표시
      else if (error instanceof SystemError) {
        showNotification({
          type: "error", 
          title: "시스템 오류",
          message: "처리 중 문제가 발생했습니다. 다시 시도해주세요.",
          position: "center",
          duration: 5000,
        });
        
        // 개발자 콘솔에 자세한 오류 기록
        console.error("[System Error]", error);
      }
      // 기타 에러
      else if (error instanceof Error) {
        showNotification({
          type: "error",
          title: "오류 발생",
          message: error.message || "알 수 없는 오류가 발생했습니다.",
          position: "center",
          duration: 5000,
        });
      }
    });

    // 컴포넌트 언마운트 시 핸들러 제거
    return () => {
      unregister();
    };
  }, [showNotification]);

  // 아무것도 렌더링하지 않음 (invisible component)
  return null;
} 