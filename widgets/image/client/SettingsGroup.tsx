"use client";

import { ReactNode } from "react";

interface SettingsGroupProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export default function SettingsGroup({
  title,
  description,
  children
}: SettingsGroupProps) {
  return (
    <div className="rounded-lg border border-neutral-800 p-4 space-y-4">
      <div>
        <h3 className="text-lg font-medium">{title}</h3>
        {description && (
          <p className="text-sm text-neutral-400 mt-1">{description}</p>
        )}
      </div>
      
      <div className="space-y-4">
        {children}
      </div>
    </div>
  );
} 