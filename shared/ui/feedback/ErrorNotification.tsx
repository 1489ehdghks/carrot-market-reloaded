"use client";

/**
 * 오류 알림 리스너 컴포넌트
 * 
 * 이 컴포넌트는 전역 에러 이벤트를 감지하고 사용자에게 알림을 표시합니다.
 * 사용자 친화적인 오류 메시지를 제공하여 애플리케이션 사용성을 향상시킵니다.
 * 
 * @module shared/ui/feedback/ErrorNotification
 */

import { useEffect } from "react";
import { useNotification } from "@/components/ui/feedback/notification";

/**
 * 오류 알림 리스너 컴포넌트
 * 
 * 애플리케이션 전체에서 발생하는 오류를 감지하고 사용자에게 표시합니다.
 */
export function ErrorNotificationListener() {
  const { showNotification } = useNotification();
  
  useEffect(() => {
    // 오류 알림 이벤트 헨들러
    const handleErrorNotification = (event: CustomEvent<{
      message: string;
      type?: "error" | "warning" | "info";
      duration?: number;
    }>) => {
      const { message, type = "error", duration = 5000 } = event.detail;
      
      // 타입에 따라 알림 표시
      if (type === "error") {
        showNotification({
          title: "오류",
          message,
          type: "error",
          duration
        });
      } else if (type === "warning") {
        showNotification({
          title: "주의",
          message,
          type: "warning",
          duration
        });
      } else {
        showNotification({
          title: "알림",
          message,
          type: "info",
          duration
        });
      }
    };
    
    // 이벤트 리스너 등록
    window.addEventListener(
      "error-notification" as any,
      handleErrorNotification as EventListener
    );
    
    // 컴포넌트 언마운트 시 이벤트 리스너 제거
    return () => {
      window.removeEventListener(
        "error-notification" as any,
        handleErrorNotification as EventListener
      );
    };
  }, [showNotification]);
  
  // UI 렌더링 없음 (백그라운드에서 이벤트만 처리)
  return null;
} 