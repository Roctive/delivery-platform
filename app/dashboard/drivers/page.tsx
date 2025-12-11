"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Plus,
    Search,
    Phone,
    Truck,
    CheckCircle2,
    MoreHorizontal
} from "lucide-react"
import { User, DriverProfile } from "@prisma/client"

type DriverWithProfile = User & {
    driverProfile: DriverProfile | null
    assignedDeliveries: unknown[]
}

export default function DriversPage() {
    const [drivers, setDrivers] = useState<DriverWithProfile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [showNewDriverModal, setShowNewDriverModal] = useState(false)

    useEffect(() => {
        fetchDrivers()
    }, [])

    async function fetchDrivers() {
        try {
            const response = await fetch("/api/drivers")
            if (response.ok) {
                const data = await response.json()
                setDrivers(data)
            }
        } catch (error) {
            console.error("Error fetching drivers:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredDrivers = drivers.filter(driver =>
        driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        driver.email.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Livreurs
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Gérez votre flotte de livreurs
                    </p>
                </div>
                <Button onClick={() => setShowNewDriverModal(true)}>
                    <Plus size={20} className="mr-2" />
                    Nouveau livreur
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <Input
                            placeholder="Rechercher un livreur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Drivers Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12">Chargement...</div>
                ) : filteredDrivers.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Aucun livreur trouvé
                    </div>
                ) : (
                    filteredDrivers.map((driver) => (
                        <Card key={driver.id} className="overflow-hidden">
                            <div className={`h-2 w-full ${driver.driverProfile?.isAvailable ? 'bg-green-500' : 'bg-slate-300'}`} />
                            <CardContent className="pt-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-xl">
                                            🚗
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg">{driver.name}</h3>
                                            <p className="text-xs text-slate-500">{driver.email}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal size={20} />
                                    </Button>
                                </div>

                                <div className="space-y-3">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Phone size={14} /> Téléphone
                                        </span>
                                        <span className="font-medium">{driver.driverProfile?.phone || "-"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <Truck size={14} /> Véhicule
                                        </span>
                                        <span className="font-medium">{driver.driverProfile?.vehicle || "-"}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-500 flex items-center gap-2">
                                            <CheckCircle2 size={14} /> Livraisons
                                        </span>
                                        <span className="font-medium">{driver.driverProfile?.totalDeliveries || 0}</span>
                                    </div>

                                    <div className="pt-4 mt-4 border-t flex items-center justify-between">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${driver.driverProfile?.isAvailable
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-slate-100 text-slate-800'
                                            }`}>
                                            {driver.driverProfile?.isAvailable ? 'Disponible' : 'Indisponible'}
                                        </span>
                                        {driver.assignedDeliveries.length > 0 && (
                                            <span className="text-xs text-blue-600 font-medium">
                                                {driver.assignedDeliveries.length} en cours
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* New Driver Modal (Simplified) */}
            {showNewDriverModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md">
                        <CardHeader>
                            <CardTitle>Ajouter un livreur</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                // Implementation would go here
                                setShowNewDriverModal(false)
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom complet</Label>
                                    <Input required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Email</Label>
                                    <Input type="email" required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Mot de passe</Label>
                                    <Input type="password" required />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setShowNewDriverModal(false)}>
                                        Annuler
                                    </Button>
                                    <Button type="submit">Créer</Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
