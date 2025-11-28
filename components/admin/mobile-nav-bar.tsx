"use client"

import { motion } from "framer-motion"
import { LayoutDashboard, Users, BedDouble, Bell, Settings } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useLanguage, useTheme } from "@/lib/contexts"

type ModuleType = "dashboard" | "reception" | "clients" | "rooms" | "history" | "notifications" | "bot" | "settings"

interface MobileNavBarProps {
  activeModule: ModuleType
  setActiveModule: (module: ModuleType) => void
  unreadNotifications: number
}

export function MobileNavBar({ activeModule, setActiveModule, unreadNotifications }: MobileNavBarProps) {
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  const navItems = [
    { id: "dashboard" as const, label: t("dashboard"), icon: LayoutDashboard },
    { id: "clients" as const, label: t("clients"), icon: Users },
    { id: "rooms" as const, label: t("rooms"), icon: BedDouble },
    { id: "notifications" as const, label: t("notifications"), icon: Bell, badge: unreadNotifications },
    { id: "settings" as const, label: t("settings"), icon: Settings },
  ]

  return (
    <motion.nav
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className={`fixed bottom-4 left-4 right-4 z-50 rounded-2xl px-2 py-3 ${
        resolvedTheme === "light"
          ? "bg-white/90 backdrop-blur-xl shadow-2xl border border-slate-200"
          : "bg-[#0F2744]/80 backdrop-blur-xl border border-[#D4AF37]/20 shadow-2xl shadow-black/50"
      }`}
    >
      <div className="flex items-center justify-around">
        {navItems.map((item) => {
          const isActive = activeModule === item.id
          return (
            <motion.button
              key={item.id}
              onClick={() => setActiveModule(item.id)}
              whileTap={{ scale: 0.9 }}
              className="relative flex flex-col items-center gap-1 px-3 py-1"
            >
              {/* Active indicator */}
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 rounded-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F]"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}

              {/* Icon with badge */}
              <div className="relative">
                <motion.div
                  animate={{
                    scale: isActive ? 1.2 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`p-2 rounded-xl ${isActive ? "bg-[#D4AF37]/20" : "bg-transparent"}`}
                >
                  <item.icon
                    className={`h-5 w-5 transition-colors ${
                      isActive ? "text-[#D4AF37]" : resolvedTheme === "light" ? "text-slate-400" : "text-white/40"
                    }`}
                  />
                </motion.div>

                {/* Notification badge */}
                {item.badge && item.badge > 0 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-1 -right-1">
                    <Badge className="h-5 min-w-5 px-1 bg-red-500 text-white text-xs flex items-center justify-center">
                      {item.badge > 99 ? "99+" : item.badge}
                    </Badge>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <motion.span
                animate={{
                  opacity: isActive ? 1 : 0.6,
                  fontWeight: isActive ? 600 : 400,
                }}
                className={`text-[10px] ${
                  isActive ? "text-[#D4AF37]" : resolvedTheme === "light" ? "text-slate-500" : "text-white/50"
                }`}
              >
                {item.label}
              </motion.span>
            </motion.button>
          )
        })}
      </div>
    </motion.nav>
  )
}
