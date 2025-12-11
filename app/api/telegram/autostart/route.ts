// This file auto-starts the Telegram bot when the server starts
import bot from '@/lib/telegram-bot-simple'

export const dynamic = 'force-dynamic'

export async function GET() {
    if (bot) {
        console.log('✅ Telegram bot is running')
        return new Response('Telegram bot is running', { status: 200 })
    } else {
        return new Response('Failed to initialize bot', { status: 500 })
    }
}
