"use client"

import { useState, useEffect } from "react"
import { use } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { MapPin, Package, CheckCircle2, Clock } from "lucide-react"
import dynamic from "next/dynamic"

const HidingSpotMap = dynamic(() => import("@/components/delivery/hiding-spot-map"), {
    ssr: false,
    loading: () => <div className="h-64 bg-slate-100 animate-pulse rounded-lg" />
})

interface DeliveryReport {
    id: string
    status: string
    clientName: string
    deliveryAddress: string
    items: Array<{
        product: string
        quantity: number
        unit: string
    }>
    createdAt: string
    hidingSpot: {
        photoUrl: string
        latitude: number
        longitude: number
        description: string | null
        distance: number
    } | null
    driver: {
        name: string
    } | null
}

export default function TrackingPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [report, setReport] = useState<DeliveryReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string>("")

    useEffect(() => {
        fetchReport()
    }, [id])

    async function fetchReport() {
        try {
            const response = await fetch(`/api/deliveries/${id}/report`)
            if (response.ok) {
                const data = await response.json()
                setReport(data)
            } else {
                setError("Livraison non trouvée")
            }
        } catch (error) {
            console.error("Error fetching report:", error)
            setError("Erreur lors du chargement")
        } finally {
            setLoading(false)
        }
    }

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            PENDING: "En attente",
            ASSIGNED: "Assignée",
            IN_TRANSIT: "En cours de livraison",
            HIDDEN: "Colis caché - Prêt à récupérer",
            DELIVERED: "Livré",
            CANCELLED: "Annulée"
        }
        return labels[status] || status
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            PENDING: "bg-yellow-100 text-yellow-800",
            ASSIGNED: "bg-blue-100 text-blue-800",
            IN_TRANSIT: "bg-purple-100 text-purple-800",
            HIDDEN: "bg-green-100 text-green-800",
            DELIVERED: "bg-emerald-100 text-emerald-800",
            CANCELLED: "bg-red-100 text-red-800"
        }
        return colors[status] || "bg-slate-100 text-slate-800"
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-slate-600">Chargement...</p>
                </div>
            </div>
        )
    }

    if (error || !report) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Card className="max-w-md">
                    <CardContent className="pt-6 text-center">
                        <p className="text-red-600 font-semibold">{error || "Livraison non trouvée"}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-50 py-8 px-4">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">
                        Suivi de livraison
                    </h1>
                    <p className="text-slate-600">
                        Commande #{report.id.slice(0, 8)}
                    </p>
                </div>

                {/* Status */}
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-center">
                            <span className={`inline-block px-4 py-2 rounded-full font-semibold ${getStatusColor(report.status)}`}>
                                {getStatusLabel(report.status)}
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Delivery Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Package className="text-blue-600" size={24} />
                            Informations de livraison
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-slate-600">Client</p>
                            <p className="font-semibold text-slate-900">{report.clientName}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600">Adresse de livraison</p>
                            <p className="font-semibold text-slate-900">{report.deliveryAddress}</p>
                        </div>
                        <div>
                            <p className="text-sm text-slate-600 mb-2">Produits commandés</p>
                            <div className="space-y-1">
                                {report.items.map((item, index) => (
                                    <div key={index} className="flex justify-between text-sm">
                                        <span>{item.product}</span>
                                        <span className="font-semibold">
                                            {item.quantity} {item.unit}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        {report.driver && (
                            <div>
                                <p className="text-sm text-slate-600">Livreur</p>
                                <p className="font-semibold text-slate-900">{report.driver.name}</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Hiding Spot Info */}
                {report.hidingSpot && (
                    <>
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="text-green-600" size={24} />
                                    Emplacement de votre colis
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <p className="text-green-900 font-semibold mb-2">
                                        ✓ Votre colis a été caché en toute sécurité
                                    </p>
                                    <p className="text-sm text-green-700">
                                        Distance de l&apos;adresse: {Math.round(report.hidingSpot.distance)}m
                                    </p>
                                </div>

                                {/* Photo */}
                                <div>
                                    <p className="text-sm text-slate-600 mb-2">Photo de la cachette</p>
                                    <div className="relative w-full h-64 rounded-lg overflow-hidden border border-slate-300">
                                        <img
                                            src={report.hidingSpot.photoUrl}
                                            alt="Cachette du colis"
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>

                                {/* Description */}
                                {report.hidingSpot.description && (
                                    <div>
                                        <p className="text-sm text-slate-600">Instructions</p>
                                        <p className="font-medium text-slate-900">
                                            {report.hidingSpot.description}
                                        </p>
                                    </div>
                                )}

                                {/* GPS Coordinates */}
                                <div>
                                    <p className="text-sm text-slate-600 mb-2">Coordonnées GPS</p>
                                    <p className="text-sm font-mono bg-slate-100 p-2 rounded">
                                        {report.hidingSpot.latitude.toFixed(6)}, {report.hidingSpot.longitude.toFixed(6)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Map */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Carte de localisation</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <HidingSpotMap
                                    latitude={report.hidingSpot.latitude}
                                    longitude={report.hidingSpot.longitude}
                                    photoUrl={report.hidingSpot.photoUrl}
                                />
                            </CardContent>
                        </Card>
                    </>
                )}
            </div>
        </div>
    )
}
