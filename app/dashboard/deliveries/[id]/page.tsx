"use client"

import { useState, useEffect, use } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { StatusBadge } from "@/components/status-badge"
import { ArrowLeft, MapPin, Phone, User, Clock, Truck, CheckCircle2 } from "lucide-react"
import { Delivery, User as UserType, Client } from "@prisma/client"
import dynamic from 'next/dynamic'

// Dynamically import Map component to avoid SSR issues with Leaflet
const DeliveryMap = dynamic(() => import('@/components/delivery/delivery-map'), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">Chargement de la carte...</div>
})

type DeliveryWithRelations = Delivery & {
    driver: UserType | null
    client: Client | null
    items: Array<{
        id: string
        quantity: number
        product: {
            id: string
            name: string
            unit: string
        }
    }>
}

export default function DeliveryDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter()
    const { id } = use(params)
    const [delivery, setDelivery] = useState<DeliveryWithRelations | null>(null)
    const [drivers, setDrivers] = useState<UserType[]>([])
    const [loading, setLoading] = useState(true)
    const [assigning, setAssigning] = useState(false)

    useEffect(() => {
        fetchDelivery(id)
        fetchDrivers()
    }, [id])

    async function fetchDelivery(deliveryId: string) {
        try {
            const response = await fetch(`/api/deliveries/${deliveryId}`)
            if (response.ok) {
                const data = await response.json()
                setDelivery(data)
            }
        } catch (error) {
            console.error("Error fetching delivery:", error)
        } finally {
            setLoading(false)
        }
    }

    async function fetchDrivers() {
        try {
            const response = await fetch("/api/drivers")
            if (response.ok) {
                const data = await response.json()
                setDrivers(data)
            }
        } catch (error) {
            console.error("Error fetching drivers:", error)
        }
    }

    async function handleAssign(driverId: string) {
        if (!delivery) return
        setAssigning(true)
        try {
            const response = await fetch(`/api/deliveries/${delivery.id}/assign`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ driverId })
            })

            if (response.ok) {
                fetchDelivery(delivery.id)
            }
        } catch (error) {
            console.error("Error assigning driver:", error)
        } finally {
            setAssigning(false)
        }
    }

    if (loading) return <div className="p-8 text-center">Chargement...</div>
    if (!delivery) return <div className="p-8 text-center">Livraison non trouvée</div>

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/deliveries">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={20} className="mr-2" />
                        Retour
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                        Livraison #{delivery.id.slice(-6)}
                        <StatusBadge status={delivery.status} />
                    </h1>
                </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
                {/* Main Info */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Map */}
                    <Card>
                        <CardContent className="p-0 overflow-hidden rounded-xl">
                            <DeliveryMap
                                pickup={delivery.pickupAddress}
                                delivery={delivery.deliveryAddress}
                            />
                        </CardContent>
                    </Card>

                    {/* Details */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Détails de la mission</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    {delivery.pickupAddress && (
                                        <div className="flex gap-3">
                                            <div className="mt-1">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                                    <MapPin size={16} />
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-xs font-medium text-slate-500 uppercase">Récupération</p>
                                                <p className="font-medium">{delivery.pickupAddress}</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <div className="mt-1">
                                            <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                                <MapPin size={16} />
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase">Livraison</p>
                                            <p className="font-medium">{delivery.deliveryAddress}</p>
                                            <p className="text-sm text-slate-500 mt-1">{delivery.clientName}</p>
                                            <a href={`tel:${delivery.clientPhone}`} className="text-sm text-blue-600 hover:underline flex items-center gap-1 mt-1">
                                                <Phone size={12} /> {delivery.clientPhone}
                                            </a>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase">Produits</p>
                                        <div className="space-y-1 mt-2">
                                            {delivery.items && delivery.items.length > 0 ? (
                                                delivery.items.map((item) => (
                                                    <div key={item.id} className="flex items-center justify-between text-sm bg-slate-50 dark:bg-slate-800 px-3 py-2 rounded">
                                                        <span className="font-medium">{item.product.name}</span>
                                                        <span className="text-slate-600 dark:text-slate-400">x{item.quantity} {item.product.unit}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <p className="text-sm text-slate-500">Aucun produit</p>
                                            )}
                                        </div>
                                    </div>
                                    {delivery.instructions && (
                                        <div>
                                            <p className="text-xs font-medium text-slate-500 uppercase">Instructions</p>
                                            <p className="text-sm bg-yellow-50 text-yellow-800 p-2 rounded border border-yellow-200">
                                                {delivery.instructions}
                                            </p>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 uppercase">Timing</p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <Clock size={16} className="text-slate-400" />
                                            <span className="text-sm">Créée à {new Date(delivery.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Sidebar Actions */}
                <div className="space-y-6">
                    {/* Driver Assignment */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Truck size={20} />
                                Livreur
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {delivery.driver ? (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center">
                                            <User size={20} />
                                        </div>
                                        <div>
                                            <p className="font-medium">{delivery.driver.name}</p>
                                            <p className="text-xs text-slate-500">{delivery.driver.email}</p>
                                        </div>
                                    </div>
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={() => handleAssign("")} // Unassign
                                    >
                                        Changer de livreur
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <p className="text-sm text-slate-500">Aucun livreur assigné</p>
                                    <div className="space-y-2">
                                        <p className="text-xs font-medium text-slate-900">Assigner à :</p>
                                        {drivers.map(driver => (
                                            <button
                                                key={driver.id}
                                                onClick={() => handleAssign(driver.id)}
                                                disabled={assigning}
                                                className="w-full flex items-center justify-between p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-200 text-sm transition-colors"
                                            >
                                                <span>{driver.name}</span>
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">Dispo</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Timeline (Placeholder) */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Historique</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4 relative before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                <div className="relative pl-6">
                                    <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                                    <p className="text-sm font-medium">Livraison créée</p>
                                    <p className="text-xs text-slate-500">{new Date(delivery.createdAt).toLocaleTimeString()}</p>
                                </div>
                                {delivery.status !== 'PENDING' && (
                                    <div className="relative pl-6">
                                        <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-sm"></div>
                                        <p className="text-sm font-medium">Assignée à {delivery.driver?.name}</p>
                                        <p className="text-xs text-slate-500">--</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
