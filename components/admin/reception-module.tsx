"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  UserPlus,
  User,
  Phone,
  Mail,
  Globe,
  Calendar,
  Check,
  AlertCircle,
  Sparkles,
  Camera,
  CreditCard,
  X,
  Loader2,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { createClient } from "@/lib/supabase/client"
import { useTheme, useLanguage } from "@/lib/contexts"
import { EnhancedClientForm } from "./enhanced-client-form"
import { useRef } from "react"

interface ReceptionModuleProps {
  onClientAction: (clientId?: string) => void
}

export function ReceptionModule({ onClientAction }: ReceptionModuleProps) {
  const { resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = resolvedTheme === "dark"
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [activeTab, setActiveTab] = useState("quick")
  const [formData, setFormData] = useState({
    fullName: "",
    phoneNumber: "",
    email: "",
    nationality: "",
    numberOfDays: 1,
    notes: "",
  })
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showCamera, setShowCamera] = useState(false)
  const [capturedIdImage, setCapturedIdImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null)

  // Camera functions for ID card capture
  const startCamera = async () => {
    setShowCamera(true)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Camera error:", err)
      setError("Impossible d'accéder à la caméra")
      setShowCamera(false)
    }
  }

  const stopCamera = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream
      stream?.getTracks().forEach((track) => track.stop())
    }
    setShowCamera(false)
  }

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d")
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth
        canvasRef.current.height = videoRef.current.videoHeight
        context.drawImage(videoRef.current, 0, 0)
        const imageData = canvasRef.current.toDataURL("image/jpeg")
        setCapturedIdImage(imageData)
        stopCamera()
        simulateOCR()
      }
    }
  }

  const simulateOCR = () => {
    setIsScanning(true)
    setTimeout(() => {
      setExtractedData({
        detected: "true",
        documentNumber: "ID-" + Math.random().toString(36).substring(2, 8).toUpperCase(),
      })
      setIsScanning(false)
    }, 2000)
  }

  const removeIdImage = () => {
    setCapturedIdImage(null)
    setExtractedData(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      if (!supabase) throw new Error("Supabase not available")

      // Generate matricule
      const date = new Date()
      const year = date.getFullYear().toString().slice(-2)
      const month = (date.getMonth() + 1).toString().padStart(2, "0")
      const random = Math.random().toString(36).substring(2, 6).toUpperCase()
      const matricule = `HT${year}${month}-${random}`

      // Create client with new fields
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          whatsapp_number: formData.phoneNumber,
          whatsapp_country_code: "+243",
          email: formData.email || null,
          nationality: formData.nationality || null,
          pays_origine: formData.nationality || null,
          document_type: capturedIdImage ? "carte_identite" : null,
          document_scan_url: capturedIdImage || null,
          document_data: extractedData || null,
          matricule,
          total_sejours: 1,
          total_nuits: formData.numberOfDays,
          fidelite_score: 10,
          tags: [],
          statut: "actif",
          attribue_par: "admin",
          is_vip: false,
          is_duplicate: false,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Create notification
      await supabase.from("notifications").insert({
        titre: t("newClientRegistered"),
        body: `${formData.fullName} ${t("registeredSuccessfully")}`,
        client_id: client.id,
        type: "client_enregistre",
      })

      // If ID was captured, add notification
      if (capturedIdImage) {
        await supabase.from("notifications").insert({
          titre: "Carte d'identité capturée",
          body: `Carte d'identité capturée pour ${formData.fullName}`,
          client_id: client.id,
          type: "document_scanne",
        })
      }

      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setFormData({
          fullName: "",
          phoneNumber: "",
          email: "",
          nationality: "",
          numberOfDays: 1,
          notes: "",
        })
        setCapturedIdImage(null)
        setExtractedData(null)
      }, 3000)
    } catch (err) {
      console.error("Error:", err)
      setError(t("errorOccurred"))
    } finally {
      setIsLoading(false)
    }
  }

  const handleEnhancedFormSuccess = (clientId: string) => {
    setSuccess(true)
    setTimeout(() => {
      setSuccess(false)
      setActiveTab("quick")
    }, 2000)
  }

  const inputClass = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"

  const labelClass = isDark ? "text-white/80" : "text-slate-700"

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className={`text-2xl font-serif font-bold ${isDark ? "gold-gradient" : "text-[#D4AF37]"}`}>
            {t("reception")}
          </h1>
          <p className={isDark ? "text-white/60 mt-1" : "text-slate-500 mt-1"}>{t("registerNewClient")}</p>
        </div>
        <Button
          onClick={() => onClientAction()}
          variant="outline"
          className={
            isDark
              ? "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
              : "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
          }
        >
          <UserPlus className="h-4 w-4 mr-2" />
          {t("quickNewClient")}
        </Button>
      </motion.div>

      {/* Tabs for Quick vs Enhanced form */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className={`grid w-full max-w-md grid-cols-2 ${isDark ? "bg-white/5" : "bg-slate-100"}`}>
          <TabsTrigger
            value="quick"
            className={isDark ? "data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#071428]" : ""}
          >
            <User className="h-4 w-4 mr-2" />
            {t("quickForm")}
          </TabsTrigger>
          <TabsTrigger
            value="enhanced"
            className={isDark ? "data-[state=active]:bg-[#D4AF37] data-[state=active]:text-[#071428]" : ""}
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {t("completeForm")}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="quick" className="mt-6">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <Card className={isDark ? "glass-card border-[#D4AF37]/10" : "bg-white border-slate-200 shadow-lg"}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
                  <User className="h-5 w-5 text-[#D4AF37]" />
                  {t("registrationForm")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className={labelClass}>{t("fullName")} *</Label>
                      <div className="relative">
                        <User
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                        />
                        <Input
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          placeholder="Jean Dupont"
                          className={`pl-10 ${inputClass}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>{t("phone")} *</Label>
                      <div className="relative">
                        <Phone
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                        />
                        <Input
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                          placeholder="+243 XXX XXX XXX"
                          className={`pl-10 ${inputClass}`}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>{t("email")}</Label>
                      <div className="relative">
                        <Mail
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                        />
                        <Input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@example.com"
                          className={`pl-10 ${inputClass}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>{t("nationality")}</Label>
                      <div className="relative">
                        <Globe
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                        />
                        <Input
                          value={formData.nationality}
                          onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                          placeholder="RD Congo"
                          className={`pl-10 ${inputClass}`}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className={labelClass}>{t("numberOfDays")} *</Label>
                      <div className="relative">
                        <Calendar
                          className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                        />
                        <Input
                          type="number"
                          min={1}
                          value={formData.numberOfDays}
                          onChange={(e) =>
                            setFormData({ ...formData, numberOfDays: Number.parseInt(e.target.value) || 1 })
                          }
                          className={`pl-10 ${inputClass}`}
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className={`flex items-center gap-2 ${labelClass}`}>
                        <CreditCard className="h-4 w-4 text-[#D4AF37]" />
                        Capture carte d&apos;identité (optionnel)
                      </Label>
                      {!capturedIdImage && !showCamera && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={startCamera}
                          className={
                            isDark
                              ? "border-[#D4AF37]/30 text-[#D4AF37] hover:bg-[#D4AF37]/10"
                              : "border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10"
                          }
                        >
                          <Camera className="h-4 w-4 mr-2" />
                          Capturer
                        </Button>
                      )}
                    </div>

                    {/* Camera view */}
                    <AnimatePresence>
                      {showCamera && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="relative rounded-xl overflow-hidden border-2 border-dashed border-[#D4AF37]/30"
                        >
                          <video ref={videoRef} autoPlay playsInline className="w-full rounded-lg" />
                          <div className="absolute inset-0 pointer-events-none">
                            <div className="absolute inset-8 border-2 border-[#D4AF37]/50 rounded-lg" />
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black/50 text-white text-sm px-3 py-1 rounded-full">
                              Positionnez la carte dans le cadre
                            </div>
                          </div>
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            <Button
                              type="button"
                              onClick={capturePhoto}
                              className="bg-[#D4AF37] hover:bg-[#F4D03F] text-[#071428]"
                            >
                              <Camera className="h-4 w-4 mr-2" />
                              Capturer
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              onClick={stopCamera}
                              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Annuler
                            </Button>
                          </div>
                          <canvas ref={canvasRef} className="hidden" />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Captured ID preview */}
                    {capturedIdImage && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 rounded-xl border ${isDark ? "bg-white/5 border-[#D4AF37]/20" : "bg-slate-50 border-slate-200"}`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="relative">
                            <img
                              src={capturedIdImage || "/placeholder.svg"}
                              alt="Carte d'identité"
                              className="w-32 h-20 object-cover rounded-lg border border-[#D4AF37]/20"
                            />
                            <button
                              type="button"
                              onClick={removeIdImage}
                              className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CreditCard className="h-4 w-4 text-[#D4AF37]" />
                              <span className={isDark ? "text-white font-medium" : "text-slate-900 font-medium"}>
                                Carte capturée
                              </span>
                            </div>
                            {isScanning ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                                <span className={isDark ? "text-white/60 text-sm" : "text-slate-500 text-sm"}>
                                  Analyse...
                                </span>
                              </div>
                            ) : extractedData ? (
                              <div className="flex items-center gap-2 text-emerald-500">
                                <Check className="h-4 w-4" />
                                <span className="text-sm">Réf: {extractedData.documentNumber}</span>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400"
                    >
                      <AlertCircle className="h-4 w-4" />
                      <span className="text-sm">{error}</span>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                    >
                      <Check className="h-4 w-4" />
                      <span className="text-sm">{t("clientRegisteredSuccess")}</span>
                    </motion.div>
                  )}

                  <Button
                    type="submit"
                    disabled={isLoading || success}
                    className="w-full bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold h-12"
                  >
                    {isLoading ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                        className="h-5 w-5 border-2 border-[#071428] border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        <Check className="h-5 w-5 mr-2" />
                        {t("registerClient")}
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="enhanced" className="mt-6">
          <EnhancedClientForm onSuccess={handleEnhancedFormSuccess} isReceptionist={false} />
        </TabsContent>
      </Tabs>
    </div>
  )
}
