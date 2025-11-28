"use client"

import type React from "react"
import { AppProviders } from "@/lib/contexts"

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return <AppProviders>{children}</AppProviders>
}
