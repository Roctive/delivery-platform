"use client"

import { useState, useEffect } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Settings,
    Package,
    User,
    Bell,
    Shield,
    Plus,
    Edit,
    Trash2,
    Check,
    X,
    Loader2
} from "lucide-react"
import { Product } from "@prisma/client"

type TabType = "products" | "profile" | "notifications" | "security"

export default function SettingsPage() {
    const [activeTab, setActiveTab] = useState<TabType>("products")

    const tabs = [
        { id: "products" as TabType, label: "Produits Livrables", icon: Package },
        { id: "profile" as TabType, label: "Profil", icon: User },
        { id: "notifications" as TabType, label: "Notifications", icon: Bell },
        { id: "security" as TabType, label: "Sécurité", icon: Shield }
    ]

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    <Settings className="text-blue-600" size={32} />
                    Paramètres
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                    Configuration de la plateforme de livraison
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-slate-200 dark:border-slate-700">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-3 font-medium transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? "text-blue-600 border-b-2 border-blue-600"
                                    : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                                    }`}
                            >
                                <Icon size={18} />
                                {tab.label}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === "products" && <ProductsSettings />}
                {activeTab === "profile" && <ProfileSettings />}
                {activeTab === "notifications" && <NotificationsSettings />}
                {activeTab === "security" && <SecuritySettings />}
            </div>
        </div>
    )
}

// Products Settings Component
function ProductsSettings() {
    const [products, setProducts] = useState<Product[]>([])
    const [loading, setLoading] = useState(true)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [editForm, setEditForm] = useState<Partial<Product>>({})
    const [showAddForm, setShowAddForm] = useState(false)
    const [newProduct, setNewProduct] = useState({
        name: "",
        description: "",
        category: "",
        unit: "pièce"
    })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        fetchProducts()
    }, [])

    async function fetchProducts() {
        try {
            const response = await fetch("/api/products")
            if (response.ok) {
                const data = await response.json()
                setProducts(data)
            }
        } catch (error) {
            console.error("Error fetching products:", error)
        } finally {
            setLoading(false)
        }
    }

    function startEdit(product: Product) {
        setEditingId(product.id)
        setEditForm(product)
    }

    function cancelEdit() {
        setEditingId(null)
        setEditForm({})
    }

    async function saveEdit() {
        if (!editingId) return
        setSubmitting(true)

        try {
            const response = await fetch(`/api/products/${editingId}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(editForm)
            })

            if (response.ok) {
                await fetchProducts()
                setEditingId(null)
                setEditForm({})
            }
        } catch (error) {
            console.error("Error updating product:", error)
        } finally {
            setSubmitting(false)
        }
    }

    async function toggleActive(id: string, currentStatus: boolean) {
        try {
            const response = await fetch(`/api/products/${id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ isActive: !currentStatus })
            })

            if (response.ok) {
                await fetchProducts()
            }
        } catch (error) {
            console.error("Error toggling product:", error)
        }
    }

    async function addProduct() {
        if (!newProduct.name) {
            alert("Le nom du produit est requis")
            return
        }
        setSubmitting(true)

        try {
            console.log("Sending product data:", newProduct)
            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(newProduct)
            })

            console.log("Response status:", response.status)

            if (response.ok) {
                const data = await response.json()
                console.log("Product created:", data)
                await fetchProducts()
                setShowAddForm(false)
                setNewProduct({ name: "", description: "", category: "", unit: "pièce" })
                alert("Produit ajouté avec succès !")
            } else {
                const errorData = await response.json()
                console.error("Error response:", errorData)
                alert(`Erreur: ${errorData.error || "Impossible d'ajouter le produit"}`)
            }
        } catch (error) {
            console.error("Error adding product:", error)
            alert(`Erreur réseau: ${error}`)
        } finally {
            setSubmitting(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Add Product Form */}
            {showAddForm ? (
                <Card>
                    <CardHeader>
                        <CardTitle>Ajouter un nouveau produit</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Nom du produit *</Label>
                                    <Input
                                        value={newProduct.name}
                                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                                        placeholder="ex: Colis Standard"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Catégorie</Label>
                                    <Input
                                        value={newProduct.category}
                                        onChange={(e) => setNewProduct({ ...newProduct, category: e.target.value })}
                                        placeholder="ex: Colis"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label>Description</Label>
                                <Input
                                    value={newProduct.description}
                                    onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                                    placeholder="ex: Colis de taille standard jusqu'à 5kg"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Unité *</Label>
                                <select
                                    value={newProduct.unit}
                                    onChange={(e) => setNewProduct({ ...newProduct, unit: e.target.value })}
                                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <option value="pièce">Pièce</option>
                                    <option value="kg">Kilogramme (kg)</option>
                                    <option value="litre">Litre</option>
                                    <option value="m³">Mètre cube (m³)</option>
                                </select>
                            </div>
                            <div className="flex gap-2">
                                <Button onClick={addProduct} disabled={submitting || !newProduct.name}>
                                    {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Ajouter
                                </Button>
                                <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                                    Annuler
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={18} className="mr-2" />
                    Nouveau produit
                </Button>
            )}

            {/* Products List */}
            <Card>
                <CardHeader>
                    <CardTitle>Produits disponibles</CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-slate-500">Chargement...</div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-8 text-slate-500">
                            Aucun produit configuré
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {products.map((product) => (
                                <div
                                    key={product.id}
                                    className={`border rounded-lg p-4 ${!product.isActive ? "opacity-60 bg-slate-50 dark:bg-slate-800/50" : ""
                                        }`}
                                >
                                    {editingId === product.id ? (
                                        // Edit Mode
                                        <div className="space-y-3">
                                            <div className="grid md:grid-cols-2 gap-3">
                                                <Input
                                                    value={editForm.name || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                                    placeholder="Nom"
                                                />
                                                <Input
                                                    value={editForm.category || ""}
                                                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                                    placeholder="Catégorie"
                                                />
                                            </div>
                                            <Input
                                                value={editForm.description || ""}
                                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                                placeholder="Description"
                                            />
                                            <div className="flex gap-2">
                                                <Button size="sm" onClick={saveEdit} disabled={submitting}>
                                                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check size={16} />}
                                                </Button>
                                                <Button size="sm" variant="ghost" onClick={cancelEdit}>
                                                    <X size={16} />
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        // View Mode
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h3 className="font-semibold text-lg">{product.name}</h3>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${product.isActive
                                                        ? "bg-green-100 text-green-700"
                                                        : "bg-slate-100 text-slate-700"
                                                        }`}>
                                                        {product.isActive ? "Actif" : "Inactif"}
                                                    </span>
                                                    {product.category && (
                                                        <span className="px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-700">
                                                            {product.category}
                                                        </span>
                                                    )}
                                                </div>
                                                {product.description && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">
                                                        {product.description}
                                                    </p>
                                                )}
                                                <p className="text-sm text-slate-500">
                                                    Unité: <span className="font-medium">{product.unit}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => startEdit(product)}
                                                >
                                                    <Edit size={16} />
                                                </Button>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={() => toggleActive(product.id, product.isActive)}
                                                >
                                                    {product.isActive ? "Désactiver" : "Activer"}
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

// Profile Settings Component
function ProfileSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Nom complet</Label>
                        <Input placeholder="Votre nom" />
                    </div>
                    <div className="space-y-2">
                        <Label>Email</Label>
                        <Input type="email" placeholder="votre@email.com" />
                    </div>
                    <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input placeholder="06 12 34 56 78" />
                    </div>
                    <Button>Enregistrer les modifications</Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Notifications Settings Component
function NotificationsSettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Préférences de notification</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Nouvelles livraisons</p>
                            <p className="text-sm text-slate-600">Recevoir une notification pour chaque nouvelle livraison</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Mises à jour de statut</p>
                            <p className="text-sm text-slate-600">Notifications lors des changements de statut</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium">Alertes d&apos;inventaire</p>
                            <p className="text-sm text-slate-600">Alerte quand le stock est faible</p>
                        </div>
                        <input type="checkbox" className="w-5 h-5" defaultChecked />
                    </div>
                    <Button>Enregistrer les préférences</Button>
                </div>
            </CardContent>
        </Card>
    )
}

// Security Settings Component
function SecuritySettings() {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Sécurité et confidentialité</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    <div className="space-y-4">
                        <h3 className="font-semibold">Changer le mot de passe</h3>
                        <div className="space-y-2">
                            <Label>Mot de passe actuel</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Nouveau mot de passe</Label>
                            <Input type="password" />
                        </div>
                        <div className="space-y-2">
                            <Label>Confirmer le nouveau mot de passe</Label>
                            <Input type="password" />
                        </div>
                        <Button>Mettre à jour le mot de passe</Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
