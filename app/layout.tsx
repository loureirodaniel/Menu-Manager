import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Sidebar } from "./components/sidebar"
import { TopBar } from "./components/top-bar"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Menu Manager",
  description: "Create and manage your restaurant menus",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="flex flex-col h-screen">
          <TopBar
            onMenuClick={() => {
              // Access the sidebar state through the window object
              if (typeof window !== "undefined" && window.sidebarState) {
                window.sidebarState.toggleSidebar()
              }
            }}
          />
          <div className="flex flex-1 overflow-hidden pt-14">
            {" "}
            {/* Add pt-14 to create space for the top bar */}
            <Sidebar />
            <main className="flex-1 overflow-auto">{children}</main>
          </div>
        </div>
      </body>
    </html>
  )
}
