import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET product by ID
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const product = await prisma.product.findUnique({
            where: { id },
            include: {
                _count: {
                    select: {
                        inventory: true,
                        deliveryItems: true
                    }
                }
            }
        })

        if (!product) {
            return NextResponse.json(
                { error: "Produit non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json(product)
    } catch (error) {
        console.error("Get product error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération du produit" },
            { status: 500 }
        )
    }
}

// PATCH update product
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, description, category, unit, isActive } = body

        const product = await prisma.product.update({
            where: { id },
            data: {
                ...(name !== undefined && { name }),
                ...(description !== undefined && { description }),
                ...(category !== undefined && { category }),
                ...(unit !== undefined && { unit }),
                ...(isActive !== undefined && { isActive })
            }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error("Update product error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du produit" },
            { status: 500 }
        )
    }
}

// DELETE deactivate product
export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Soft delete by setting isActive to false
        const product = await prisma.product.update({
            where: { id },
            data: { isActive: false }
        })

        return NextResponse.json(product)
    } catch (error) {
        console.error("Delete product error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression du produit" },
            { status: 500 }
        )
    }
}
