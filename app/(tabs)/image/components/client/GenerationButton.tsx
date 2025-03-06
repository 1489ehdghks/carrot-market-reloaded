"use client";

import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface GenerationButtonProps {
  isGenerating: boolean;
  disabled: boolean;
}

export default function GenerationButton({
  isGenerating,
  disabled
}: GenerationButtonProps) {
  return (
    <Button 
      type="submit"
      disabled={disabled}
      className="w-full"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        "Generate Image"
      )}
    </Button>
  );
} 