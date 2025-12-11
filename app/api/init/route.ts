import { NextResponse } from "next/server"
import { hash } from "bcryptjs"
import prisma from "@/lib/prisma"

export async function GET() {
    try {
        console.log("Starting database initialization...")

        // 1. Create Admin
        const adminPassword = await hash("admin123", 12)
        const admin = await prisma.user.upsert({
            where: { email: "admin@livraison.fr" },
            update: {
                password: adminPassword,
                role: "ADMIN"
            },
            create: {
                email: "admin@livraison.fr",
                name: "Admin Toulouse",
                password: adminPassword,
                role: "ADMIN"
            }
        })
        console.log("Admin created/updated")

        // 2. Create Driver
        const driverPassword = await hash("livreur123", 12)
        const driver = await prisma.user.upsert({
            where: { email: "livreur@livraison.fr" },
            update: {
                password: driverPassword,
                role: "DRIVER"
            },
            create: {
                email: "livreur@livraison.fr",
                name: "Jean Dupont",
                password: driverPassword,
                role: "DRIVER"
            }
        })
        console.log("Driver created/updated")

        // 3. Create Driver Profile
        await prisma.driverProfile.upsert({
            where: { userId: driver.id },
            update: {},
            create: {
                userId: driver.id,
                phone: "06 12 34 56 78",
                vehicle: "Scooter",
                licensePlate: "AB-123-CD",
                isAvailable: true
            }
        })
        console.log("Driver profile created/updated")

        // 4. Create Clients sequentially
        const clients = [
            {
                name: "Restaurant Le Capitole",
                company: "SARL Le Capitole",
                phone: "05 61 23 45 67",
                pickupAddress: "1 Place du Capitole, 31000 Toulouse",
                deliveryAddress: "12 Rue Alsace Lorraine, 31000 Toulouse",
                instructions: "Sonner au nom du restaurant"
            },
            {
                name: "Marie Martin",
                phone: "06 98 76 54 32",
                pickupAddress: "5 Allées Jean Jaurès, 31000 Toulouse",
                deliveryAddress: "23 Boulevard de Strasbourg, 31000 Toulouse"
            }
        ]

        for (const clientData of clients) {
            const existing = await prisma.client.findFirst({
                where: { name: clientData.name }
            })

            if (!existing) {
                await prisma.client.create({
                    data: clientData
                })
            }
        }
        console.log("Clients created")

        return NextResponse.json({
            message: "Base de données initialisée avec succès",
            users: {
                admin: { email: admin.email, password: "admin123" },
                driver: { email: driver.email, password: "livreur123" }
            }
        })
    } catch (error) {
        console.error("Init error:", error)
        return NextResponse.json(
            { error: "Erreur lors de l'initialisation: " + (error as Error).message },
            { status: 500 }
        )
    }
}
