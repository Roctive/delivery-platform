// Simple, working Telegram bot implementation
import TelegramBot from 'node-telegram-bot-api'
import prisma from './prisma'

const token = process.env.TELEGRAM_BOT_TOKEN!

if (!token) {
    throw new Error('TELEGRAM_BOT_TOKEN must be defined')
}

// Create bot with polling
const bot = new TelegramBot(token, { polling: true })

console.log('🤖 Telegram bot started with polling')

// Store conversation states
interface ConversationState {
    step: 'name' | 'phone' | 'address' | 'products' | 'instructions' | 'confirm'
    data: {
        name?: string
        phone?: string
        address?: string
        products?: Array<{ productId: string; quantity: number }>
        instructions?: string
    }
}

const conversations = new Map<number, ConversationState>()

// /start command
bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id

    await bot.sendMessage(
        chatId,
        `🚚 *Bienvenue sur le service de livraison!*\n\n` +
        `Je suis votre assistant pour créer et suivre vos livraisons.\n\n` +
        `*Commandes disponibles:*\n` +
        `/nouvellelivraison - Créer une nouvelle demande de livraison\n` +
        `/meslivraisons - Voir toutes vos livraisons\n` +
        `/aide - Afficher l'aide`,
        { parse_mode: 'Markdown' }
    )

    const existingClient = await prisma.client.findUnique({
        where: { telegramChatId: chatId.toString() }
    })

    if (!existingClient) {
        await bot.sendMessage(
            chatId,
            `Pour commencer, utilisez /nouvellelivraison pour créer votre première demande.`
        )
    }
})

// /aide command  
bot.onText(/\/aide/, async (msg) => {
    const chatId = msg.chat.id

    await bot.sendMessage(
        chatId,
        `📋 *Guide d'utilisation*\n\n` +
        `*1. Créer une livraison*\n` +
        `Utilisez /nouvellelivraison et suivez les étapes\n\n` +
        `*2. Suivre vos livraisons*\n` +
        `Utilisez /meslivraisons pour voir l'état de toutes vos demandes\n\n` +
        `*3. Notifications automatiques*\n` +
        `Vous recevrez automatiquement des notifications`,
        { parse_mode: 'Markdown' }
    )
})

// /nouvellelivraison command
bot.onText(/\/nouvellelivraison/, async (msg) => {
    const chatId = msg.chat.id

    conversations.set(chatId, {
        step: 'name',
        data: {}
    })

    await bot.sendMessage(
        chatId,
        `📦 *Nouvelle demande de livraison*\n\nCommençons! Quel est votre nom complet?`,
        { parse_mode: 'Markdown' }
    )
})

// /meslivraisons command
bot.onText(/\/meslivraisons/, async (msg) => {
    const chatId = msg.chat.id

    try {
        const client = await prisma.client.findUnique({
            where: { telegramChatId: chatId.toString() },
            include: {
                deliveries: {
                    include: {
                        items: {
                            include: {
                                product: true
                            }
                        }
                    },
                    orderBy: {
                        createdAt: 'desc'
                    }
                }
            }
        })

        if (!client || client.deliveries.length === 0) {
            await bot.sendMessage(
                chatId,
                `Vous n'avez aucune livraison pour le moment.\n\nUtilisez /nouvellelivraison pour créer votre première demande.`
            )
            return
        }

        let message = `📋 *Vos livraisons*\n\n`

        for (const delivery of client.deliveries) {
            const statusEmoji = delivery.status === 'DELIVERED' ? '✅' : delivery.status === 'PENDING' ? '⏳' : '🚚'
            message += `${statusEmoji} ${delivery.deliveryAddress}\n`
        }

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
        console.error('Error:', error)
        await bot.sendMessage(chatId, `❌ Erreur`)
    }
})

// Message handler for conversation flow
bot.on('message', async (msg) => {
    const chatId = msg.chat.id
    const text = msg.text

    if (text?.startsWith('/')) return

    const conversation = conversations.get(chatId)
    if (!conversation) return

    try {
        switch (conversation.step) {
            case 'name':
                conversation.data.name = text
                conversation.step = 'phone'
                await bot.sendMessage(chatId, `Merci ${text}! 📱\n\nQuel est votre numéro de téléphone?`)
                break

            case 'phone':
                conversation.data.phone = text
                conversation.step = 'address'
                await bot.sendMessage(chatId, `Parfait! 📍\n\nQuelle est l'adresse de livraison complète?`)
                break

            case 'address':
                conversation.data.address = text
                conversation.step = 'products'

                // Fetch available products
                const products = await prisma.product.findMany({
                    where: { isActive: true }
                })

                let productList = `Excellent! 📦\n\nQuels produits souhaitez-vous recevoir?\n\n*Produits disponibles:*\n`
                products.forEach((p, i) => {
                    productList += `${i + 1}. ${p.name}${p.description ? ` - ${p.description}` : ''}\n`
                })
                productList += `\nRépondez au format: *numéro quantité* (ex: "1 2" pour 2x ${products[0]?.name})\n`
                productList += `Vous pouvez ajouter plusieurs produits séparés par des virgules (ex: "1 2, 3 1")`

                await bot.sendMessage(chatId, productList, { parse_mode: 'Markdown' })
                break

            case 'products':
                // Parse product selection
                const products2 = await prisma.product.findMany({
                    where: { isActive: true }
                })

                const productSelections = text!.split(',').map(s => s.trim())
                const selectedProducts: Array<{ productId: string; quantity: number }> = []

                for (const selection of productSelections) {
                    const [numStr, qtyStr] = selection.split(' ')
                    const num = parseInt(numStr)
                    const qty = parseInt(qtyStr)

                    if (num > 0 && num <= products2.length && qty > 0) {
                        selectedProducts.push({
                            productId: products2[num - 1].id,
                            quantity: qty
                        })
                    }
                }

                if (selectedProducts.length === 0) {
                    await bot.sendMessage(
                        chatId,
                        `❌ Format invalide. Veuillez réessayer (ex: "1 2" ou "1 2, 3 1")`
                    )
                    return
                }

                conversation.data.products = selectedProducts
                conversation.step = 'instructions'

                await bot.sendMessage(
                    chatId,
                    `Super! 📝\n\nAvez-vous des instructions spéciales pour le livreur?\n\n` +
                    `(Répondez "non" si vous n'en avez pas)`
                )
                break

            case 'instructions':
                if (text?.toLowerCase() !== 'non') {
                    conversation.data.instructions = text
                }
                conversation.step = 'confirm'

                // Show summary
                const summary = `✅ *Récapitulatif de votre demande*\n\n` +
                    `👤 Nom: ${conversation.data.name}\n` +
                    `📱 Téléphone: ${conversation.data.phone}\n` +
                    `📍 Adresse: ${conversation.data.address}\n` +
                    `📦 Produits: ${conversation.data.products?.length} article(s)\n` +
                    `${conversation.data.instructions ? `📝 Instructions: ${conversation.data.instructions}\n` : ''}\n` +
                    `Confirmez-vous cette demande? (oui/non)`

                await bot.sendMessage(chatId, summary, { parse_mode: 'Markdown' })
                break

            case 'confirm':
                if (text?.toLowerCase() === 'oui') {
                    // Create delivery
                    await createDeliveryFromConversation(chatId, conversation.data, msg.from?.username)
                    conversations.delete(chatId)
                } else {
                    await bot.sendMessage(
                        chatId,
                        `Demande annulée. Utilisez /nouvellelivraison pour recommencer.`
                    )
                    conversations.delete(chatId)
                }
                break
        }
    } catch (error) {
        console.error('Error:', error)
        await bot.sendMessage(
            chatId,
            `❌ Une erreur s'est produite. Veuillez réessayer avec /nouvellelivraison`
        )
        conversations.delete(chatId)
    }
})

// Helper function to create delivery from conversation
async function createDeliveryFromConversation(
    chatId: number,
    data: ConversationState['data'],
    username?: string
) {
    try {
        // Find or create client
        let client = await prisma.client.findUnique({
            where: { telegramChatId: chatId.toString() }
        })

        if (!client) {
            client = await prisma.client.create({
                data: {
                    name: data.name!,
                    phone: data.phone!,
                    telegramChatId: chatId.toString(),
                    telegramUsername: username
                }
            })
        }

        // Calculate ETA (example: 2 hours from now)
        const estimatedDeliveryTime = new Date()
        estimatedDeliveryTime.setHours(estimatedDeliveryTime.getHours() + 2)

        // Calculate max delivery time (example: 4 hours from now)
        const maxDeliveryTime = new Date()
        maxDeliveryTime.setHours(maxDeliveryTime.getHours() + 4)

        // Create delivery
        const delivery = await prisma.delivery.create({
            data: {
                clientId: client.id,
                clientName: data.name!,
                clientPhone: data.phone!,
                deliveryAddress: data.address!,
                instructions: data.instructions,
                estimatedDeliveryTime,
                maxDeliveryTime,
                status: 'PENDING',
                items: {
                    create: data.products!
                }
            },
            include: {
                items: {
                    include: {
                        product: true
                    }
                }
            }
        })

        // Send confirmation
        const items = delivery.items
            .map((item: any) => `${item.quantity}x ${item.product.name}`)
            .join(', ')

        const eta = estimatedDeliveryTime.toLocaleString('fr-FR', {
            dateStyle: 'short',
            timeStyle: 'short'
        })

        await bot.sendMessage(
            chatId,
            `✅ *Demande créée avec succès!*\n\n` +
            `📦 Produits: ${items}\n` +
            `📍 Adresse: ${delivery.deliveryAddress}\n` +
            `⏰ *Estimation de livraison: ${eta}*\n\n` +
            `Votre livraison a été enregistrée. Vous recevrez des notifications automatiques sur l'avancement.`,
            { parse_mode: 'Markdown' }
        )
    } catch (error) {
        console.error('Error creating delivery:', error)
        await bot.sendMessage(
            chatId,
            `❌ Erreur lors de la création de la demande. Veuillez réessayer.`
        )
    }
}

export default bot
