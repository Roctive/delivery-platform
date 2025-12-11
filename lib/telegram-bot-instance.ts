import TelegramBot from 'node-telegram-bot-api'

const token = process.env.TELEGRAM_BOT_TOKEN!

let botInstance: TelegramBot | null = null

export function getBotInstance(): TelegramBot | null {
    if (!token) {
        console.warn('TELEGRAM_BOT_TOKEN not defined')
        return null
    }

    if (!botInstance) {
        botInstance = new TelegramBot(token, { polling: false })
    }

    return botInstance
}

export function initializeBotWithPolling(): TelegramBot | null {
    if (!token) {
        throw new Error('TELEGRAM_BOT_TOKEN must be defined in environment variables')
    }

    if (botInstance) {
        // If bot exists but polling is not active, start it
        if (!botInstance.isPolling()) {
            botInstance.startPolling()
            console.log('✅ Telegram bot polling started')
        }
        return botInstance
    }

    botInstance = new TelegramBot(token, { polling: true })
    console.log('✅ Telegram bot initialized with polling')

    return botInstance
}
