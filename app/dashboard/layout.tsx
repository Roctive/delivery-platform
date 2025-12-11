import { SessionProvider } from "next-auth/react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"

export default function Layout({ children }: { children: React.ReactNode }) {
    return (
        <SessionProvider>
            <DashboardLayout>
                {children}
            </DashboardLayout>
        </SessionProvider>
    )
}
