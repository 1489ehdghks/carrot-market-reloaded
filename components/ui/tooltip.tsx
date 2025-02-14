"use client"

import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"

export function Tooltip({
  children,
  content,
  delayDuration = 0,
}: {
  children: React.ReactNode
  content: React.ReactNode
  delayDuration?: number
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={delayDuration}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            className="z-50 overflow-hidden rounded-md bg-neutral-900 px-3 py-2 text-sm text-neutral-50 shadow-md animate-in fade-in-0 zoom-in-95"
            sideOffset={5}
          >
            {content}
            <TooltipPrimitive.Arrow className="fill-neutral-900" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  )
} 