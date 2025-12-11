import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { calculateMaxDeliveryTime } from "@/lib/utils"

// GET all deliveries with filters
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const status = searchParams.get("status")
        const driverId = searchParams.get("driverId")

        const deliveries = await prisma.delivery.findMany({
            where: {
                ...(status && { status }),
                ...(driverId && { driverId })
            },
            include: {
                driver: {
                    select: {
                        id: true,
                        name: true,
                        email: true
                    }
                },
                client: true,
                items: {
                    include: {
                        product: true
                    }
                },
                hidingSpot: true
            },
            orderBy: {
                createdAt: "desc"
            }
        })

        return NextResponse.json(deliveries)
    } catch (error) {
        console.error("Get deliveries error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des livraisons" },
            { status: 500 }
        )
    }
}

// POST create a new delivery
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const {
            clientId,
            clientName,
            clientPhone,
            deliveryAddress,
            items, // Array of { productId, quantity }
            priority,
            instructions,
            driverId
        } = body

        // Validate required fields
        if (!clientName || !clientPhone || !deliveryAddress || !items || items.length === 0) {
            return NextResponse.json(
                { error: "Informations client, adresse de livraison et produits requis" },
                { status: 400 }
            )
        }

        // If driver is assigned, check inventory availability
        if (driverId) {
            const driverProfile = await prisma.driverProfile.findFirst({
                where: { userId: driverId },
                include: {
                    inventory: {
                        include: {
                            product: true
                        }
                    }
                }
            })

            if (!driverProfile) {
                return NextResponse.json(
                    { error: "Livreur non trouvé" },
                    { status: 404 }
                )
            }

            // Check if driver has enough stock for each item
            for (const item of items) {
                const inventoryItem = driverProfile.inventory.find(
                    inv => inv.productId === item.productId
                )

                if (!inventoryItem || inventoryItem.quantity < item.quantity) {
                    const product = await prisma.product.findUnique({
                        where: { id: item.productId }
                    })
                    return NextResponse.json(
                        {
                            error: `Stock insuffisant pour ${product?.name || 'ce produit'}. Disponible: ${inventoryItem?.quantity || 0}, Demandé: ${item.quantity}`
                        },
                        { status: 400 }
                    )
                }
            }
        }

        // Calculate estimated delivery time (2 hours from now)
        const estimatedDeliveryTime = new Date()
        estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + 2)

        // Create delivery with items
        const delivery = await prisma.delivery.create({
            data: {
                clientId: clientId || null,
                clientName,
                clientPhone,
                deliveryAddress,
                priority: priority || "NORMAL",
                instructions,
                maxDeliveryTime: calculateMaxDeliveryTime(),
                estimatedDeliveryTime,
                status: driverId ? "ASSIGNED" : "PENDING",
                driverId: driverId || null,
                items: {
                    create: items.map((item: { productId: string; quantity: number }) => ({
                        productId: item.productId,
                        quantity: item.quantity
                    }))
                }
            },
            include: {
                client: true,
                driver: true,
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        // Send Telegram notification if client has telegram chat ID
        if (delivery.client?.telegramChatId) {
            const { sendETANotification } = await import('@/lib/telegram-notifications')
            await sendETANotification(delivery.client.telegramChatId, delivery)
        }

        return NextResponse.json(delivery, { status: 201 })
    } catch (error) {
        console.error("Create delivery error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création de la livraison" },
            { status: 500 }
        )
    }
}
