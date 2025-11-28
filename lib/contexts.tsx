"use client"

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react"
import { translations, type Language, type TranslationKey } from "./i18n"

// Theme Context
type Theme = "light" | "dark" | "system"

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  resolvedTheme: "light" | "dark"
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error("useTheme must be used within ThemeProvider")
  return context
}

// Language Context
interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: TranslationKey) => string
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) throw new Error("useLanguage must be used within LanguageProvider")
  return context
}

// Admin Profile Context
interface AdminProfile {
  name: string
  phone: string
  avatar?: string
  role: string
}

interface AdminContextType {
  admin: AdminProfile | null
  setAdmin: (admin: AdminProfile | null) => void
  updateProfile: (updates: Partial<AdminProfile>) => void
}

const AdminContext = createContext<AdminContextType | undefined>(undefined)

export function useAdmin() {
  const context = useContext(AdminContext)
  if (!context) throw new Error("useAdmin must be used within AdminProvider")
  return context
}

// Combined Provider
interface AppProvidersProps {
  children: ReactNode
}

export function AppProviders({ children }: AppProvidersProps) {
  // Theme state
  const [theme, setThemeState] = useState<Theme>("dark")
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("dark")

  // Language state
  const [language, setLanguageState] = useState<Language>("fr")

  // Admin state
  const [admin, setAdminState] = useState<AdminProfile | null>(null)

  // Initialize from localStorage
  useEffect(() => {
    const savedTheme = localStorage.getItem("hotelTouristeTheme") as Theme | null
    const savedLanguage = localStorage.getItem("hotelTouristeLanguage") as Language | null
    const savedAdmin = localStorage.getItem("hotelTouristeAdminProfile")

    if (savedTheme) setThemeState(savedTheme)
    if (savedLanguage) setLanguageState(savedLanguage)
    if (savedAdmin) setAdminState(JSON.parse(savedAdmin))
  }, [])

  // Update resolved theme
  useEffect(() => {
    const updateResolvedTheme = () => {
      if (theme === "system") {
        const systemDark = window.matchMedia("(prefers-color-scheme: dark)").matches
        setResolvedTheme(systemDark ? "dark" : "light")
      } else {
        setResolvedTheme(theme)
      }
    }

    updateResolvedTheme()

    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)")
      mediaQuery.addEventListener("change", updateResolvedTheme)
      return () => mediaQuery.removeEventListener("change", updateResolvedTheme)
    }
  }, [theme])

  // Apply theme to document
  useEffect(() => {
    document.documentElement.classList.remove("light", "dark")
    document.documentElement.classList.add(resolvedTheme)
  }, [resolvedTheme])

  const setTheme = useCallback((newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem("hotelTouristeTheme", newTheme)
  }, [])

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang)
    localStorage.setItem("hotelTouristeLanguage", lang)
  }, [])

  const t = useCallback(
    (key: TranslationKey): string => {
      return translations[language][key] || key
    },
    [language],
  )

  const setAdmin = useCallback((newAdmin: AdminProfile | null) => {
    setAdminState(newAdmin)
    if (newAdmin) {
      localStorage.setItem("hotelTouristeAdminProfile", JSON.stringify(newAdmin))
    } else {
      localStorage.removeItem("hotelTouristeAdminProfile")
    }
  }, [])

  const updateProfile = useCallback((updates: Partial<AdminProfile>) => {
    setAdminState((current) => {
      if (current) {
        const updatedAdmin = { ...current, ...updates }
        localStorage.setItem("hotelTouristeAdminProfile", JSON.stringify(updatedAdmin))
        return updatedAdmin
      }
      return current
    })
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolvedTheme }}>
      <LanguageContext.Provider value={{ language, setLanguage, t }}>
        <AdminContext.Provider value={{ admin, setAdmin, updateProfile }}>{children}</AdminContext.Provider>
      </LanguageContext.Provider>
    </ThemeContext.Provider>
  )
}
