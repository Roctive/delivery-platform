import { NextResponse } from 'next/server'
import ensureBotInitialized from '@/lib/telegram-bot'

// POST endpoint to initialize the Telegram bot
export async function POST(request: Request) {
    try {
        const bot = ensureBotInitialized()

        if (!bot) {
            return NextResponse.json(
                { error: 'TELEGRAM_BOT_TOKEN not configured' },
                { status: 500 }
            )
        }

        // Get bot info to verify connection
        const botInfo = await bot.getMe()

        return NextResponse.json({
            message: 'Telegram bot initialized successfully',
            bot: {
                id: botInfo.id,
                username: botInfo.username,
                firstName: botInfo.first_name
            },
            mode: 'polling'
        })
    } catch (error) {
        console.error('Error initializing Telegram bot:', error)
        return NextResponse.json(
            { error: 'Failed to initialize Telegram bot' },
            { status: 500 }
        )
    }
}

// GET endpoint to check bot status
export async function GET() {
    try {
        const bot = ensureBotInitialized()

        if (!bot) {
            return NextResponse.json(
                { error: 'TELEGRAM_BOT_TOKEN not configured' },
                { status: 500 }
            )
        }

        const botInfo = await bot.getMe()

        return NextResponse.json({
            status: 'active',
            bot: {
                id: botInfo.id,
                username: botInfo.username,
                firstName: botInfo.first_name
            }
        })
    } catch (error) {
        console.error('Error checking bot status:', error)
        return NextResponse.json(
            { error: 'Bot not responding' },
            { status: 500 }
        )
    }
}
