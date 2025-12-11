import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { uploadBase64Image } from "@/lib/file-upload"
import { validateHidingSpotDistance } from "@/lib/geocoding"

// POST register hiding spot for a delivery
export async function POST(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { photoBase64, latitude, longitude, description } = body

        // Validate required fields
        if (!photoBase64 || latitude === undefined || longitude === undefined) {
            return NextResponse.json(
                { error: "Photo et coordonnées GPS requises" },
                { status: 400 }
            )
        }

        // Get delivery
        const delivery = await prisma.delivery.findUnique({
            where: { id },
            include: {
                driver: true,
                items: {
                    include: {
                        product: true
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

        // Check if delivery is in correct status
        if (delivery.status !== "ASSIGNED" && delivery.status !== "IN_TRANSIT") {
            return NextResponse.json(
                { error: "La livraison n'est pas dans un état valide pour enregistrer une cachette" },
                { status: 400 }
            )
        }

        // Validate distance (max 200m from delivery address)
        const validation = await validateHidingSpotDistance(
            delivery.deliveryAddress,
            { latitude, longitude },
            200
        )

        if (!validation.valid) {
            return NextResponse.json(
                { error: validation.error, distance: validation.distance },
                { status: 400 }
            )
        }

        // Upload photo
        const uploadResult = await uploadBase64Image(photoBase64, "hiding-spots")

        if (!uploadResult.success) {
            return NextResponse.json(
                { error: uploadResult.error },
                { status: 400 }
            )
        }

        // Create hiding spot and update delivery status
        const updatedDelivery = await prisma.$transaction(async (tx) => {
            // Create hiding spot
            await tx.hidingSpot.create({
                data: {
                    deliveryId: id,
                    photoUrl: uploadResult.publicUrl!,
                    latitude,
                    longitude,
                    description,
                    distanceFromAddress: validation.distance
                }
            })

            // Update delivery status
            const updated = await tx.delivery.update({
                where: { id },
                data: { status: "HIDDEN" },
                include: {
                    hidingSpot: true,
                    items: {
                        include: {
                            product: true
                        }
                    },
                    driver: true,
                    client: true
                }
            })

            // Deduct items from driver inventory
            if (delivery.driverId) {
                const driverProfile = await tx.driverProfile.findFirst({
                    where: { userId: delivery.driverId }
                })

                if (driverProfile) {
                    for (const item of delivery.items) {
                        const inventoryItem = await tx.driverInventory.findUnique({
                            where: {
                                driverProfileId_productId: {
                                    driverProfileId: driverProfile.id,
                                    productId: item.productId
                                }
                            }
                        })

                        if (inventoryItem) {
                            await tx.driverInventory.update({
                                where: { id: inventoryItem.id },
                                data: {
                                    quantity: Math.max(0, inventoryItem.quantity - item.quantity)
                                }
                            })
                        }
                    }
                }
            }

            return updated
        })

        return NextResponse.json(updatedDelivery, { status: 201 })
    } catch (error) {
        console.error("Register hiding spot error:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'enregistrement de la cachette" },
            { status: 500 }
        )
    }
}
