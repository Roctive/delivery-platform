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
    MoreHorizontal
} from "lucide-react"
import { Client } from "@prisma/client"

export default function ClientsPage() {
    const [clients, setClients] = useState<Client[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState("")
    const [showNewClientModal, setShowNewClientModal] = useState(false)

    useEffect(() => {
        fetchClients()
    }, [])

    async function fetchClients() {
        try {
            const response = await fetch("/api/clients")
            if (response.ok) {
                const data = await response.json()
                setClients(data)
            }
        } catch (error) {
            console.error("Error fetching clients:", error)
        } finally {
            setLoading(false)
        }
    }

    const filteredClients = clients.filter(client =>
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (client.company && client.company.toLowerCase().includes(searchTerm.toLowerCase()))
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Clients
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Gérez votre base de clients
                    </p>
                </div>
                <Button onClick={() => setShowNewClientModal(true)}>
                    <Plus size={20} className="mr-2" />
                    Nouveau client
                </Button>
            </div>

            {/* Search */}
            <Card>
                <CardContent className="pt-6">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <Input
                            placeholder="Rechercher un client..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Clients List */}
            <div className="grid gap-4">
                {loading ? (
                    <div className="text-center py-12">Chargement...</div>
                ) : filteredClients.length === 0 ? (
                    <Card>
                        <CardContent className="text-center py-12 text-slate-500">
                            Aucun client trouvé
                        </CardContent>
                    </Card>
                ) : (
                    filteredClients.map((client) => (
                        <Card key={client.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-6">
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center text-xl font-bold">
                                            {client.name.charAt(0)}
                                        </div>
                                        <div>
                                            <h3 className="font-semibold text-lg flex items-center gap-2">
                                                {client.name}
                                                {client.company && (
                                                    <span className="text-xs font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                                                        {client.company}
                                                    </span>
                                                )}
                                            </h3>
                                            <div className="flex items-center gap-4 mt-1 text-sm text-slate-500">
                                                <span className="flex items-center gap-1">
                                                    <Phone size={14} /> {client.phone}
                                                </span>
                                            </div>
                                        </div>
                                    </div>


                                    {client.instructions && (
                                        <div className="flex-1 text-sm">
                                            <p className="text-xs font-medium text-slate-500 uppercase mb-1">Instructions</p>
                                            <p className="truncate">{client.instructions}</p>
                                        </div>
                                    )}


                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal size={20} />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>

            {/* New Client Modal (Simplified) */}
            {showNewClientModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
                        <CardHeader>
                            <CardTitle>Ajouter un client</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={async (e) => {
                                e.preventDefault()
                                // Implementation would go here
                                setShowNewClientModal(false)
                            }} className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Nom du contact *</Label>
                                    <Input required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Entreprise</Label>
                                    <Input />
                                </div>
                                <div className="space-y-2">
                                    <Label>Téléphone *</Label>
                                    <Input required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Adresse de récupération</Label>
                                    <Input required />
                                </div>
                                <div className="space-y-2">
                                    <Label>Adresse de livraison</Label>
                                    <Input required />
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <Button type="button" variant="ghost" onClick={() => setShowNewClientModal(false)}>
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
