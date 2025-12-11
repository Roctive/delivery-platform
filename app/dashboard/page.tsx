"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
    Package,
    Truck,
    Clock,
    CheckCircle2,
    Plus,
    AlertTriangle,
    MapPin
} from "lucide-react"
import { Delivery, User as UserType, Client } from "@prisma/client"
import dynamic from 'next/dynamic'

// Dynamically import Map component to avoid SSR issues with Leaflet
const DashboardMap = dynamic(() => import('@/components/dashboard/dashboard-map'), {
    ssr: false,
    loading: () => <div className="h-[500px] w-full bg-slate-100 animate-pulse rounded-lg flex items-center justify-center">Chargement de la carte...</div>
})

type DeliveryWithRelations = Delivery & {
    driver: UserType | null
    client: Client | null
}

export default function DashboardPage() {
    const { data: session } = useSession()
    const isAdmin = session?.user?.role === "ADMIN"

    if (isAdmin) {
        return <AdminDashboard />
    }

    return <DriverDashboard />
}

function AdminDashboard() {
    const [deliveries, setDeliveries] = useState<DeliveryWithRelations[]>([])
    const [loading, setLoading] = useState(true)

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

    // Calculate stats from real data
    const activeDeliveries = deliveries.filter(d =>
        d.status !== 'DELIVERED' && d.status !== 'CANCELLED'
    ).length

    const stats = {
        activeDeliveries,
        availableDrivers: 3, // TODO: Fetch from API
        avgDeliveryTime: 22, // TODO: Calculate from data
        successRate: 98 // TODO: Calculate from data
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Tableau de bord
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Vue d&apos;ensemble de vos livraisons en temps réel
                    </p>
                </div>
                <Link href="/dashboard/deliveries/new">
                    <Button size="lg">
                        <Plus size={20} className="mr-2" />
                        Nouvelle livraison
                    </Button>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Livraisons en cours
                        </CardTitle>
                        <Package className="text-blue-600" size={20} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.activeDeliveries}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">En temps réel</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Livreurs disponibles
                        </CardTitle>
                        <Truck className="text-green-600" size={20} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.availableDrivers}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Prêts à livrer</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Temps moyen
                        </CardTitle>
                        <Clock className="text-orange-600" size={20} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.avgDeliveryTime} min
                        </div>
                        <p className="text-xs text-green-600 mt-1">↓ -3 min vs hier</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">
                            Taux de réussite
                        </CardTitle>
                        <CheckCircle2 className="text-emerald-600" size={20} />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">
                            {stats.successRate}%
                        </div>
                        <p className="text-xs text-slate-500 mt-1">Ce mois-ci</p>
                    </CardContent>
                </Card>
            </div>

            {/* Map of Active Deliveries */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <MapPin className="text-blue-600" size={24} />
                            Carte des livraisons en cours
                        </CardTitle>
                        <span className="text-sm text-slate-500">
                            {activeDeliveries} livraison{activeDeliveries > 1 ? 's' : ''} active{activeDeliveries > 1 ? 's' : ''}
                        </span>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="h-[500px] flex items-center justify-center text-slate-500">
                            Chargement de la carte...
                        </div>
                    ) : deliveries.length === 0 ? (
                        <div className="h-[500px] flex items-center justify-center text-slate-500">
                            Aucune livraison à afficher
                        </div>
                    ) : (
                        <DashboardMap deliveries={deliveries} />
                    )}
                </CardContent>
            </Card>

            {/* Urgent Deliveries */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <AlertTriangle className="text-orange-500" size={24} />
                            Livraisons urgentes
                        </CardTitle>
                        <Link href="/dashboard/deliveries">
                            <Button variant="ghost" size="sm">Voir tout</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-500">
                        Aucune livraison urgente pour le moment
                    </div>
                </CardContent>
            </Card>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link href="/dashboard/deliveries">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <CardContent className="pt-6 text-center">
                            <Package className="mx-auto text-blue-600 mb-3" size={32} />
                            <h3 className="font-semibold text-lg mb-2">Gérer les livraisons</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Voir, créer et assigner des livraisons
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/drivers">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <CardContent className="pt-6 text-center">
                            <Truck className="mx-auto text-green-600 mb-3" size={32} />
                            <h3 className="font-semibold text-lg mb-2">Gérer les livreurs</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Disponibilités et statistiques
                            </p>
                        </CardContent>
                    </Card>
                </Link>

                <Link href="/dashboard/clients">
                    <Card className="hover:shadow-lg transition-all cursor-pointer border-2 border-transparent hover:border-blue-200 dark:hover:border-blue-800">
                        <CardContent className="pt-6 text-center">
                            <CheckCircle2 className="mx-auto text-purple-600 mb-3" size={32} />
                            <h3 className="font-semibold text-lg mb-2">Gérer les clients</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Voir et ajouter des clients
                            </p>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}

function DriverDashboard() {
    const { data: session } = useSession()
    const [inventory, setInventory] = useState<any[]>([])
    const [loadingInventory, setLoadingInventory] = useState(true)

    useEffect(() => {
        if (session?.user?.id) {
            fetchInventory()
        }
    }, [session])

    async function fetchInventory() {
        try {
            const response = await fetch(`/api/drivers/${session?.user?.id}/inventory`)
            if (response.ok) {
                const data = await response.json()
                setInventory(data)
            }
        } catch (error) {
            console.error("Error fetching inventory:", error)
        } finally {
            setLoadingInventory(false)
        }
    }

    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    Mes missions
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Vos livraisons assignées aujourd&apos;hui
                </p>
            </div>

            {/* Availability Toggle */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-lg mb-1">Disponibilité</h3>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Activez pour recevoir de nouvelles missions
                            </p>
                        </div>
                        <Button size="lg" className="bg-green-600 hover:bg-green-700">
                            🟢 Disponible
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Inventory Summary */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                            <Package className="text-blue-600" size={24} />
                            Mon inventaire
                        </CardTitle>
                        <Link href="/dashboard/inventory">
                            <Button variant="ghost" size="sm">Voir détails</Button>
                        </Link>
                    </div>
                </CardHeader>
                <CardContent>
                    {loadingInventory ? (
                        <div className="text-center py-6 text-slate-500">
                            Chargement...
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="text-center py-6 text-slate-500">
                            Aucun produit en stock. Ravitaillez-vous pour commencer.
                        </div>
                    ) : (
                        <div>
                            <div className="mb-4">
                                <p className="text-sm text-slate-600 dark:text-slate-400">
                                    Total d&apos;articles
                                </p>
                                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                                    {totalItems}
                                </p>
                            </div>
                            <div className="space-y-2">
                                {inventory.slice(0, 5).map((item) => (
                                    <div key={item.id} className="flex justify-between items-center text-sm">
                                        <span className="text-slate-700 dark:text-slate-300">
                                            {item.product.name}
                                        </span>
                                        <span className={`font-semibold ${item.quantity === 0
                                                ? "text-red-600"
                                                : item.quantity < 5
                                                    ? "text-orange-600"
                                                    : "text-green-600"
                                            }`}>
                                            {item.quantity} {item.product.unit}
                                        </span>
                                    </div>
                                ))}
                                {inventory.length > 5 && (
                                    <p className="text-xs text-slate-500 mt-2">
                                        +{inventory.length - 5} autres produits
                                    </p>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Active Missions */}
            <Card>
                <CardHeader>
                    <CardTitle>Missions en cours</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-slate-500">
                        Aucune mission assignée pour le moment
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
