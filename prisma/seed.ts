import { PrismaClient } from '@prisma/client'
import { hash } from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Initialisation de la base de données...')

    // Create admin user
    const adminPassword = await hash('admin123', 12)
    const admin = await prisma.user.upsert({
        where: { email: 'admin@livraison.fr' },
        update: {},
        create: {
            email: 'admin@livraison.fr',
            name: 'Admin Toulouse',
            password: adminPassword,
            role: 'ADMIN'
        }
    })
    console.log('✅ Admin créé:', admin.email)

    // Create driver user
    const driverPassword = await hash('livreur123', 12)
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
    console.log('✅ Livreur créé:', driver.email)

    // Create driver profile
    await prisma.driverProfile.upsert({
        where: { userId: driver.id },
        update: {},
        create: {
            userId: driver.id,
            phone: '06 12 34 56 78',
            vehicle: 'Scooter',
            licensePlate: 'AB-123-CD',
            isAvailable: true
        }
    })
    console.log('✅ Profil livreur créé')

    // Create some sample clients
    const client1 = await prisma.client.upsert({
        where: { id: 'client1' },
        update: {},
        create: {
            id: 'client1',
            name: 'Restaurant Le Capitole',
            company: 'SARL Le Capitole',
            phone: '05 61 23 45 67',
            pickupAddress: '1 Place du Capitole, 31000 Toulouse',
            deliveryAddress: '12 Rue Alsace Lorraine, 31000 Toulouse',
            instructions: 'Sonner au nom du restaurant'
        }
    })
    console.log('✅ Client 1 créé:', client1.name)

    const client2 = await prisma.client.upsert({
        where: { id: 'client2' },
        update: {},
        create: {
            id: 'client2',
            name: 'Marie Martin',
            phone: '06 98 76 54 32',
            pickupAddress: '5 Allées Jean Jaurès, 31000 Toulouse',
            deliveryAddress: '23 Boulevard de Strasbourg, 31000 Toulouse'
        }
    })
    console.log('✅ Client 2 créé:', client2.name)

    console.log('\n🎉 Base de données initialisée avec succès!\n')
    console.log('📋 Comptes de test:')
    console.log('   Admin: admin@livraison.fr / admin123')
    console.log('   Livreur: livreur@livraison.fr / livreur123')
}

main()
    .catch((e) => {
        console.error('❌ Erreur:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
