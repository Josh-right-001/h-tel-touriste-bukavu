"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Building2, Phone, Mail, MapPin, DollarSign, Users, Shield, Save, Plus, Trash2, Check } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { createClient } from "@/lib/supabase/client"
import type { HotelSettings, Admin } from "@/lib/types"

export function SettingsModule() {
  const [settings, setSettings] = useState<HotelSettings | null>(null)
  const [admins, setAdmins] = useState<Admin[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [newAdminPhone, setNewAdminPhone] = useState("")
  const [newAdminName, setNewAdminName] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient()

      const [settingsRes, adminsRes] = await Promise.all([
        supabase.from("hotel_settings").select("*").single(),
        supabase.from("admins").select("*").order("created_at"),
      ])

      setSettings(settingsRes.data)
      setAdmins(adminsRes.data || [])
      setIsLoading(false)
    }

    fetchData()
  }, [])

  const saveSettings = async () => {
    if (!settings) return
    setIsSaving(true)

    const supabase = createClient()
    await supabase
      .from("hotel_settings")
      .update({
        hotel_name: settings.hotel_name,
        address: settings.address,
        phone: settings.phone,
        email: settings.email,
        currency: settings.currency,
        updated_at: new Date().toISOString(),
      })
      .eq("id", settings.id)

    setIsSaving(false)
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  const addAdmin = async () => {
    if (!newAdminPhone || !newAdminName) return

    const supabase = createClient()
    const { data } = await supabase
      .from("admins")
      .insert({
        name: newAdminName,
        phone_number: newAdminPhone,
        is_active: true,
      })
      .select()
      .single()

    if (data) {
      setAdmins([...admins, data])
      setNewAdminPhone("")
      setNewAdminName("")
    }
  }

  const toggleAdmin = async (id: string, isActive: boolean) => {
    const supabase = createClient()
    await supabase.from("admins").update({ is_active: !isActive }).eq("id", id)
    setAdmins((prev) => prev.map((a) => (a.id === id ? { ...a, is_active: !isActive } : a)))
  }

  const deleteAdmin = async (id: string) => {
    const supabase = createClient()
    await supabase.from("admins").delete().eq("id", id)
    setAdmins((prev) => prev.filter((a) => a.id !== id))
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        {[1, 2].map((i) => (
          <Card key={i} className="glass-card border-[#D4AF37]/10">
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 w-48 bg-white/10 rounded" />
                <div className="h-10 w-full bg-white/10 rounded" />
                <div className="h-10 w-full bg-white/10 rounded" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-serif font-bold gold-gradient">Paramètres</h1>
        <p className="text-white/60 mt-1">Configuration de l&apos;hôtel</p>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Hotel info */}
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Building2 className="h-5 w-5 text-[#D4AF37]" />
                Informations de l&apos;hôtel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-white/80">Nom de l&apos;hôtel</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.hotel_name || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, hotel_name: e.target.value } : null))}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Adresse</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.address || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, address: e.target.value } : null))}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Téléphone</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.phone || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, phone: e.target.value } : null))}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    type="email"
                    value={settings?.email || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, email: e.target.value } : null))}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/80">Devise</Label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#D4AF37]/60" />
                  <Input
                    value={settings?.currency || ""}
                    onChange={(e) => setSettings((prev) => (prev ? { ...prev, currency: e.target.value } : null))}
                    className="pl-10 bg-white/5 border-white/10 text-white"
                  />
                </div>
              </div>

              <Button
                onClick={saveSettings}
                disabled={isSaving}
                className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] text-[#071428] font-semibold"
              >
                {isSaving ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                    className="h-5 w-5 border-2 border-[#071428] border-t-transparent rounded-full"
                  />
                ) : success ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Enregistré
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        {/* Admins */}
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
          <Card className="glass-card border-[#D4AF37]/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Shield className="h-5 w-5 text-[#D4AF37]" />
                Numéros autorisés
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new admin */}
              <div className="p-4 rounded-lg bg-white/5 border border-white/10 space-y-3">
                <Input
                  placeholder="Nom"
                  value={newAdminName}
                  onChange={(e) => setNewAdminName(e.target.value)}
                  className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                />
                <div className="flex gap-2">
                  <Input
                    placeholder="+243 XXX XXX XXX"
                    value={newAdminPhone}
                    onChange={(e) => setNewAdminPhone(e.target.value)}
                    className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                  />
                  <Button
                    onClick={addAdmin}
                    disabled={!newAdminPhone || !newAdminName}
                    className="bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Admin list */}
              <div className="space-y-2">
                {admins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`h-8 w-8 rounded-full flex items-center justify-center ${
                          admin.is_active ? "bg-emerald-500/20" : "bg-white/10"
                        }`}
                      >
                        <Users className={`h-4 w-4 ${admin.is_active ? "text-emerald-400" : "text-white/40"}`} />
                      </div>
                      <div>
                        <p className="font-medium text-white">{admin.name}</p>
                        <p className="text-xs text-white/50">{admin.phone_number}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={admin.is_active}
                        onCheckedChange={() => toggleAdmin(admin.id, admin.is_active)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteAdmin(admin.id)}
                        className="text-white/40 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
