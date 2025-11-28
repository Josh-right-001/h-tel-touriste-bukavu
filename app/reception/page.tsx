"use client"

import { Suspense } from "react"
import dynamic from "next/dynamic"
import Image from "next/image"

const ReceptionModule = dynamic(
  () => import("@/components/admin/reception-module").then((mod) => ({ default: mod.ReceptionModule })),
  { ssr: false },
)

function ReceptionContent() {
  return (
    <div className="min-h-screen bg-[#071428] p-4 lg:p-6">
      {/* Header */}
      <div className="glass-card rounded-2xl p-4 mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image src="/logo.png" alt="Logo" width={40} height={40} />
          <div>
            <h1 className="font-serif font-bold text-lg gold-gradient">HÔTEL TOURISTE</h1>
            <p className="text-xs text-white/50">Interface Réceptionniste</p>
          </div>
        </div>
      </div>

      <ReceptionModule onClientAction={() => {}} />
    </div>
  )
}

export default function ReceptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#071428] flex items-center justify-center">
          <div className="w-10 h-10 border-2 border-[#D4AF37] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReceptionContent />
    </Suspense>
  )
}
