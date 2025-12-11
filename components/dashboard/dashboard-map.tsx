"use client"

import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { Delivery, User as UserType, Client } from "@prisma/client"

// Fix for default marker icons
const pickupIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-180' // Blue tint for pickup
})

const deliveryIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
    className: 'hue-rotate-90' // Green tint for delivery
})

type DeliveryWithRelations = Delivery & {
    driver: UserType | null
    client: Client | null
    items?: Array<{
        id: string
        quantity: number
        product?: {
            name: string
            unit: string
        } | null
    }>
}

interface DashboardMapProps {
    deliveries: DeliveryWithRelations[]
}

// Simple geocoding approximation for Toulouse addresses
// In production, you would use a real geocoding service
function getCoordinatesFromAddress(address: string | null | undefined): [number, number] {
    // Toulouse center coordinates
    const baseCoords: [number, number] = [43.6047, 1.4442]

    // Return base coords if address is not provided
    if (!address) {
        return baseCoords
    }

    // Add some variation based on address hash to spread markers
    const hash = address.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const latOffset = ((hash % 100) - 50) * 0.002 // ~±0.1 degree variation
    const lngOffset = ((hash % 200) - 100) * 0.002

    return [baseCoords[0] + latOffset, baseCoords[1] + lngOffset]
}

export default function DashboardMap({ deliveries }: DashboardMapProps) {
    // Toulouse center coordinates
    const center: [number, number] = [43.6047, 1.4442]

    // Filter only active deliveries (not delivered or cancelled)
    const activeDeliveries = deliveries.filter(d =>
        d.status !== 'DELIVERED' && d.status !== 'CANCELLED'
    )

    return (
        <div className="h-[500px] w-full z-0 rounded-lg overflow-hidden">
            <MapContainer
                center={center}
                zoom={13}
                style={{ height: '100%', width: '100%' }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />

                {activeDeliveries.map((delivery) => {
                    const deliveryCoords = getCoordinatesFromAddress(delivery.deliveryAddress)

                    return (
                        <Marker key={delivery.id} position={deliveryCoords} icon={deliveryIcon}>
                            <Popup>
                                <div className="text-sm">
                                    <p className="font-semibold text-green-600">🎯 Livraison</p>
                                    <p className="font-medium mt-1">{delivery.clientName}</p>
                                    <p className="text-xs text-slate-600 mt-1">{delivery.deliveryAddress || "Adresse non spécifiée"}</p>
                                    {delivery.items && delivery.items.length > 0 && (
                                        <div className="text-xs text-slate-500 mt-1">
                                            <p className="font-medium">Produits:</p>
                                            {delivery.items.map((item: any, idx: number) => (
                                                <p key={idx}>• {item.product?.name || "Produit"} x{item.quantity}</p>
                                            ))}
                                        </div>
                                    )}
                                    {delivery.driver && (
                                        <p className="text-xs text-green-600 mt-1">👤 {delivery.driver.name}</p>
                                    )}
                                    <p className={`text-xs mt-1 font-medium ${delivery.status === 'PENDING' ? 'text-yellow-600' :
                                        delivery.status === 'ASSIGNED' ? 'text-blue-600' :
                                            delivery.status === 'IN_TRANSIT' ? 'text-purple-600' :
                                                delivery.status === 'HIDDEN' ? 'text-green-600' :
                                                    'text-slate-600'
                                        }`}>
                                        {delivery.status === 'PENDING' && '⏳ En attente'}
                                        {delivery.status === 'ASSIGNED' && '📋 Assignée'}
                                        {delivery.status === 'IN_TRANSIT' && '🚚 En cours'}
                                        {delivery.status === 'HIDDEN' && '📦 Cachée'}
                                    </p>
                                </div>
                            </Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
        </div>
    )
}
