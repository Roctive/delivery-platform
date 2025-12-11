import prisma from './prisma'
import { getBotInstance } from './telegram-bot-instance'

// ==================== NOTIFICATION FUNCTIONS ====================

export async function sendETANotification(chatId: string, delivery: any) {
    const bot = getBotInstance()
    if (!bot) return

    try {
        const items = delivery.items
            .map((item: any) => `${item.quantity}x ${item.product.name}`)
            .join(', ')

        const eta = delivery.estimatedDeliveryTime
            ? new Date(delivery.estimatedDeliveryTime).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            })
            : 'À déterminer'

        const message =
            `🚚 *Nouvelle livraison confirmée!*\n\n` +
            `📦 Produits: ${items}\n` +
            `📍 Adresse: ${delivery.deliveryAddress}\n` +
            `⏰ *Estimation de livraison: ${eta}*\n\n` +
            `Vous recevrez une notification quand le livreur sera en route!`

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })

        // Mark notification as sent
        await prisma.delivery.update({
            where: { id: delivery.id },
            data: { telegramNotificationSent: true }
        })
    } catch (error) {
        console.error('Error sending ETA notification:', error)
    }
}

export async function sendDeliveryReport(
    chatId: string,
    delivery: any,
    hidingSpot: any
) {
    const bot = getBotInstance()
    if (!bot) return

    try {
        const items = delivery.items
            .map((item: any) => `${item.quantity}x ${item.product.name}`)
            .join(', ')

        const message =
            `✅ *Livraison terminée!*\n\n` +
            `📦 Produits: ${items}\n` +
            `📍 Adresse: ${delivery.deliveryAddress}\n` +
            `📏 Distance du point de dépôt: ${hidingSpot.distanceFromAddress.toFixed(1)}m\n\n` +
            `${hidingSpot.description || 'Voir la photo et la localisation ci-dessous.'}`

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })

        // Send photo if available
        if (hidingSpot.photoUrl) {
            // Check if it's a local file path or URL
            if (hidingSpot.photoUrl.startsWith('http')) {
                await bot.sendPhoto(chatId, hidingSpot.photoUrl, {
                    caption: '📸 Photo du point de dépôt'
                })
            } else {
                // For local files, we need to read and send as stream
                const fs = await import('fs')
                const path = await import('path')
                const photoPath = path.join(process.cwd(), 'public', hidingSpot.photoUrl)

                if (fs.existsSync(photoPath)) {
                    await bot.sendPhoto(chatId, photoPath, {
                        caption: '📸 Photo du point de dépôt'
                    })
                }
            }
        }

        // Send location
        await bot.sendLocation(chatId, hidingSpot.latitude, hidingSpot.longitude)

        await bot.sendMessage(
            chatId,
            `Merci d'avoir utilisé notre service! 🙏\n\n` +
            `Utilisez /nouvellelivraison pour une nouvelle demande.`
        )
    } catch (error) {
        console.error('Error sending delivery report:', error)
    }
}

export async function sendStatusUpdate(chatId: string, delivery: any) {
    const bot = getBotInstance()
    if (!bot) return

    try {
        const statusEmojis: Record<string, string> = {
            PENDING: '⏳',
            ASSIGNED: '👤',
            IN_TRANSIT: '🚚',
            DELIVERED: '✅',
            CANCELLED: '❌',
            PROBLEM: '⚠️',
            HIDDEN: '📦'
        }

        const statusTexts: Record<string, string> = {
            PENDING: 'En attente d\'attribution',
            ASSIGNED: 'Assignée à un livreur',
            IN_TRANSIT: 'En cours de livraison',
            DELIVERED: 'Livrée avec succès',
            CANCELLED: 'Annulée',
            PROBLEM: 'Problème signalé',
            HIDDEN: 'Cachée (en attente de récupération)'
        }

        const emoji = statusEmojis[delivery.status] || '📋'
        const statusText = statusTexts[delivery.status] || delivery.status

        let message = `${emoji} *Mise à jour de livraison*\n\n`
        message += `Statut: *${statusText}*\n`
        message += `📍 ${delivery.deliveryAddress}\n`

        if (delivery.driver) {
            message += `👤 Livreur: ${delivery.driver.name}\n`
        }

        if (delivery.status === 'IN_TRANSIT' && delivery.estimatedDeliveryTime) {
            const eta = new Date(delivery.estimatedDeliveryTime).toLocaleString('fr-FR', {
                dateStyle: 'short',
                timeStyle: 'short'
            })
            message += `⏰ ETA: ${eta}\n`
        }

        await bot.sendMessage(chatId, message, { parse_mode: 'Markdown' })
    } catch (error) {
        console.error('Error sending status update:', error)
    }
}

export async function sendSimpleMessage(chatId: string, message: string) {
    const bot = getBotInstance()
    if (!bot) return

    try {
        await bot.sendMessage(chatId, message)
    } catch (error) {
        console.error('Error sending simple message:', error)
    }
}
