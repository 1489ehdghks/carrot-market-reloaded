import { Input as InputUI } from "@/components/ui/input";
import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  errors?: string[];
}

export default function CustomInput({
  className,
  errors,
  ...props
}: InputProps) {
  return (
    <div className="space-y-1">
      <InputUI 
        className={`border-neutral-300 focus:border-[#FFB4B4] ${className}`} 
        {...props}
      />
      {errors?.map((error, i) => (
        <p key={i} className="text-red-500 text-sm">
          {error}
        </p>
      ))}
    </div>
  );
} 