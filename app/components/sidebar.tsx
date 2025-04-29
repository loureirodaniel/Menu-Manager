"use client"

import type React from "react"

import { useState, useEffect, createContext, useContext } from "react"
import { cn } from "@/lib/utils"
import {
  ChevronDown,
  ChevronRight,
  Home,
  Settings,
  ShoppingCart,
  Users,
  BarChart2,
  FileText,
  ShoppingBag,
  Package,
  Clipboard,
  Box,
} from "lucide-react"

// Create a context to share the sidebar state
type SidebarContextType = {
  collapsed: boolean
  setCollapsed: (collapsed: boolean) => void
  toggleSidebar: () => void
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined)

// Export a hook to use the sidebar context
export function useSidebar() {
  const context = useContext(SidebarContext)
  if (context === undefined) {
    throw new Error("useSidebar must be used within a SidebarProvider")
  }
  return context
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true)

  const toggleSidebar = () => {
    setCollapsed(!collapsed)
  }

  // Provide the sidebar state and functions through context
  useEffect(() => {
    // Make the sidebar state available globally
    window.sidebarState = {
      collapsed,
      setCollapsed,
      toggleSidebar,
    }
  }, [collapsed])

  return (
    <SidebarContext.Provider value={{ collapsed, setCollapsed, toggleSidebar }}>
      <div
        className={cn(
          "h-screen border-r border-gray-200 bg-white pt-14 flex flex-col transition-all duration-300 ease-in-out",
          collapsed ? "w-16" : "",
        )}
        style={{ width: collapsed ? "" : "300px" }}
      >
        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1">
            <NavItem icon={<Home className="h-5 w-5" />} label="Dashboard" collapsed={collapsed} />
            <NavItem icon={<ShoppingBag className="h-5 w-5" />} label="Admin" collapsed={collapsed} hasDropdown />
            <NavItem icon={<FileText className="h-5 w-5" />} label="Reports" collapsed={collapsed} hasDropdown />
            <NavItem icon={<BarChart2 className="h-5 w-5" />} label="Sales" collapsed={collapsed} hasDropdown />
            <NavItem icon={<Package className="h-5 w-5" />} label="Products" collapsed={collapsed} hasDropdown />
            <NavItem icon={<Clipboard className="h-5 w-5" />} label="Menus" collapsed={collapsed} active />
            <NavItem icon={<ShoppingCart className="h-5 w-5" />} label="Webshop" collapsed={collapsed} hasDropdown />
            <NavItem icon={<Box className="h-5 w-5" />} label="Inventory" collapsed={collapsed} />
            <NavItem icon={<Users className="h-5 w-5" />} label="Customers" collapsed={collapsed} hasDropdown />
            <NavItem icon={<Settings className="h-5 w-5" />} label="Settings" collapsed={collapsed} hasDropdown />
          </ul>
        </nav>

        {/* User Profile */}
        <div className="border-t border-gray-200 p-4">
          <div className="flex items-center">
            <div
              className={cn(
                "h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600",
                collapsed ? "mx-auto" : "mr-3",
              )}
            >
              <span className="text-sm font-medium">D</span>
            </div>
            {!collapsed && (
              <>
                <div className="flex-1">
                  <p className="text-sm text-gray-700">daniel.loureiro</p>
                </div>
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </>
            )}
          </div>
        </div>
      </div>
    </SidebarContext.Provider>
  )
}

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active?: boolean
  hasDropdown?: boolean
  collapsed: boolean
}

function NavItem({ icon, label, active, hasDropdown, collapsed }: NavItemProps) {
  return (
    <li>
      <a
        href="#"
        className={cn(
          "flex items-center px-4 py-2.5 text-sm font-medium",
          active ? "bg-indigo-50 text-indigo-700" : "text-gray-700 hover:bg-gray-100",
          collapsed && "justify-center",
        )}
      >
        <span className={cn("", collapsed ? "mr-0" : "mr-3")}>{icon}</span>
        {!collapsed && (
          <>
            <span className="flex-1">{label}</span>
            {hasDropdown && <ChevronDown className="h-4 w-4 text-gray-400" />}
          </>
        )}
      </a>
    </li>
  )
}
