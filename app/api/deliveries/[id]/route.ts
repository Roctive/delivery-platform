import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

type Params = Promise<{ id: string }>

// GET single delivery
export async function GET(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params

        const delivery = await prisma.delivery.findUnique({
            where: { id },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                client: true
            }
        })

        if (!delivery) {
            return NextResponse.json(
                { error: "Livraison non trouvée" },
                { status: 404 }
            )
        }

        return NextResponse.json(delivery)
    } catch (error) {
        console.error("Get delivery error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération de la livraison" },
            { status: 500 }
        )
    }
}

// PATCH update delivery
export async function PATCH(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params
        const body = await request.json()

        // Get the current delivery to check status change
        const currentDelivery = await prisma.delivery.findUnique({
            where: { id },
            include: {
                client: true,
                hidingSpot: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        const delivery = await prisma.delivery.update({
            where: { id },
            data: body,
            include: {
                driver: true,
                client: true,
                hidingSpot: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        // Send Telegram notification if status changed to DELIVERED and client has telegram
        if (
            body.status === 'DELIVERED' &&
            currentDelivery?.status !== 'DELIVERED' &&
            delivery.client?.telegramChatId &&
            delivery.hidingSpot
        ) {
            const { sendDeliveryReport } = await import('@/lib/telegram-notifications')
            await sendDeliveryReport(
                delivery.client.telegramChatId,
                delivery,
                delivery.hidingSpot
            )
        }

        // Send status update for other status changes
        if (
            body.status &&
            body.status !== 'DELIVERED' &&
            currentDelivery?.status !== body.status &&
            delivery.client?.telegramChatId
        ) {
            const { sendStatusUpdate } = await import('@/lib/telegram-notifications')
            await sendStatusUpdate(delivery.client.telegramChatId, delivery)
        }

        return NextResponse.json(delivery)
    } catch (error) {
        console.error("Update delivery error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour de la livraison" },
            { status: 500 }
        )
    }
}

// DELETE delivery
export async function DELETE(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params

        await prisma.delivery.delete({
            where: { id }
        })

        return NextResponse.json({ message: "Livraison supprimée" })
    } catch (error) {
        console.error("Delete delivery error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la suppression de la livraison" },
            { status: 500 }
        )
    }
}
