"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import {
  Users,
  BedDouble,
  Calendar,
  TrendingUp,
  UserPlus,
  Building2,
  History,
  Bell,
  Bot,
  Settings,
  ArrowRight,
  CheckCircle,
  Clock,
  AlertCircle,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { createClient } from "@/lib/supabase/client"
import { useLanguage, useTheme } from "@/lib/contexts"

interface DashboardHomeProps {
  onNavigate: (module: string) => void
  onClientAction: (clientId?: string) => void
}

interface Stats {
  totalClients: number
  totalRooms: number
  availableRooms: number
  occupiedRooms: number
  activeReservations: number
  todayCheckIns: number
}

export function DashboardHome({ onNavigate, onClientAction }: DashboardHomeProps) {
  const [stats, setStats] = useState<Stats>({
    totalClients: 0,
    totalRooms: 0,
    availableRooms: 0,
    occupiedRooms: 0,
    activeReservations: 0,
    todayCheckIns: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const { t } = useLanguage()
  const { resolvedTheme } = useTheme()

  const quickActions = [
    {
      id: "reception",
      label: t("reception"),
      icon: UserPlus,
      color: "from-emerald-500 to-emerald-600",
      description: t("registerClient"),
    },
    {
      id: "clients",
      label: t("clients"),
      icon: Users,
      color: "from-blue-500 to-blue-600",
      description: t("clientList"),
    },
    {
      id: "rooms",
      label: t("rooms"),
      icon: BedDouble,
      color: "from-purple-500 to-purple-600",
      description: t("roomManagement"),
    },
    {
      id: "history",
      label: t("history"),
      icon: History,
      color: "from-orange-500 to-orange-600",
      description: t("exportJson"),
    },
    {
      id: "notifications",
      label: t("notifications"),
      icon: Bell,
      color: "from-red-500 to-red-600",
      description: t("notifications"),
    },
    {
      id: "bot",
      label: t("botMessages"),
      icon: Bot,
      color: "from-cyan-500 to-cyan-600",
      description: t("messageAutomation"),
    },
    {
      id: "settings",
      label: t("settings"),
      icon: Settings,
      color: "from-gray-500 to-gray-600",
      description: t("settings"),
    },
  ]

  useEffect(() => {
    const fetchStats = async () => {
      const supabase = createClient()

      try {
        const [clientsRes, roomsRes, reservationsRes] = await Promise.all([
          supabase.from("clients").select("*", { count: "exact", head: true }),
          supabase.from("rooms").select("*"),
          supabase.from("reservations").select("*").eq("status", "active"),
        ])

        const rooms = roomsRes.data || []
        const availableRooms = rooms.filter((r) => r.status === "Disponible").length
        const occupiedRooms = rooms.filter((r) => r.status === "Occupée").length

        const today = new Date().toISOString().split("T")[0]
        const { count: todayCheckIns } = await supabase
          .from("reservations")
          .select("*", { count: "exact", head: true })
          .eq("check_in_date", today)

        setStats({
          totalClients: clientsRes.count || 0,
          totalRooms: rooms.length,
          availableRooms,
          occupiedRooms,
          activeReservations: reservationsRes.data?.length || 0,
          todayCheckIns: todayCheckIns || 0,
        })
      } catch (error) {
        console.error("Error fetching stats:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [])

  const statCards = [
    { label: t("totalClients"), value: stats.totalClients, icon: Users, color: "text-blue-400" },
    { label: t("availableRooms"), value: stats.availableRooms, icon: CheckCircle, color: "text-emerald-400" },
    { label: t("occupiedRooms"), value: stats.occupiedRooms, icon: BedDouble, color: "text-orange-400" },
    { label: t("activeReservations"), value: stats.activeReservations, icon: Calendar, color: "text-purple-400" },
    { label: t("todayCheckins"), value: stats.todayCheckIns, icon: Clock, color: "text-cyan-400" },
    { label: t("totalRooms"), value: stats.totalRooms, icon: Building2, color: "text-[#D4AF37]" },
  ]

  const cardClass =
    resolvedTheme === "light"
      ? "bg-white border-slate-200 shadow-sm hover:shadow-md"
      : "glass-card border-[#D4AF37]/10 hover:border-[#D4AF37]/30"

  const textClass = resolvedTheme === "light" ? "text-slate-900" : "text-white"
  const textMutedClass = resolvedTheme === "light" ? "text-slate-500" : "text-white/60"

  return (
    <div className="space-y-6">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`rounded-2xl p-6 ${cardClass}`}
      >
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold gold-gradient">{t("welcome")}</h1>
            <p className={`mt-1 ${textMutedClass}`}>{t("manageHotel")}</p>
          </div>
          <Button
            onClick={() => onClientAction()}
            className="bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold ripple"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            {t("newClient")}
          </Button>
        </div>
      </motion.div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`${cardClass} transition-all duration-300`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  {isLoading ? (
                    <div
                      className={`h-6 w-8 rounded animate-pulse ${resolvedTheme === "light" ? "bg-slate-200" : "bg-white/10"}`}
                    />
                  ) : (
                    <span className={`text-2xl font-bold ${textClass}`}>{stat.value}</span>
                  )}
                </div>
                <p className={`text-xs ${textMutedClass}`}>{stat.label}</p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div>
        <h2 className={`text-lg font-semibold mb-4 ${textClass}`}>{t("quickActions")}</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {quickActions.map((action, index) => (
            <motion.button
              key={action.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => onNavigate(action.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`rounded-xl p-4 text-left group transition-all duration-300 ${cardClass}`}
            >
              <div
                className={`h-10 w-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
              >
                <action.icon className="h-5 w-5 text-white" />
              </div>
              <h3 className={`font-semibold group-hover:text-[#D4AF37] transition-colors ${textClass}`}>
                {action.label}
              </h3>
              <p className={`text-xs mt-1 ${textMutedClass}`}>{action.description}</p>
              <ArrowRight
                className={`h-4 w-4 mt-2 transition-all group-hover:translate-x-1 ${textMutedClass} group-hover:text-[#D4AF37]`}
              />
            </motion.button>
          ))}
        </div>
      </div>

      {/* Recent activity */}
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle className={`${textClass} flex items-center gap-2`}>
            <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
            {t("recentActivity")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                  resolvedTheme === "light" ? "bg-slate-50 hover:bg-slate-100" : "bg-white/5 hover:bg-white/10"
                }`}
              >
                <div className="h-8 w-8 rounded-full bg-[#D4AF37]/20 flex items-center justify-center">
                  <Users className="h-4 w-4 text-[#D4AF37]" />
                </div>
                <div className="flex-1">
                  <p className={`text-sm ${textClass}`}>
                    {t("newClient")} #{i}
                  </p>
                  <p className={`text-xs ${textMutedClass}`}>Il y a {i * 5} minutes</p>
                </div>
                <AlertCircle className={textMutedClass} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
