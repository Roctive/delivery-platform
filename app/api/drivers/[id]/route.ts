import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

type Params = Promise<{ id: string }>

// GET single driver
export async function GET(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params

        const driver = await prisma.user.findUnique({
            where: { id },
            include: {
                driverProfile: true,
                assignedDeliveries: {
                    orderBy: {
                        createdAt: "desc"
                    }
                }
            }
        })

        if (!driver) {
            return NextResponse.json(
                { error: "Livreur non trouvé" },
                { status: 404 }
            )
        }

        return NextResponse.json(driver)
    } catch (error) {
        console.error("Get driver error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération du livreur" },
            { status: 500 }
        )
    }
}

// PATCH update driver
export async function PATCH(
    request: Request,
    { params }: { params: Params }
) {
    try {
        const { id } = await params
        const body = await request.json()
        const { name, email, phone, vehicle, licensePlate, isAvailable } = body

        // Update user
        const user = await prisma.user.update({
            where: { id },
            data: {
                ...(name && { name }),
                ...(email && { email })
            }
        })

        // Update driver profile
        const driverProfile = await prisma.driverProfile.update({
            where: { userId: id },
            data: {
                ...(phone !== undefined && { phone }),
                ...(vehicle !== undefined && { vehicle }),
                ...(licensePlate !== undefined && { licensePlate }),
                ...(isAvailable !== undefined && { isAvailable })
            }
        })

        return NextResponse.json({ ...user, driverProfile })
    } catch (error) {
        console.error("Update driver error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la mise à jour du livreur" },
            { status: 500 }
        )
    }
}
