"use client"

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { NotificationProvider } from "@/widgets/shared/custom-notification"
import { ErrorNotificationListener } from "../shared/lib/error-notification"


export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <QueryClientProvider client={queryClient}>
      <NotificationProvider>
        <ErrorNotificationListener />
        {children}
      </NotificationProvider>
    </QueryClientProvider>
  )
} 