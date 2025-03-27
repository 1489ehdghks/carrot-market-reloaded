import { CSSProperties, useEffect, useState } from "react";
import { motion } from "framer-motion";

interface LeafProps {
  initialX?: number; // 시작 X 위치 (%)
  initialY?: number; // 시작 Y 위치 (%)
  delay?: number; // 애니메이션 시작 지연시간
  direction?: "left" | "right"; // 흔들리는 방향
  size?: number; // 크기 (px)
  opacity?: number; // 투명도 (0-1)
}

export default function Leaf({
  initialX = 50,
  initialY = 0,
  delay = 0,
  direction = "left",
  size = 40,
  opacity = 0.5,
}: LeafProps) {
  const [position, setPosition] = useState({
    x: initialX,
    y: initialY,
  });

  // 바람에 의한 흔들림 효과
  const swayVariants = {
    sway: {
      x: direction === "left" ? [0, -15, 0] : [0, 15, 0],
      rotate: direction === "left" ? [0, -5, 0] : [0, 5, 0],
      transition: {
        duration: 3,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "reverse" as const,
      },
    },
  };

  // 낙하 효과를 위한 애니메이션
  useEffect(() => {
    let isActive = true;
    let currentY = initialY;
    let fallSpeed = Math.random() * 0.3 + 0.2; // 0.2 ~ 0.5 사이 랜덤 속도
    let swayAmount = Math.random() * 5; // 좌우 흔들림 정도
    let swayDirection = direction === "left" ? -1 : 1;
    let currentX = initialX;

    const updatePosition = () => {
      if (!isActive) return;

      // Y 위치 업데이트 (아래로 떨어짐)
      currentY += fallSpeed;

      // X 위치 업데이트 (좌우 흔들림)
      currentX += Math.sin(currentY * 0.05) * swayAmount * swayDirection * 0.1;

      setPosition({
        x: currentX,
        y: currentY,
      });

      // 화면 밖으로 나가면 다시 위에서 시작
      if (currentY > 100) {
        currentY = -10;
        currentX = Math.random() * 100; // 랜덤 X 위치에서 다시 시작
      }

      requestAnimationFrame(updatePosition);
    };

    // 애니메이션 시작 (지연시간 적용)
    const timer = setTimeout(() => {
      requestAnimationFrame(updatePosition);
    }, delay);

    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [initialX, initialY, delay, direction]);

  const style: CSSProperties = {
    position: "absolute",
    left: `${position.x}%`,
    top: `${position.y}%`,
    width: `${size}px`,
    height: `${size}px`,
    opacity,
    filter: "blur(0.5px)",
  };

  return (
    <motion.div
      style={style}
      variants={swayVariants}
      animate="sway"
    >
      <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.2691 2.01443C11.5213 1.85288 11.8346 1.85288 12.0868 2.01443C16.3725 4.65465 19.1931 8.74036 19.9288 13.6286C20.3191 13.3102 20.8076 13.1039 21.3435 13.1039C22.8188 13.1039 24.0129 14.298 24.0129 15.7733C24.0129 17.2486 22.8188 18.4427 21.3435 18.4427C19.8682 18.4427 18.6741 17.2486 18.6741 15.7733C18.6741 15.5823 18.6982 15.3971 18.744 15.2209C18.1001 16.686 17.2361 18.1168 16.1513 19.4229C16.6976 19.6232 17.1411 20.1055 17.3133 20.6987C17.5953 21.6449 17.1454 22.6595 16.1992 22.9416C15.253 23.2236 14.2384 22.7737 13.9564 21.8275C13.7842 21.2343 13.8808 20.6329 14.2008 20.174C12.6226 21.5651 10.7559 22.6523 8.67468 23.3554C8.42248 23.4361 8.1492 23.3345 8.00731 23.1024C7.86543 22.8704 7.89356 22.5774 8.0756 22.3765C9.81916 20.4695 11.0765 18.1745 11.7285 15.6171C11.5051 15.6589 11.2731 15.6808 11.0364 15.6808C10.9255 15.6808 10.8163 15.6736 10.7093 15.6593C10.1111 15.5775 9.59202 15.2734 9.22764 14.8255C8.86327 14.3777 8.68758 13.8182 8.7345 13.2154C8.78143 12.6125 9.03675 12.0887 9.45338 11.7073C9.87002 11.3258 10.4163 11.1182 10.975 11.1205C11.0113 11.1206 11.0475 11.1213 11.0836 11.1224C11.7264 11.152 12.3141 11.4769 12.7143 11.9794C13.1146 12.4819 13.2849 13.137 13.1794 13.7799C12.6687 16.6276 11.3925 19.1898 9.50759 21.2297C11.8049 20.4308 13.8634 19.1183 15.5451 17.4343C15.2251 17.5213 14.8868 17.5678 14.5414 17.5678C13.2079 17.5678 12.062 16.6747 11.7004 15.4535C11.5965 15.1226 11.7579 14.7703 12.0889 14.6664C12.4198 14.5625 12.7722 14.724 12.8761 15.0549C13.0942 15.7982 13.7712 16.3221 14.5414 16.3221C15.4822 16.3221 16.2458 15.5585 16.2458 14.6176C16.2458 14.6009 16.2456 14.5842 16.2452 14.5675C15.3563 11.1357 13.1232 8.02493 9.95001 6.01466C7.48202 8.61129 6.14677 12.3255 6.77618 16.1667C6.83349 16.5095 6.61949 16.8399 6.27671 16.8972C5.93393 16.9545 5.60355 16.7405 5.54624 16.3978C4.84831 12.1244 6.3399 7.99943 9.14385 5.12C8.37367 4.70233 7.55909 4.33383 6.70336 4.01849C5.95786 3.74856 5.58034 2.93336 5.85027 2.18786C6.1202 1.44236 6.9354 1.06484 7.6809 1.3348C8.79518 1.72644 9.84512 2.21203 10.8184 2.78046C10.9336 2.50583 11.082 2.24783 11.2691 2.01443Z" fill="#FFB4B4"/>
      </svg>
    </motion.div>
  );
} 