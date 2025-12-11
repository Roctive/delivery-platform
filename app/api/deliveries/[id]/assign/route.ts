import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

type Params = Promise<{ id: string }>

// POST assign delivery to driver
export async function POST(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params
        const { driverId } = await request.json()

        // Update delivery status and assign driver
        const delivery = await prisma.delivery.update({
            where: { id },
            data: {
                driverId,
                status: "ASSIGNED"
            },
            include: {
                driver: true,
                client: true
            }
        })

        return NextResponse.json(delivery)
    } catch (error) {
        console.error("Assign delivery error:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'assignation de la livraison" },
            { status: 500 }
        )
    }
}
