"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { MoreVertical, Plus } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { format } from "date-fns"

export interface SavedMenu {
  id: string
  name: string
  description: string
  outlets: string[]
  sections: {
    id: string
    name: string
    items: {
      id: string
      name: string
      price: number
      image: string
      dietary?: {
        vegan?: boolean
        glutenFree?: boolean
        seafood?: boolean
      }
    }[]
  }[]
  createdAt: string
  status: "Active" | "Inactive"
}

interface MenuListProps {
  menus: SavedMenu[]
  onDeleteMenu: (id: string) => void
  onCreateNewMenu: () => void
  onContinueDraft: (draft: SavedMenu & { isDraft: boolean; lastStep: number }) => void
  onToggleStatus: (id: string, status: "Active" | "Inactive") => void
}

export function MenuList({ menus, onDeleteMenu, onCreateNewMenu, onContinueDraft, onToggleStatus }: MenuListProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const handleDeleteConfirm = (id: string) => {
    onDeleteMenu(id)
    setConfirmDelete(null)
  }

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return format(date, "dd/MM/yyyy 'at' HH:mmaa")
    } catch (error) {
      return "Invalid date"
    }
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-medium mb-6">Menus</h1>

      <div className="bg-white rounded-md">
        {/* Table header */}
        <div className="grid grid-cols-4 gap-4 px-6 py-3 border-b border-gray-100 text-sm text-gray-500 font-medium">
          <div>Menu name</div>
          <div>Description</div>
          <div>Created on</div>
          <div>Status</div>
        </div>

        {/* Table body */}
        {menus.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No menus found. Create your first menu to get started.</p>
          </div>
        ) : (
          <div>
            {menus.map((menu) => (
              <div
                key={menu.id}
                className="grid grid-cols-4 gap-4 px-6 py-4 border-b border-gray-100 items-center hover:bg-gray-50"
              >
                <div className="font-medium text-gray-900">{menu.name}</div>
                <div className="text-gray-600 truncate">{menu.description || "—"}</div>
                <div className="text-gray-600">{formatDate(menu.createdAt)}</div>
                <div className="flex items-center justify-between">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs ${
                      menu.status === "Active" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {menu.status}
                  </span>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="p-2 hover:bg-gray-100 rounded-full">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      {"isDraft" in menu ? (
                        <DropdownMenuItem onClick={() => onContinueDraft(menu as any)}>
                          Continue editing
                        </DropdownMenuItem>
                      ) : (
                        <>
                          <DropdownMenuItem>Edit</DropdownMenuItem>
                          <DropdownMenuItem>Duplicate</DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onToggleStatus(menu.id, menu.status === "Active" ? "Inactive" : "Active")}
                          >
                            {menu.status === "Active" ? "Deactivate" : "Activate"}
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      {confirmDelete === menu.id ? (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDeleteConfirm(menu.id)}
                        >
                          Confirm delete
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          className="text-red-600 focus:text-red-600"
                          onClick={() => setConfirmDelete(menu.id)}
                        >
                          Delete
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Button onClick={onCreateNewMenu} variant="outline" className="mt-6 flex items-center gap-2">
        <Plus className="h-4 w-4" />
        Create new menu
      </Button>
    </div>
  )
}
