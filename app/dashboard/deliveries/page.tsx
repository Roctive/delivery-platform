"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { StatusBadge } from "@/components/status-badge"
import { TimeRemaining } from "@/components/time-remaining"
import {
    Plus,
    Search,
    Clock,
    MapPin,
    User,
    ArrowRight
} from "lucide-react"
import { Delivery, User as UserType, Client } from "@prisma/client"

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

export default function DeliveriesPage() {
    const [deliveries, setDeliveries] = useState<DeliveryWithRelations[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        fetchDeliveries()
    }, [])

    async function fetchDeliveries() {
        try {
            const response = await fetch("/api/deliveries")
            if (response.ok) {
                const data = await response.json()
                setDeliveries(data)
            }
        } catch (error) {
            console.error("Error fetching deliveries:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredDeliveries = deliveries.filter(delivery => {
        const itemsText = delivery.items?.map(item => item.product.name).join(' ') || ''
        return delivery.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            delivery.deliveryAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
            itemsText.toLowerCase().includes(searchTerm.toLowerCase())
    })

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Livraisons
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Gérez toutes vos livraisons
                    </p>
                </div>
                <Link href="/dashboard/deliveries/new">
                    <Button size="lg">
                        <Plus size={20} className="mr-2" />
                        Nouvelle livraison
                    </Button>
                </Link>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <Input
                            placeholder="Rechercher une livraison..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Deliveries List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12">Chargement...</div>
                ) : filteredDeliveries.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12 text-slate-500">
                            Aucune livraison trouvée
                        </CardContent>
                    </Card>
                ) : (
                    filteredDeliveries.map((delivery) => (
                        <Link key={delivery.id} href={`/dashboard/deliveries/${delivery.id}`}>
                            <Card className="hover:shadow-md transition-shadow cursor-pointer">
                                <CardContent className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6 items-start lg:items-center justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <h3 className="font-semibold text-lg flex items-center gap-2">
                                                        {delivery.clientName}
                                                        <StatusBadge status={delivery.status} />
                                                    </h3>
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                                        {delivery.items && delivery.items.length > 0
                                                            ? delivery.items.map(item => `${item.product.name} x${item.quantity}`).join(', ')
                                                            : 'Aucun produit'}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="grid md:grid-cols-2 gap-4 text-sm">
                                                {delivery.pickupAddress && (
                                                    <div className="flex items-start gap-2">
                                                        <MapPin size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
                                                        <div>
                                                            <p className="font-medium text-slate-700 dark:text-slate-300">Récupération</p>
                                                            <p className="text-slate-600 dark:text-slate-400">{delivery.pickupAddress}</p>
                                                        </div>
                                                    </div>
                                                )}
                                                <div className="flex items-start gap-2">
                                                    <MapPin size={16} className="text-green-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <p className="font-medium text-slate-700 dark:text-slate-300">Livraison</p>
                                                        <p className="text-slate-600 dark:text-slate-400">{delivery.deliveryAddress}</p>
                                                    </div>
                                                </div>
                                            </div>

                                            {delivery.driver && (
                                                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                                                    <User size={16} />
                                                    <span>Livreur: {delivery.driver.name}</span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex flex-col items-end gap-3">
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock size={16} className="text-slate-400" />
                                                <TimeRemaining maxDeliveryTime={delivery.maxDeliveryTime} />
                                            </div>
                                            <ArrowRight size={20} className="text-slate-400" />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
