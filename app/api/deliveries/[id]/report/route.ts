import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET delivery report for client
export async function GET(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params

        const delivery = await prisma.delivery.findUnique({
            where: { id },
            include: {
                items: {
                    include: {
                        product: true
                    }
                },
                hidingSpot: true,
                driver: {
                    select: {
                        name: true,
                        email: true
                    }
                }
            }
        })

        if (!delivery) {
            return NextResponse.json(
                { error: "Livraison non trouvée" },
                { status: 404 }
            )
        }

        // Return delivery report
        const report = {
            id: delivery.id,
            status: delivery.status,
            clientName: delivery.clientName,
            deliveryAddress: delivery.deliveryAddress,
            items: delivery.items.map(item => ({
                product: item.product.name,
                quantity: item.quantity,
                unit: item.product.unit
            })),
            createdAt: delivery.createdAt,
            hidingSpot: delivery.hidingSpot ? {
                photoUrl: delivery.hidingSpot.photoUrl,
                latitude: delivery.hidingSpot.latitude,
                longitude: delivery.hidingSpot.longitude,
                description: delivery.hidingSpot.description,
                distance: delivery.hidingSpot.distanceFromAddress
            } : null,
            driver: delivery.driver ? {
                name: delivery.driver.name
            } : null
        }

        return NextResponse.json(report)
    } catch (error) {
        console.error("Get delivery report error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération du compte rendu" },
            { status: 500 }
        )
    }
}
