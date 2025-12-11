import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all drivers
export async function GET() {
    try {
        const drivers = await prisma.user.findMany({
            where: {
                role: "DRIVER"
            },
            include: {
                driverProfile: true,
                assignedDeliveries: {
                    where: {
                        status: {
                            in: ["ASSIGNED", "PICKING_UP", "IN_TRANSIT"]
                        }
                    }
                }
            },
            orderBy: {
                name: "asc"
            }
        })

        return NextResponse.json(drivers)
    } catch (error) {
        console.error("Get drivers error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des livreurs" },
            { status: 500 }
        )
    }
}

// POST create driver
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { email, name, password, phone, vehicle, licensePlate } = body

        const { hash } = await import("bcryptjs")
        const hashedPassword = await hash(password, 12)

        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: "DRIVER"
            }
        })

        const driverProfile = await prisma.driverProfile.create({
            data: {
                userId: user.id,
                phone,
                vehicle,
                licensePlate,
                isAvailable: true
            }
        })

        return NextResponse.json({ ...user, driverProfile }, { status: 201 })
    } catch (error) {
        console.error("Create driver error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création du livreur" },
            { status: 500 }
        )
    }
}
