import prisma from './prisma'
import { sendETANotification } from './telegram-notifications'
import { initializeBotWithPolling, getBotInstance } from './telegram-bot-instance'

// Bot will be initialized when needed, not automatically
let bot = getBotInstance()

// Function to ensure bot is initialized
export function ensureBotInitialized() {
    if (!bot) {
        bot = initializeBotWithPolling()
        if (bot) {
            setupBotHandlers()
        }
    }
    return bot
}

// Setup all bot command handlers
function setupBotHandlers() {
    if (!bot) return


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

    // ==================== COMMANDS ====================

    // /start command
    bot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id
        const username = msg.from?.username

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

        // Check if client already exists
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
            `Utilisez /nouvellelivraison et suivez les étapes:\n` +
            `• Votre nom\n` +
            `• Votre numéro de téléphone\n` +
            `• L'adresse de livraison\n` +
            `• Les produits à livrer\n` +
            `• Instructions spéciales (optionnel)\n\n` +
            `*2. Suivre vos livraisons*\n` +
            `Utilisez /meslivraisons pour voir l'état de toutes vos demandes.\n\n` +
            `*3. Notifications automatiques*\n` +
            `Vous recevrez automatiquement:\n` +
            `• Une estimation du temps de livraison (ETA)\n` +
            `• Des mises à jour de statut\n` +
            `• Un compte-rendu avec photo et localisation GPS à la livraison`,
            { parse_mode: 'Markdown' }
        )
    })

    // /nouvellelivraison command
    bot.onText(/\/nouvellelivraison/, async (msg) => {
        const chatId = msg.chat.id

        // Initialize conversation
        conversations.set(chatId, {
            step: 'name',
            data: {}
        })

        await bot.sendMessage(
            chatId,
            `📦 *Nouvelle demande de livraison*\n\n` +
            `Commençons! Quel est votre nom complet?`,
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
                    `Vous n'avez aucune livraison pour le moment.\n\n` +
                    `Utilisez /nouvellelivraison pour créer votre première demande.`
                )
                return
            }

            let message = `📋 *Vos livraisons*\n\n`

            for (const delivery of client.deliveries) {
                const statusEmoji = getStatusEmoji(delivery.status)
                const statusText = getStatusText(delivery.status)

                const items = delivery.items
                    .map(item => `${item.quantity}x ${item.product.name}`)
                    .join(', ')

                message += `${statusEmoji} *${statusText}*\n`
                message += `📍 ${delivery.deliveryAddress}\n`
                message += `📦 ${items}\n`
                message += `🕐 Créée le ${new Date(delivery.createdAt).toLocaleDateString('fr-FR')}\n`

                if (delivery.estimatedDeliveryTime) {
                    message += `⏰ ETA: ${new Date(delivery.estimatedDeliveryTime).toLocaleString('fr-FR')}\n`
                }

                message += `\n`
            }

            await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
        } catch (error) {
            console.error('Error fetching deliveries:', error)
            await bot.sendMessage(
                chatId,
                `❌ Erreur lors de la récupération de vos livraisons. Veuillez réessayer.`
            )
        }
    })

    // ==================== MESSAGE HANDLER ====================

    bot.on('message', async (msg) => {
        const chatId = msg.chat.id
        const text = msg.text

        // Ignore commands
        if (text?.startsWith('/')) return

        const conversation = conversations.get(chatId)
        if (!conversation) return

        try {
            switch (conversation.step) {
                case 'name':
                    conversation.data.name = text
                    conversation.step = 'phone'
                    await bot.sendMessage(
                        chatId,
                        `Merci ${text}! 📱\n\nQuel est votre numéro de téléphone?`
                    )
                    break

                case 'phone':
                    conversation.data.phone = text
                    conversation.step = 'address'
                    await bot.sendMessage(
                        chatId,
                        `Parfait! 📍\n\nQuelle est l'adresse de livraison complète?`
                    )
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
            console.error('Error handling message:', error)
            await bot.sendMessage(
                chatId,
                `❌ Une erreur s'est produite. Veuillez réessayer avec /nouvellelivraison`
            )
            conversations.delete(chatId)
        }
    })

    // ==================== HELPER FUNCTIONS ====================

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

            // Send confirmation with ETA
            await sendETANotification(chatId.toString(), delivery)

            await bot.sendMessage(
                chatId,
                `✅ *Demande créée avec succès!*\n\n` +
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

    function getStatusEmoji(status: string): string {
        const emojis: Record<string, string> = {
            PENDING: '⏳',
            ASSIGNED: '👤',
            IN_TRANSIT: '🚚',
            DELIVERED: '✅',
            CANCELLED: '❌',
            PROBLEM: '⚠️',
            HIDDEN: '📦'
        }
        return emojis[status] || '📋'
    }

    function getStatusText(status: string): string {
        const texts: Record<string, string> = {
            PENDING: 'En attente',
            ASSIGNED: 'Assignée',
            IN_TRANSIT: 'En cours',
            DELIVERED: 'Livrée',
            CANCELLED: 'Annulée',
            PROBLEM: 'Problème',
            HIDDEN: 'Cachée'
        }
        return texts[status] || status
    }
}

// Initialize bot handlers when module is first loaded
// This ensures the bot is ready when needed
if (bot) {
    setupBotHandlers()
}

// Export the ensureBotInitialized function as default
export default ensureBotInitialized
