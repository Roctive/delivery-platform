import { DeliveryStatus } from '@prisma/client'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
    status: DeliveryStatus
    className?: string
}

const statusConfig = {
    PENDING: {
        label: 'En attente',
        icon: '🟡',
        className: 'status-pending'
    },
    ASSIGNED: {
        label: 'Assignée',
        icon: '🔵',
        className: 'status-assigned'
    },
    PICKING_UP: {
        label: 'Récupération',
        icon: '🟠',
        className: 'status-picking'
    },
    IN_TRANSIT: {
        label: 'En livraison',
        icon: '🔵',
        className: 'status-transit'
    },
    DELIVERED: {
        label: 'Livré',
        icon: '🟢',
        className: 'status-delivered'
    },
    CANCELLED: {
        label: 'Annulé',
        icon: '🔴',
        className: 'status-cancelled'
    },
    PROBLEM: {
        label: 'Problème',
        icon: '🔴',
        className: 'status-problem'
    }
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const config = statusConfig[status]

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold',
                config.className,
                className
            )}
        >
            <span>{config.icon}</span>
            {config.label}
        </span>
    )
}
