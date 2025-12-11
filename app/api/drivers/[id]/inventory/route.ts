import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET driver inventory
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        // Get driver profile
        const driverProfile = await prisma.driverProfile.findFirst({
            where: { userId: id }
        })

        if (!driverProfile) {
            return NextResponse.json(
                { error: "Profil livreur non trouvé" },
                { status: 404 }
            )
        }

        // Get inventory with product details
        const inventory = await prisma.driverInventory.findMany({
            where: { driverProfileId: driverProfile.id },
            include: {
                product: true
            },
            orderBy: {
                product: {
                    name: "asc"
                }
            }
        })

        return NextResponse.json(inventory)
    } catch (error) {
        console.error("Get inventory error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération de l'inventaire" },
            { status: 500 }
        )
    }
}

// POST add stock (resupply)
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { productId, quantity } = body

        if (!productId || quantity === undefined || quantity <= 0) {
            return NextResponse.json(
                { error: "Produit et quantité valides requis" },
                { status: 400 }
            )
        }

        // Get driver profile
        const driverProfile = await prisma.driverProfile.findFirst({
            where: { userId: id }
        })

        if (!driverProfile) {
            return NextResponse.json(
                { error: "Profil livreur non trouvé" },
                { status: 404 }
            )
        }

        // Check if inventory item exists
        const existingInventory = await prisma.driverInventory.findUnique({
            where: {
                driverProfileId_productId: {
                    driverProfileId: driverProfile.id,
                    productId
                }
            }
        })

        let inventory
        if (existingInventory) {
            // Update existing inventory
            inventory = await prisma.driverInventory.update({
                where: { id: existingInventory.id },
                data: {
                    quantity: existingInventory.quantity + quantity
                },
                include: {
                    product: true
                }
            })
        } else {
            // Create new inventory item
            inventory = await prisma.driverInventory.create({
                data: {
                    driverProfileId: driverProfile.id,
                    productId,
                    quantity
                },
                include: {
                    product: true
                }
            })
        }

        return NextResponse.json(inventory, { status: 201 })
    } catch (error) {
        console.error("Add inventory error:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'ajout de stock" },
            { status: 500 }
        )
    }
}

// PATCH update inventory quantities
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { inventoryId, quantity } = body

        if (!inventoryId || quantity === undefined || quantity < 0) {
            return NextResponse.json(
                { error: "ID d'inventaire et quantité valides requis" },
                { status: 400 }
            )
        }

        const inventory = await prisma.driverInventory.update({
            where: { id: inventoryId },
            data: { quantity },
            include: {
                product: true
            }
        })

        return NextResponse.json(inventory)
    } catch (error) {
        console.error("Update inventory error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour de l'inventaire" },
            { status: 500 }
        )
    }
}
