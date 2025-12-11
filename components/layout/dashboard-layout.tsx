"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { signOut, useSession } from "next-auth/react"
import { Button } from "@/components/ui/button"
import {
    Truck,
    Package,
    Users,
    UserCircle,
    Settings,
    LogOut,
    Menu,
    X,
    Home
} from "lucide-react"
import { useState } from "react"

export function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const { data: session } = useSession()
    const [sidebarOpen, setSidebarOpen] = useState(false)

    const isAdmin = session?.user?.role === "ADMIN"

    const adminNavItems = [
        { href: "/dashboard", label: "Tableau de bord", icon: Home },
        { href: "/dashboard/deliveries", label: "Livraisons", icon: Package },
        { href: "/dashboard/drivers", label: "Livreurs", icon: Users },
        { href: "/dashboard/clients", label: "Clients", icon: UserCircle },
        { href: "/dashboard/settings", label: "Paramètres", icon: Settings }
    ]

    const driverNavItems = [
        { href: "/dashboard", label: "Mes missions", icon: Truck },
        { href: "/dashboard/inventory", label: "Mon inventaire", icon: Package },
        { href: "/dashboard/settings", label: "Paramètres", icon: Settings }
    ]

    const navItems = isAdmin ? adminNavItems : driverNavItems

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
            {/* Mobile header */}
            <div className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-xl">
                        🚚
                    </div>
                    <span className="font-bold text-lg">Livraison</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                    {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                </Button>
            </div>

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 bottom-0 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"
                    } lg:translate-x-0`}
            >
                <div className="p-6 border-b border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-2xl">
                            🚚
                        </div>
                        <div>
                            <h1 className="font-bold text-xl">Livraison</h1>
                            <p className="text-xs text-slate-500">Toulouse</p>
                        </div>
                    </div>
                </div>

                <nav className="p-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon
                        const isActive = pathname === item.href

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${isActive
                                    ? "bg-blue-600 text-white shadow-md"
                                    : "text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                    }`}
                            >
                                <Icon size={20} />
                                <span className="font-medium">{item.label}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-800">
                    <div className="mb-3 px-4 py-2 bg-slate-50 dark:bg-slate-800 rounded-lg">
                        <p className="text-xs text-slate-500 mb-1">Connecté en tant que</p>
                        <p className="font-semibold text-sm truncate">{session?.user?.name}</p>
                        <p className="text-xs text-slate-500">{session?.user?.email}</p>
                        <p className="text-xs text-blue-600 font-medium mt-1">
                            {isAdmin ? "👨‍💼 Administrateur" : "🚗 Livreur"}
                        </p>
                    </div>
                    <Button
                        variant="ghost"
                        className="w-full justify-start"
                        onClick={() => signOut({ callbackUrl: "/login" })}
                    >
                        <LogOut size={18} className="mr-2" />
                        Déconnexion
                    </Button>
                </div>
            </aside>

            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-30 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Main content */}
            <main className="lg:ml-64 pt-16 lg:pt-0 min-h-screen">
                <div className="p-6 lg:p-8">
                    {children}
                </div>
            </main>
        </div>
    )
}
