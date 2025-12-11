import { NextResponse } from "next/server"
import prisma from "@/lib/prisma"

// GET all clients
export async function GET() {
    try {
        const clients = await prisma.client.findMany({
            orderBy: {
                name: "asc"
            }
        })

        return NextResponse.json(clients)
    } catch (error) {
        console.error("Get clients error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la récupération des clients" },
            { status: 500 }
        )
    }
}

// POST create client
export async function POST(request: Request) {
    try {
        const body = await request.json()

        const client = await prisma.client.create({
            data: body
        })

        return NextResponse.json(client, { status: 201 })
    } catch (error) {
        console.error("Create client error:", error)
        return NextResponse.json(
            { error: "Erreur lors de la création du client" },
            { status: 500 }
        )
    }
}
