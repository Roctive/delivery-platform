"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Camera, MapPin, Loader2, CheckCircle2, AlertCircle } from "lucide-react"

interface HidingSpotFormProps {
    deliveryId: string
    deliveryAddress: string
    onSuccess: () => void
}

export default function HidingSpotForm({ deliveryId, deliveryAddress, onSuccess }: HidingSpotFormProps) {
    const [photoBase64, setPhotoBase64] = useState<string>("")
    const [photoPreview, setPhotoPreview] = useState<string>("")
    const [latitude, setLatitude] = useState<number | null>(null)
    const [longitude, setLongitude] = useState<number | null>(null)
    const [description, setDescription] = useState("")
    const [gpsError, setGpsError] = useState<string>("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        // Get current GPS position
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setLatitude(position.coords.latitude)
                    setLongitude(position.coords.longitude)
                },
                (error) => {
                    setGpsError("Impossible d'obtenir votre position GPS. Veuillez activer la géolocalisation.")
                    console.error("GPS error:", error)
                }
            )
        } else {
            setGpsError("La géolocalisation n'est pas supportée par votre navigateur")
        }
    }, [])

    function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith("image/")) {
            setError("Veuillez sélectionner une image")
            return
        }

        // Validate file size (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            setError("L'image est trop volumineuse (max 10MB)")
            return
        }

        // Convert to base64
        const reader = new FileReader()
        reader.onloadend = () => {
            const base64 = reader.result as string
            setPhotoBase64(base64)
            setPhotoPreview(base64)
            setError("")
        }
        reader.readAsDataURL(file)
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        if (!photoBase64) {
            setError("Veuillez prendre une photo de la cachette")
            return
        }

        if (latitude === null || longitude === null) {
            setError("Position GPS non disponible")
            return
        }

        setSubmitting(true)
        setError("")

        try {
            const response = await fetch(`/api/deliveries/${deliveryId}/hiding-spot`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    photoBase64,
                    latitude,
                    longitude,
                    description
                })
            })

            const data = await response.json()

            if (response.ok) {
                onSuccess()
            } else {
                setError(data.error || "Erreur lors de l'enregistrement de la cachette")
                if (data.distance) {
                    setError(`${data.error} (Distance: ${data.distance}m)`)
                }
            }
        } catch (error) {
            console.error("Error submitting hiding spot:", error)
            setError("Erreur lors de l'enregistrement de la cachette")
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <MapPin className="text-blue-600" size={24} />
                    Enregistrer la cachette
                </CardTitle>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* GPS Status */}
                    <div className={`p-4 rounded-lg ${latitude && longitude
                            ? "bg-green-50 border border-green-200"
                            : "bg-orange-50 border border-orange-200"
                        }`}>
                        <div className="flex items-center gap-2">
                            {latitude && longitude ? (
                                <>
                                    <CheckCircle2 className="text-green-600" size={20} />
                                    <div>
                                        <p className="font-medium text-green-900">Position GPS obtenue</p>
                                        <p className="text-sm text-green-700">
                                            Lat: {latitude.toFixed(6)}, Lon: {longitude.toFixed(6)}
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <AlertCircle className="text-orange-600" size={20} />
                                    <div>
                                        <p className="font-medium text-orange-900">
                                            {gpsError || "Obtention de la position GPS..."}
                                        </p>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Photo Upload */}
                    <div className="space-y-2">
                        <Label htmlFor="photo">Photo de la cachette *</Label>
                        <div className="flex flex-col gap-4">
                            <Input
                                id="photo"
                                type="file"
                                accept="image/*"
                                capture="environment"
                                onChange={handlePhotoChange}
                                required
                            />
                            {photoPreview && (
                                <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-300">
                                    <img
                                        src={photoPreview}
                                        alt="Aperçu de la cachette"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description">
                            Description de la cachette (optionnel)
                        </Label>
                        <Input
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="ex: Derrière le buisson à gauche de l'entrée"
                        />
                    </div>

                    {/* Info Box */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            <strong>Adresse de livraison:</strong> {deliveryAddress}
                        </p>
                        <p className="text-sm text-blue-700 mt-2">
                            La cachette doit être à maximum 200 mètres de cette adresse.
                        </p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                            <p className="text-sm text-red-900">{error}</p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={submitting || !latitude || !longitude || !photoBase64}
                            className="flex-1"
                        >
                            {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            <Camera className="mr-2" size={18} />
                            Enregistrer la cachette
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
