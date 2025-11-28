"use client"

import { motion } from "framer-motion"
import { UserCog, Send, User, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { useLanguage, useTheme } from "@/lib/contexts"

interface ClientModalProps {
  isOpen: boolean
  onClose: () => void
  clientId?: string | null
}

export function ClientModal({ isOpen, onClose, clientId }: ClientModalProps) {
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  const handleExecuteSelf = () => {
    window.location.href = clientId ? `/admin/client/${clientId}` : "/admin/reception"
    onClose()
  }

  const handleGiveToReceptionist = () => {
    const url = clientId ? `/reception/handling?clientId=${clientId}` : "/reception"
    window.open(url, "_blank")
    onClose()
  }

  const cardBgClass =
    resolvedTheme === "light"
      ? "bg-slate-50 border-slate-200 hover:border-slate-300"
      : "glass border-[#D4AF37]/20 hover:border-[#D4AF37]/40"

  const textClass = resolvedTheme === "light" ? "text-slate-900" : "text-white"
  const textMutedClass = resolvedTheme === "light" ? "text-slate-500" : "text-white/60"

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`max-w-md ${
          resolvedTheme === "light" ? "bg-white border-slate-200" : "glass-card border-[#D4AF37]/20"
        }`}
      >
        <DialogHeader>
          <DialogTitle
            className={`text-xl font-serif flex items-center gap-2 ${
              resolvedTheme === "light" ? "text-slate-900" : "gold-gradient"
            }`}
          >
            <User className="h-5 w-5 text-[#D4AF37]" />
            {t("whatToDo")}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Option A: Execute myself */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleExecuteSelf}
            className={`w-full p-4 rounded-xl border transition-all group text-left ${cardBgClass}`}
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-lg bg-[#D4AF37]/20 flex items-center justify-center group-hover:bg-[#D4AF37]/30 transition-colors">
                <UserCog className="h-6 w-6 text-[#D4AF37]" />
              </div>
              <div className="flex-1">
                <h3 className={`font-semibold group-hover:text-[#D4AF37] transition-colors ${textClass}`}>
                  {t("executeSelf")}
                </h3>
                <p className={`text-sm mt-1 ${textMutedClass}`}>{t("executeSelfDesc")}</p>
              </div>
            </div>
          </motion.button>

          {/* Option B: Give to receptionist */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleGiveToReceptionist}
            className={`w-full p-4 rounded-xl border transition-all group text-left ${
              resolvedTheme === "light"
                ? "bg-white border-slate-200 hover:border-slate-300"
                : "glass border-white/10 hover:border-white/20"
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className={`h-12 w-12 rounded-lg flex items-center justify-center transition-colors ${
                  resolvedTheme === "light"
                    ? "bg-slate-100 group-hover:bg-slate-200"
                    : "bg-white/10 group-hover:bg-white/20"
                }`}
              >
                <Send className={`h-6 w-6 ${resolvedTheme === "light" ? "text-slate-600" : "text-white/80"}`} />
              </div>
              <div className="flex-1">
                <h3
                  className={`font-semibold transition-colors flex items-center gap-2 ${
                    resolvedTheme === "light"
                      ? "text-slate-700 group-hover:text-slate-900"
                      : "text-white/90 group-hover:text-white"
                  }`}
                >
                  {t("giveToReceptionist")}
                  <ExternalLink className="h-4 w-4" />
                </h3>
                <p className={`text-sm mt-1 ${textMutedClass}`}>{t("giveToReceptionistDesc")}</p>
              </div>
            </div>
          </motion.button>
        </div>

        <div className={`mt-4 pt-4 border-t ${resolvedTheme === "light" ? "border-slate-200" : "border-white/10"}`}>
          <Button
            variant="ghost"
            onClick={onClose}
            className={`w-full ${textMutedClass} hover:${textClass} ${
              resolvedTheme === "light" ? "hover:bg-slate-100" : "hover:bg-white/5"
            }`}
          >
            {t("cancel")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
