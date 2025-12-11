"use client"

import { getTimeRemaining } from "@/lib/utils"

export function TimeRemaining({ maxDeliveryTime }: { maxDeliveryTime: Date | string }) {
    const date = new Date(maxDeliveryTime)
    const remaining = getTimeRemaining(date)
    const isUrgent = remaining < 15

    return (
        <div className={`text-xs font-medium ${isUrgent ? 'text-red-600' : 'text-green-600'}`}>
            {remaining} min restantes
        </div>
    )
}
