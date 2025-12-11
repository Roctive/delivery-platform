import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma"

export async function POST(request: Request) {
    try {
        const { email, name, password, role } = await request.json()

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email }
        })

        if (existingUser) {
            return NextResponse.json(
                { error: "Un utilisateur avec cet email existe déjà" },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await hash(password, 12)

        // Create user
        const user = await prisma.user.create({
            data: {
                email,
                name,
                password: hashedPassword,
                role: role || "DRIVER"
            }
        })

        // If driver, create driver profile
        if (user.role === "DRIVER") {
            await prisma.driverProfile.create({
                data: {
                    userId: user.id,
                    phone: "",
                    isAvailable: true
                }
            })
        }

        return NextResponse.json(
            { message: "Utilisateur créé avec succès", user: { id: user.id, email: user.email, name: user.name } },
            { status: 201 }
        )
    } catch (error) {
        console.error("Registration error:", error)
        return NextResponse.json(
            { error: "Une erreur s'est produite lors de la création du compte" },
            { status: 500 }
        )
    }
}
