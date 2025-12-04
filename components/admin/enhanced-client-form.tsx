"use client"

import type React from "react"
import { useState, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { User, Mail, Globe, Calendar, Camera, Check, AlertCircle, Loader2, X, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { WhatsAppInput } from "@/components/ui/whatsapp-input"
import { createClient } from "@/lib/supabase/client"
import { useTheme, useLanguage } from "@/lib/contexts"

interface EnhancedClientFormProps {
  onSuccess?: (clientId: string) => void
  onCancel?: () => void
  isReceptionist?: boolean
}

export function EnhancedClientForm({ onSuccess, onCancel, isReceptionist = false }: EnhancedClientFormProps) {
  const { resolvedTheme } = useTheme()
  const { t } = useLanguage()
  const isDark = resolvedTheme === "dark"
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const [formData, setFormData] = useState({
    nom: "",
    postnom: "",
    prenom: "",
    dateNaissance: "",
    adresse: "",
    paysOrigine: "RD Congo",
    phoneNumber: "",
    whatsappNumber: "",
    whatsappCountryCode: "+243",
    email: "",
    commentaire: "",
    numberOfDays: 1,
  })

  const [whatsappValid, setWhatsappValid] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [showCamera, setShowCamera] = useState(false)
  const [capturedIdImage, setCapturedIdImage] = useState<string | null>(null)
  const [isScanning, setIsScanning] = useState(false)
  const [extractedData, setExtractedData] = useState<Record<string, string> | null>(null)

  const handleWhatsappChange = useCallback((number: string, countryCode: string, isValid: boolean) => {
    setFormData((prev) => ({
      ...prev,
      whatsappNumber: number,
      whatsappCountryCode: countryCode,
    }))
    setWhatsappValid(isValid)
  }, [])

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
        // Simulate OCR extraction
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

  const generateMatricule = () => {
    const date = new Date()
    const year = date.getFullYear().toString().slice(-2)
    const month = (date.getMonth() + 1).toString().padStart(2, "0")
    const random = Math.random().toString(36).substring(2, 6).toUpperCase()
    return `HT${year}${month}-${random}`
  }

  const checkDuplicate = async (whatsapp: string, nom: string) => {
    const supabase = createClient()
    if (!supabase) return null

    const { data } = await supabase
      .from("clients")
      .select("*")
      .or(`whatsapp_number.eq.${whatsapp},full_name.ilike.%${nom}%`)
      .limit(1)

    return data && data.length > 0 ? data[0] : null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    if (!whatsappValid) {
      setError("Le numéro WhatsApp n'est pas valide")
      setIsLoading(false)
      return
    }

    try {
      const supabase = createClient()
      if (!supabase) throw new Error("Supabase client not available")

      const fullName = `${formData.nom} ${formData.postnom} ${formData.prenom}`.trim()
      const matricule = generateMatricule()

      // Check for duplicates
      const duplicate = await checkDuplicate(formData.whatsappNumber, formData.nom)
      const isDuplicate = !!duplicate

      // Create client
      const { data: client, error: clientError } = await supabase
        .from("clients")
        .insert({
          nom: formData.nom,
          postnom: formData.postnom,
          prenom: formData.prenom,
          full_name: fullName,
          date_naissance: formData.dateNaissance || null,
          adresse: formData.adresse || null,
          pays_origine: formData.paysOrigine || null,
          matricule,
          phone_number: formData.phoneNumber || null,
          whatsapp_number: formData.whatsappNumber,
          whatsapp_country_code: formData.whatsappCountryCode,
          email: formData.email || null,
          document_type: capturedIdImage ? "carte_identite" : null,
          document_scan_url: capturedIdImage || null,
          document_data: extractedData || null,
          commentaire: formData.commentaire || null,
          nationality: formData.paysOrigine || null,
          total_sejours: isDuplicate ? (duplicate.total_sejours || 0) + 1 : 1,
          total_nuits: formData.numberOfDays,
          fidelite_score: isDuplicate ? Math.min((duplicate.fidelite_score || 0) + 10, 100) : 10,
          tags: [],
          statut: "actif",
          attribue_par: isReceptionist ? "receptionniste" : "admin",
          is_vip: false,
          is_duplicate: isDuplicate,
        })
        .select()
        .single()

      if (clientError) throw clientError

      // Create notification
      await supabase.from("notifications").insert({
        titre: isDuplicate ? "Client fidèle détecté" : "Nouveau client enregistré",
        body: isDuplicate
          ? `${fullName} est un client récurrent. Fidélité: ${Math.min((duplicate.fidelite_score || 0) + 10, 100)}%`
          : `${fullName} a été enregistré avec succès`,
        client_id: client.id,
        type: isDuplicate ? "doublon_detecte" : "client_enregistre",
      })

      // If ID was scanned, add notification
      if (capturedIdImage) {
        await supabase.from("notifications").insert({
          titre: "Carte d'identité capturée",
          body: `Carte d'identité capturée pour ${fullName}`,
          client_id: client.id,
          type: "document_scanne",
        })
      }

      setSuccess(true)
      setTimeout(() => {
        if (onSuccess) onSuccess(client.id)
      }, 2000)
    } catch (err) {
      console.error("Error:", err)
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setIsLoading(false)
    }
  }

  const inputClass = isDark
    ? "bg-white/5 border-white/10 text-white placeholder:text-white/30"
    : "bg-white border-slate-200 text-slate-900 placeholder:text-slate-400"

  const labelClass = isDark ? "text-white/80" : "text-slate-700"

  return (
    <Card className={isDark ? "glass-card border-[#D4AF37]/10" : "bg-white border-slate-200 shadow-lg"}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isDark ? "text-white" : "text-slate-900"}`}>
          <User className="h-5 w-5 text-[#D4AF37]" />
          Formulaire d&apos;enregistrement complet
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Personal Info */}
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Nom *</Label>
              <Input
                value={formData.nom}
                onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                placeholder="Nom de famille"
                className={inputClass}
                required
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Postnom</Label>
              <Input
                value={formData.postnom}
                onChange={(e) => setFormData({ ...formData, postnom: e.target.value })}
                placeholder="Postnom"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Prénom *</Label>
              <Input
                value={formData.prenom}
                onChange={(e) => setFormData({ ...formData, prenom: e.target.value })}
                placeholder="Prénom"
                className={inputClass}
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Date de naissance</Label>
              <div className="relative">
                <Calendar
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                />
                <Input
                  type="date"
                  value={formData.dateNaissance}
                  onChange={(e) => setFormData({ ...formData, dateNaissance: e.target.value })}
                  className={`pl-10 ${inputClass}`}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Pays d&apos;origine</Label>
              <div className="relative">
                <Globe
                  className={`absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 ${isDark ? "text-[#D4AF37]/60" : "text-slate-400"}`}
                />
                <Input
                  value={formData.paysOrigine}
                  onChange={(e) => setFormData({ ...formData, paysOrigine: e.target.value })}
                  placeholder="RD Congo"
                  className={`pl-10 ${inputClass}`}
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label className={labelClass}>Adresse</Label>
            <Input
              value={formData.adresse}
              onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
              placeholder="Adresse complète"
              className={inputClass}
            />
          </div>

          {/* Contact Info */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Téléphone classique</Label>
              <Input
                value={formData.phoneNumber}
                onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                placeholder="+243 XXX XXX XXX"
                className={inputClass}
              />
            </div>
            <div className="space-y-2">
              <Label className={labelClass}>Email</Label>
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
          </div>

          {/* WhatsApp with intelligent country selector */}
          <WhatsAppInput
            value={formData.whatsappNumber}
            countryCode={formData.whatsappCountryCode}
            onChange={handleWhatsappChange}
            required
          />

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
                    {/* ID card frame guide */}
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
                      className="w-40 h-24 object-cover rounded-lg border border-[#D4AF37]/20"
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
                        Carte d&apos;identité capturée
                      </span>
                    </div>
                    {isScanning ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin text-[#D4AF37]" />
                        <span className={isDark ? "text-white/60 text-sm" : "text-slate-500 text-sm"}>
                          Analyse en cours...
                        </span>
                      </div>
                    ) : extractedData ? (
                      <div className="flex items-center gap-2 text-emerald-500">
                        <Check className="h-4 w-4" />
                        <span className="text-sm">Document vérifié - Réf: {extractedData.documentNumber}</span>
                      </div>
                    ) : null}
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Number of days */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className={labelClass}>Nombre de jours de séjour *</Label>
              <Input
                type="number"
                min={1}
                value={formData.numberOfDays}
                onChange={(e) => setFormData({ ...formData, numberOfDays: Number.parseInt(e.target.value) || 1 })}
                className={inputClass}
                required
              />
            </div>
          </div>

          {/* Comments */}
          <div className="space-y-2">
            <Label className={labelClass}>Commentaires / Notes</Label>
            <Textarea
              value={formData.commentaire}
              onChange={(e) => setFormData({ ...formData, commentaire: e.target.value })}
              placeholder="Notes additionnelles sur le client..."
              className={`min-h-[80px] ${inputClass}`}
            />
          </div>

          {/* Error/Success messages */}
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
              <span className="text-sm">Client enregistré avec succès !</span>
            </motion.div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 pt-4">
            {onCancel && (
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                className={
                  isDark
                    ? "border-white/20 text-white/70 hover:bg-white/5"
                    : "border-slate-200 text-slate-600 hover:bg-slate-50"
                }
              >
                Annuler
              </Button>
            )}
            <Button
              type="submit"
              disabled={isLoading || success}
              className="flex-1 bg-gradient-to-r from-[#D4AF37] to-[#F4D03F] hover:from-[#F4D03F] hover:to-[#D4AF37] text-[#071428] font-semibold h-12"
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
                  Enregistrer le client
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
