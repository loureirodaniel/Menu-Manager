"use client"

import { useState } from "react"
import { Menu, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TopBarProps {
  onMenuClick: () => void
}

export function TopBar({ onMenuClick }: TopBarProps) {
  const [searchValue, setSearchValue] = useState("")

  return (
    <div className="h-14 border-b border-gray-200 bg-gray-50 flex items-center px-4 fixed top-0 left-0 right-0 z-50">
      <button
        onClick={onMenuClick}
        className="p-2 rounded-md hover:bg-gray-200 transition-colors mr-4"
        aria-label="Toggle menu"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      <div className="flex items-center">
        <span className="font-bold text-xl tracking-tight">MEWS</span>
      </div>

      <div className="flex-1 max-w-md mx-auto">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="search"
            placeholder="Search"
            className={cn("pl-10 bg-white border-gray-200", "focus-visible:ring-gray-300 focus-visible:ring-1")}
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
          />
        </div>
      </div>

      <div className="ml-4">
        <div className="h-8 w-8 rounded-full bg-pink-100 border border-pink-200 flex items-center justify-center overflow-hidden">
          <img src="/mystical-forest-spirit.png" alt="User avatar" className="h-full w-full object-cover" />
        </div>
      </div>
    </div>
  )
}
