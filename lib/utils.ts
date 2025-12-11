import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// Format date to French locale
export function formatDate(date: Date): string {
    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

// Calculate time remaining in minutes
export function getTimeRemaining(maxDeliveryTime: Date): number {
    const now = new Date()
    const diff = maxDeliveryTime.getTime() - now.getTime()
    return Math.floor(diff / 1000 / 60) // Convert to minutes
}

// Check if delivery is urgent (< 15 minutes remaining)
export function isDeliveryUrgent(maxDeliveryTime: Date): boolean {
    return getTimeRemaining(maxDeliveryTime) < 15
}

// Calculate max delivery time (now + 30 minutes)
export function calculateMaxDeliveryTime(): Date {
    const now = new Date()
    return new Date(now.getTime() + 30 * 60 * 1000)
}
