import { NextResponse } from 'next/server'

// This webhook endpoint is for future use when deploying to production
// For now, we're using polling mode which is simpler for development

export async function POST(request: Request) {
    try {
        const secret = request.headers.get('x-telegram-bot-api-secret-token')

        if (secret !== process.env.TELEGRAM_WEBHOOK_SECRET) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const update = await request.json()

        // In production, you would process the update here
        // For now, the bot uses polling mode
        console.log('Received webhook update:', update)

        return NextResponse.json({ ok: true })
    } catch (error) {
        console.error('Webhook error:', error)
        return NextResponse.json(
            { error: 'Webhook processing failed' },
            { status: 500 }
        )
    }
}
