"use client"

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

const hidingSpotIcon = L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
})

interface HidingSpotMapProps {
    latitude: number
    longitude: number
    photoUrl: string
}

export default function HidingSpotMap({ latitude, longitude, photoUrl }: HidingSpotMapProps) {
    const position: [number, number] = [latitude, longitude]

    return (
        <div className="h-96 w-full z-0 rounded-lg overflow-hidden">
            <MapContainer
                center={position}
                zoom={17}
                style={{ height: "100%", width: "100%" }}
                scrollWheelZoom={false}
            >
                <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                <Marker position={position} icon={hidingSpotIcon}>
                    <Popup>
                        <div className="text-sm">
                            <p className="font-semibold text-green-600 mb-2">📦 Votre colis est ici</p>
                            <img
                                src={photoUrl}
                                alt="Cachette"
                                className="w-48 h-32 object-cover rounded mb-2"
                            />
                            <p className="text-xs text-slate-600">
                                Lat: {latitude.toFixed(6)}<br />
                                Lon: {longitude.toFixed(6)}
                            </p>
                        </div>
                    </Popup>
                </Marker>
            </MapContainer>
        </div>
    )
}
