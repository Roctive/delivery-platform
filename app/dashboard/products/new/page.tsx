"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"

export default function NewProductPage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setLoading(true)

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get("name"),
            description: formData.get("description"),
            category: formData.get("category"),
            unit: formData.get("unit")
        }

        try {
            const response = await fetch("/api/products", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            })

            if (response.ok) {
                router.push("/dashboard/products")
                router.refresh()
            } else {
                const error = await response.json()
                alert(error.error || "Erreur lors de la création du produit")
            }
        } catch (error) {
            console.error("Error creating product:", error)
            alert("Erreur lors de la création du produit")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/products">
                    <Button variant="ghost" size="sm">
                        <ArrowLeft size={20} className="mr-2" />
                        Retour
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                    Nouveau produit
                </h1>
            </div>

            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nom du produit *</Label>
                            <Input
                                id="name"
                                name="name"
                                required
                                placeholder="ex: Colis Standard"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Input
                                id="description"
                                name="description"
                                placeholder="ex: Colis de taille standard jusqu'à 5kg"
                            />
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="category">Catégorie</Label>
                                <Input
                                    id="category"
                                    name="category"
                                    placeholder="ex: Colis, Enveloppe, Fragile"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="unit">Unité *</Label>
                                <select
                                    id="unit"
                                    name="unit"
                                    required
                                    className="flex h-11 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-900"
                                >
                                    <option value="pièce">Pièce</option>
                                    <option value="kg">Kilogramme (kg)</option>
                                    <option value="litre">Litre</option>
                                    <option value="m³">Mètre cube (m³)</option>
                                </select>
                            </div>
                        </div>

                        <div className="pt-4 flex justify-end gap-4">
                            <Link href="/dashboard/products">
                                <Button type="button" variant="ghost">
                                    Annuler
                                </Button>
                            </Link>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Créer le produit
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
