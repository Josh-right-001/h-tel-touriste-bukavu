"use client"

import { useState, useEffect, useCallback } from "react"
import { AnimatePresence } from "framer-motion"
import { LoadingScreen } from "@/components/loading-screen"
import { LoginPage } from "@/components/login-page"
import { AdminDashboard } from "@/components/admin/admin-dashboard"
import { InstallPrompt } from "@/components/install-prompt"
import { useAdmin } from "@/lib/contexts"

export default function Home() {
  const [isLoading, setIsLoading] = useState(true)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const { admin, setAdmin } = useAdmin()
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (initialized) return

    const savedSession = localStorage.getItem("hotelTouristeSession")
    if (savedSession) {
      const session = JSON.parse(savedSession)
      setAdmin({ name: session.name, phone: session.phone, role: "admin" })
      setIsAuthenticated(true)
    }
    setInitialized(true)
  }, [initialized, setAdmin])

  const handleLoginSuccess = useCallback(
    (adminData: { name: string; phone: string }) => {
      setAdmin({ name: adminData.name, phone: adminData.phone, role: "admin" })
      setIsAuthenticated(true)
      localStorage.setItem("hotelTouristeSession", JSON.stringify(adminData))
    },
    [setAdmin],
  )

  const handleLogout = useCallback(() => {
    setAdmin(null)
    setIsAuthenticated(false)
    localStorage.removeItem("hotelTouristeSession")
    localStorage.removeItem("hotelTouristeAdminProfile")
  }, [setAdmin])

  return (
    <main className="min-h-screen">
      <AnimatePresence mode="wait">
        {isLoading ? (
          <LoadingScreen key="loading" onComplete={() => setIsLoading(false)} />
        ) : !isAuthenticated ? (
          <LoginPage key="login" onSuccess={handleLoginSuccess} />
        ) : (
          <AdminDashboard
            key="dashboard"
            admin={admin || { name: "Admin", phone: "", role: "admin" }}
            onLogout={handleLogout}
          />
        )}
      </AnimatePresence>
      <InstallPrompt />
    </main>
  )
}
