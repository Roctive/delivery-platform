import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

type Params = Promise<{ id: string }>

// PATCH update delivery status
export async function PATCH(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params
        const { status } = await request.json()

        const updateData: { status: string; completedAt?: Date } = { status }

        // If status is DELIVERED, set completedAt
        if (status === "DELIVERED") {
            updateData.completedAt = new Date()

            // Update driver statistics
            const delivery = await prisma.delivery.findUnique({
                where: { id },
                select: { driverId: true }
            })

            if (delivery?.driverId) {
                await prisma.driverProfile.update({
                    where: { userId: delivery.driverId },
                    data: {
                        totalDeliveries: { increment: 1 }
                    }
                })
            }
        }

        const updatedDelivery = await prisma.delivery.update({
            where: { id },
            data: updateData,
            include: {
                driver: true,
                client: true
            }
        })

        return NextResponse.json(updatedDelivery)
    } catch (error) {
        console.error("Update status error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du statut" },
            { status: 500 }
        )
    }
}
