"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Plus, Package, Edit, Trash2 } from "lucide-react"
import { Product } from "@prisma/client"

export default function ProductsPage() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState<"all" | "active" | "inactive">("active")

    useEffect(() => {
        fetchProducts()
    }, [filter])

    async function fetchProducts() {
        try {
            const activeOnly = filter === "active"
            const response = await fetch(`/api/products?activeOnly=${activeOnly}`)
            if (response.ok) {
                const data = await response.json()
                const filtered = filter === "inactive"
                    ? data.filter((p: Product) => !p.isActive)
                    : data
                setProducts(filtered)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    async function toggleProductStatus(id: string, currentStatus: boolean) {
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            })

            if (response.ok) {
                fetchProducts()
            }
        } catch (error) {
            console.error("Error updating product:", error)
        }
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Gestion des produits
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mt-1">
                        Catalogue des produits disponibles pour les livraisons
                    </p>
                </div>
                <Link href="/dashboard/products/new">
                    <Button size="lg">
                        <Plus size={20} className="mr-2" />
                        Nouveau produit
                    </Button>
                </Link>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={filter === "active" ? undefined : "ghost"}
                    onClick={() => setFilter("active")}
                >
                    Actifs
                </Button>
                <Button
                    variant={filter === "all" ? undefined : "ghost"}
                    onClick={() => setFilter("all")}
                >
                    Tous
                </Button>
                <Button
                    variant={filter === "inactive" ? undefined : "ghost"}
                    onClick={() => setFilter("inactive")}
                >
                    Inactifs
                </Button>
            </div>

            {/* Products Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Chargement...
                    </div>
                ) : products.length === 0 ? (
                    <div className="col-span-full text-center py-12 text-slate-500">
                        Aucun produit trouvé
                    </div>
                ) : (
                    products.map((product) => (
                        <Card key={product.id} className={!product.isActive ? "opacity-60" : ""}>
                            <CardHeader>
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="text-blue-600" size={24} />
                                        <div>
                                            <CardTitle className="text-lg">{product.name}</CardTitle>
                                            {product.category && (
                                                <p className="text-sm text-slate-500 mt-1">
                                                    {product.category}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <span className={`px-2 py-1 text-xs rounded-full ${product.isActive
                                        ? "bg-green-100 text-green-700"
                                        : "bg-slate-100 text-slate-700"
                                        }`}>
                                        {product.isActive ? "Actif" : "Inactif"}
                                    </span>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {product.description && (
                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                                        {product.description}
                                    </p>
                                )}
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                        Unité: {product.unit}
                                    </span>
                                    <div className="flex gap-2">
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => toggleProductStatus(product.id, product.isActive)}
                                        >
                                            {product.isActive ? "Désactiver" : "Activer"}
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
