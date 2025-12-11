"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2, Plus, Trash2 } from "lucide-react"
import Link from "next/link"
import { Client, Product, User } from "@prisma/client"

interface DeliveryItem {
    productId: string
    quantity: number
}

export default function NewDeliveryPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [clients, setClients] = useState<Client[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [drivers, setDrivers] = useState<User[]>([])
    const [selectedClientId, setSelectedClientId] = useState<string>("")
    const [selectedDriverId, setSelectedDriverId] = useState<string>("")
    const [items, setItems] = useState<DeliveryItem[]>([{ productId: "", quantity: 1 }])

    useEffect(() => {
        fetchClients()
        fetchProducts()
        fetchDrivers()
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
        }
    }

    async function fetchProducts() {
        try {
            const response = await fetch("/api/products?activeOnly=true")
            if (response.ok) {
                const data = await response.json()
                setProducts(data)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
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

    function addItem() {
        setItems([...items, { productId: "", quantity: 1 }])
    }

    function removeItem(index: number) {
        setItems(items.filter((_, i) => i !== index))
    }

    function updateItem(index: number, field: keyof DeliveryItem, value: string | number) {
        const newItems = [...items]
        newItems[index] = { ...newItems[index], [field]: value }
        setItems(newItems)
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)

        // Validate items
        const validItems = items.filter(item => item.productId && item.quantity > 0)
        if (validItems.length === 0) {
            alert("Veuillez ajouter au moins un produit")
            setLoading(false)
            return
        }

        const data = {
            clientId: selectedClientId || null,
            clientName: formData.get("clientName"),
            clientPhone: formData.get("clientPhone"),
            deliveryAddress: formData.get("deliveryAddress"),
            items: validItems,
            instructions: formData.get("instructions"),
            priority: formData.get("priority"),
            driverId: selectedDriverId || null
        }

        try {
            const response = await fetch("/api/deliveries", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(data),
            })

            if (response.ok) {
                router.push("/dashboard/deliveries")
                router.refresh()
            } else {
                const error = await response.json()
                alert(error.error || "Erreur lors de la création de la livraison")
            }
        } catch (error) {
            console.error("Error creating delivery:", error)
            alert("Erreur lors de la création de la livraison")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/deliveries">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={20} className="mr-2" />
                        Retour
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Nouvelle livraison
                </h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Selection */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Client</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientSelect">Client existant (optionnel)</Label>
                                    <select
                                        id="clientSelect"
                                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                        onChange={(e) => setSelectedClientId(e.target.value)}
                                        value={selectedClientId}
                                    >
                                        <option value="">Nouveau client / Non enregistré</option>
                                        {clients.map(client => (
                                            <option key={client.id} value={client.id}>
                                                {client.name} {client.company ? `(${client.company})` : ''}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="clientName">Nom du contact *</Label>
                                    <Input id="clientName" name="clientName" required placeholder="ex: Jean Dupont" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="clientPhone">Téléphone *</Label>
                                    <Input id="clientPhone" name="clientPhone" required placeholder="ex: 06 12 34 56 78" />
                                </div>
                            </div>
                        </div>

                        {/* Delivery Address */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Adresse de livraison</h3>
                            <div className="space-y-2">
                                <Label htmlFor="deliveryAddress">Adresse *</Label>
                                <Input id="deliveryAddress" name="deliveryAddress" required placeholder="ex: 12 Rue Alsace Lorraine, 31000 Toulouse" />
                            </div>
                        </div>

                        {/* Products */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b pb-2">
                                <h3 className="text-lg font-semibold">Produits à livrer</h3>
                                <Button type="button" size="sm" onClick={addItem}>
                                    <Plus size={16} className="mr-1" />
                                    Ajouter
                                </Button>
                            </div>

                            {items.map((item, index) => (
                                <div key={index} className="flex gap-2 items-end">
                                    <div className="flex-1 space-y-2">
                                        <Label>Produit *</Label>
                                        <select
                                            value={item.productId}
                                            onChange={(e) => updateItem(index, "productId", e.target.value)}
                                            required
                                            className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                        >
                                            <option value="">Sélectionner un produit</option>
                                            {products.map(product => (
                                                <option key={product.id} value={product.id}>
                                                    {product.name} ({product.unit})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="w-32 space-y-2">
                                        <Label>Quantité *</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            value={item.quantity}
                                            onChange={(e) => updateItem(index, "quantity", parseInt(e.target.value))}
                                            required
                                        />
                                    </div>
                                    {items.length > 1 && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeItem(index)}
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Driver Assignment */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Assignation (optionnel)</h3>
                            <div className="space-y-2">
                                <Label htmlFor="driverSelect">Livreur</Label>
                                <select
                                    id="driverSelect"
                                    value={selectedDriverId}
                                    onChange={(e) => setSelectedDriverId(e.target.value)}
                                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <option value="">Non assigné</option>
                                    {drivers.map(driver => (
                                        <option key={driver.id} value={driver.id}>
                                            {driver.name}
                                        </option>
                                    ))}
                                </select>
                                <p className="text-xs text-slate-500">
                                    Si un livreur est assigné, son inventaire sera vérifié
                                </p>
                            </div>
                        </div>

                        {/* Details */}
                        <div className="space-y-4">
                            <h3 className="text-lg font-semibold border-b pb-2">Détails</h3>

                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="priority">Priorité</Label>
                                    <select
                                        id="priority"
                                        name="priority"
                                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <option value="NORMAL">Normale</option>
                                        <option value="URGENT">Urgente</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="instructions">Instructions particulières</Label>
                                <Input id="instructions" name="instructions" placeholder="ex: Appeler avant d'arriver..." />
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <Link href="/dashboard/deliveries">
                                <Button type="button" variant="ghost">Annuler</Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer la livraison
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
