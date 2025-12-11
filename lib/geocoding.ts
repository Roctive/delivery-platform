/**
 * Geocoding utilities using OpenStreetMap Nominatim API
 * Free geocoding service for converting addresses to coordinates
 */

export interface Coordinates {
    latitude: number
    longitude: number
}

/**
 * Convert an address to GPS coordinates using Nominatim
 */
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
    try {
        const encodedAddress = encodeURIComponent(address)
        const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodedAddress}&limit=1`,
            {
                headers: {
                    'User-Agent': 'DeliveryPlatform/1.0' // Required by Nominatim
                }
            }
        )

        if (!response.ok) {
            console.error('Geocoding failed:', response.statusText)
            return null
        }

        const data = await response.json()
        
        if (data.length === 0) {
            console.error('No results found for address:', address)
            return null
        }

        return {
            latitude: parseFloat(data[0].lat),
            longitude: parseFloat(data[0].lon)
        }
    } catch (error) {
        console.error('Geocoding error:', error)
        return null
    }
}

/**
 * Calculate distance between two GPS coordinates using Haversine formula
 * Returns distance in meters
 */
export function calculateDistance(
    coord1: Coordinates,
    coord2: Coordinates
): number {
    const R = 6371e3 // Earth's radius in meters
    const φ1 = (coord1.latitude * Math.PI) / 180
    const φ2 = (coord2.latitude * Math.PI) / 180
    const Δφ = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
    const Δλ = ((coord2.longitude - coord1.longitude) * Math.PI) / 180

    const a =
        Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

    return R * c // Distance in meters
}

/**
 * Validate that a hiding spot is within the maximum allowed distance
 * from the delivery address
 */
export async function validateHidingSpotDistance(
    deliveryAddress: string,
    hidingSpotCoords: Coordinates,
    maxDistanceMeters: number = 200
): Promise<{ valid: boolean; distance: number; error?: string }> {
    // Geocode the delivery address
    const addressCoords = await geocodeAddress(deliveryAddress)
    
    if (!addressCoords) {
        return {
            valid: false,
            distance: 0,
            error: "Impossible de géocoder l'adresse de livraison"
        }
    }

    // Calculate distance
    const distance = calculateDistance(addressCoords, hidingSpotCoords)

    // Validate
    if (distance > maxDistanceMeters) {
        return {
            valid: false,
            distance: Math.round(distance),
            error: `La cachette est trop éloignée (${Math.round(distance)}m). Distance maximale: ${maxDistanceMeters}m`
        }
    }

    return {
        valid: true,
        distance: Math.round(distance)
    }
}
