import { ReactNode } from "react";
import { Tooltip } from "./tooltip";

interface CustomTooltipProps {
  title: string;
  description?: ReactNode;
  children: ReactNode;
  content?: ReactNode;
  className?: string;
}

export function CustomTooltip({ 
  title, 
  description, 
  children, 
  content,
  className = "max-w-xs" 
}: CustomTooltipProps) {
  return (
    <Tooltip 
      content={
        <div className={`p-3 border border-neutral-700 rounded-lg bg-neutral-900 ${className}`}>
          <div className="font-medium text-white mb-2">{title}</div>
          {description && (
            <div className="text-sm text-neutral-400 mb-3">
              {description}
            </div>
          )}
          {content && (
            <div className="space-y-2 border-t border-neutral-700 pt-2">
              {content}
            </div>
          )}
        </div>
      }
    >
      {children}
    </Tooltip>
  );
} 