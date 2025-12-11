import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all products
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const activeOnly = searchParams.get("activeOnly") === "true"

        const products = await prisma.product.findMany({
            where: activeOnly ? { isActive: true } : undefined,
            orderBy: {
                name: "asc"
            }
        })

        return NextResponse.json(products)
    } catch (error) {
        console.error("Get products error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des produits" },
            { status: 500 }
        )
    }
}

// POST create a new product (admin only)
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, description, category, unit } = body

        if (!name) {
            return NextResponse.json(
                { error: "Le nom du produit est requis" },
                { status: 400 }
            )
        }

        const product = await prisma.product.create({
            data: {
                name,
                description,
                category,
                unit: unit || "pièce",
                isActive: true
            }
        })

        return NextResponse.json(product, { status: 201 })
    } catch (error) {
        console.error("Create product error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création du produit" },
            { status: 500 }
        )
    }
}
