const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting seed...')

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@livraison.fr' },
        update: {},
        create: {
            email: 'admin@livraison.fr',
            name: 'Admin',
            password: adminPassword,
            role: 'ADMIN'
        }
    })
    console.log('✓ Admin user created')

    // Create driver user
    const driverPassword = await bcrypt.hash('livreur123', 10)
    const driver = await prisma.user.upsert({
        where: { email: 'livreur@livraison.fr' },
        update: {},
        create: {
            email: 'livreur@livraison.fr',
            name: 'Jean Dupont',
            password: driverPassword,
            role: 'DRIVER'
        }
    })
    console.log('✓ Driver user created')

    // Create driver profile
    const driverProfile = await prisma.driverProfile.upsert({
        where: { userId: driver.id },
        update: {},
        create: {
            userId: driver.id,
            phone: '06 12 34 56 78',
            vehicle: 'Renault Kangoo',
            licensePlate: 'AB-123-CD',
            isAvailable: true
        }
    })
    console.log('✓ Driver profile created')

    // Create products
    const products = [
        {
            name: 'Colis Standard',
            description: 'Colis de taille standard jusqu\'à 5kg',
            category: 'Colis',
            unit: 'pièce'
        },
        {
            name: 'Enveloppe',
            description: 'Enveloppe format A4',
            category: 'Enveloppe',
            unit: 'pièce'
        },
        {
            name: 'Colis Fragile',
            description: 'Colis nécessitant une manipulation délicate',
            category: 'Fragile',
            unit: 'pièce'
        },
        {
            name: 'Paquet Volumineux',
            description: 'Colis de grande taille jusqu\'à 20kg',
            category: 'Colis',
            unit: 'pièce'
        }
    ]

    for (const productData of products) {
        const existing = await prisma.product.findFirst({
            where: { name: productData.name }
        })
        if (!existing) {
            await prisma.product.create({
                data: productData
            })
        }
    }
    console.log('✓ Products created')

    // Add inventory to driver
    const allProducts = await prisma.product.findMany()
    for (const product of allProducts) {
        await prisma.driverInventory.upsert({
            where: {
                driverProfileId_productId: {
                    driverProfileId: driverProfile.id,
                    productId: product.id
                }
            },
            update: {},
            create: {
                driverProfileId: driverProfile.id,
                productId: product.id,
                quantity: Math.floor(Math.random() * 15) + 5 // Random quantity between 5 and 20
            }
        })
    }
    console.log('✓ Driver inventory initialized')

    // Create a test client
    const existingClient = await prisma.client.findFirst({
        where: { phone: '06 98 76 54 32' }
    })
    if (!existingClient) {
        await prisma.client.create({
            data: {
                name: 'Marie Martin',
                company: 'Tech Solutions',
                phone: '06 98 76 54 32',
                instructions: 'Appeler avant de livrer'
            }
        })
    }
    console.log('✓ Test client created')

    console.log('✅ Seed completed!')
    console.log('\n📝 Login credentials:')
    console.log('Admin: admin@livraison.fr / admin123')
    console.log('Driver: livreur@livraison.fr / livreur123')
}

main()
    .catch((e) => {
        console.error('❌ Seed failed:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
