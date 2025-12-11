"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Package, Plus, Loader2 } from "lucide-react"
import { Product } from "@prisma/client"

interface InventoryItem {
    id: string
    quantity: number
    product: Product
}

export default function DriverInventoryPage() {
    const { data: session } = useSession()
    const [inventory, setInventory] = useState<InventoryItem[]>([])
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [showAddForm, setShowAddForm] = useState(false)
    const [selectedProductId, setSelectedProductId] = useState("")
    const [quantity, setQuantity] = useState("")
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (session?.user?.id) {
            fetchInventory()
            fetchProducts()
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
            setLoading(false)
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

    async function handleAddStock(e: React.FormEvent) {
        e.preventDefault()
        if (!selectedProductId || !quantity) return

        setSubmitting(true)
        try {
            const response = await fetch(`/api/drivers/${session?.user?.id}/inventory`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    productId: selectedProductId,
                    quantity: parseInt(quantity)
                })
            })

            if (response.ok) {
                await fetchInventory()
                setShowAddForm(false)
                setSelectedProductId("")
                setQuantity("")
            }
        } catch (error) {
            console.error("Error adding stock:", error)
        } finally {
            setSubmitting(false)
        }
    }

    const totalItems = inventory.reduce((sum, item) => sum + item.quantity, 0)

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Mon inventaire
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Stock disponible dans votre véhicule
                    </p>
                </div>
                <Button onClick={() => setShowAddForm(!showAddForm)} size="lg">
                    <Plus size={20} className="mr-2" />
                    Ravitaillement
                </Button>
            </div>

            {/* Summary Card */}
            <Card>
                <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                        <Package className="text-blue-600" size={32} />
                        <div>
                            <p className="text-sm text-slate-600 dark:text-slate-400">
                                Total d'articles en stock
                            </p>
                            <p className="text-3xl font-bold text-slate-900 dark:text-white">
                                {totalItems}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Add Stock Form */}
            {showAddForm && (
                <Card>
                    <CardHeader>
                        <CardTitle>Ajouter du stock</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleAddStock} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="product">Produit</Label>
                                    <select
                                        id="product"
                                        value={selectedProductId}
                                        onChange={(e) => setSelectedProductId(e.target.value)}
                                        required
                                        className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                    >
                                        <option value="">Sélectionner un produit</option>
                                        {products.map((product) => (
                                            <option key={product.id} value={product.id}>
                                                {product.name} ({product.unit})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="quantity">Quantité</Label>
                                    <Input
                                        id="quantity"
                                        type="number"
                                        min="1"
                                        value={quantity}
                                        onChange={(e) => setQuantity(e.target.value)}
                                        required
                                        placeholder="ex: 10"
                                    />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button type="submit" disabled={submitting}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ajouter
                                </Button>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    onClick={() => setShowAddForm(false)}
                                >
                                    Annuler
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Inventory Table */}
            <Card>
                <CardHeader>
                    <CardTitle>Stock détaillé</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-12 text-slate-500">
                            Chargement...
                        </div>
                    ) : inventory.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            Aucun produit en stock. Cliquez sur "Ravitaillement" pour ajouter du stock.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-slate-200 dark:border-slate-700">
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            Produit
                                        </th>
                                        <th className="text-left py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            Catégorie
                                        </th>
                                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            Quantité
                                        </th>
                                        <th className="text-right py-3 px-4 font-semibold text-slate-700 dark:text-slate-300">
                                            Unité
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {inventory.map((item) => (
                                        <tr
                                            key={item.id}
                                            className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                        >
                                            <td className="py-3 px-4 font-medium">
                                                {item.product.name}
                                            </td>
                                            <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                                                {item.product.category || "-"}
                                            </td>
                                            <td className="py-3 px-4 text-right">
                                                <span className={`font-semibold ${item.quantity === 0
                                                        ? "text-red-600"
                                                        : item.quantity < 5
                                                            ? "text-orange-600"
                                                            : "text-green-600"
                                                    }`}>
                                                    {item.quantity}
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-right text-slate-600 dark:text-slate-400">
                                                {item.product.unit}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
