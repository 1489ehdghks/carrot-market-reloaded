import { Button as ButtonUI } from "@/components/ui/button";
import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";
import { ReloadIcon } from "@radix-ui/react-icons";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  text: string;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link"
    | "primary";
  isLoading?: boolean;
}

export default function CustomButton({
  text,
  variant = "default",
  isLoading,
  className,
  ...props
}: ButtonProps) {
  let variantClass = variant;
  
  if (variant === "primary") {
    variantClass = "default"; // 기본 스타일을 사용하고 추가적인 커스텀 클래스를 적용
  }
  
  return (
    <ButtonUI
      variant={variantClass as any}
      className={cn(
        variant === "primary" && "w-full h-12 bg-[#FFB4B4] hover:bg-[#FF9B9B] text-black font-medium",
        className
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <ReloadIcon className="mr-2 h-4 w-4 animate-spin" /> : null}
      {text}
    </ButtonUI>
  );
} 