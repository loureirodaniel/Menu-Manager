"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Edit, Trash2, Plus, Store, FileEdit } from "lucide-react"
import Link from "next/link"

interface Product {
  id: string
  name: string
  price: number
  image: string
  dietary?: {
    vegan?: boolean
    glutenFree?: boolean
    seafood?: boolean
  }
}

interface MenuSection {
  id: string
  name: string
  items: Product[]
}

export interface SavedMenu {
  id: string
  name: string
  description: string
  outlets: string[]
  sections: MenuSection[]
  createdAt: string
}

// Extended interface for draft menus
export interface DraftMenu extends SavedMenu {
  isDraft: boolean
  lastStep: number
}

interface MenuListProps {
  menus: (SavedMenu | DraftMenu)[]
  onDeleteMenu: (id: string) => void
  onCreateNewMenu: () => void
  onContinueDraft?: (draft: DraftMenu) => void
}

export function MenuList({ menus, onDeleteMenu, onCreateNewMenu, onContinueDraft }: MenuListProps) {
  // Separate drafts and completed menus
  const drafts = menus.filter((menu): menu is DraftMenu => "isDraft" in menu && menu.isDraft)
  const completedMenus = menus.filter((menu) => !("isDraft" in menu) || !menu.isDraft)

  return (
    <div className="container mx-auto py-8 mt-8 mb-8 ml-8 mr-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Your Menus</h1>
          <p className="text-muted-foreground">Manage and create menus for your restaurant</p>
        </div>
        {menus.length > 0 && (
          <Button onClick={onCreateNewMenu}>
            <Plus className="mr-2 h-4 w-4" /> Create New Menu
          </Button>
        )}
      </div>

      {/* Show drafts section if there are any */}
      {drafts.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">Drafts</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {drafts.map((draft) => (
              <DraftCard key={draft.id} draft={draft} onDelete={onDeleteMenu} onContinue={onContinueDraft} />
            ))}
          </div>
        </div>
      )}

      {/* Show completed menus or empty state */}
      {completedMenus.length > 0 ? (
        <div>
          {drafts.length > 0 && <h2 className="text-xl font-semibold mb-4">Completed Menus</h2>}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {completedMenus.map((menu) => (
              <MenuCard key={menu.id} menu={menu} onDelete={onDeleteMenu} />
            ))}
          </div>
        </div>
      ) : drafts.length === 0 ? (
        <div
          className="text-center py-12 w-screen rounded-lg"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onCreateNewMenu()
            }
          }}
        >
          <h2 className="text-xl font-semibold mb-2">No menus created yet</h2>
          <p className="text-muted-foreground mb-6 text-center">Create your first menu to get started</p>
          <Button onClick={onCreateNewMenu}>
            <Plus className="mr-2 h-4 w-4" /> Create Menu
          </Button>
        </div>
      ) : null}
    </div>
  )
}

function DraftCard({
  draft,
  onDelete,
  onContinue,
}: {
  draft: DraftMenu
  onDelete: (id: string) => void
  onContinue?: (draft: DraftMenu) => void
}) {
  const totalProducts = draft.sections.reduce((total, section) => total + section.items.length, 0)
  const formattedDate = new Date(draft.createdAt).toLocaleDateString()
  const stepLabels = ["Menu name", "Outlets", "Products"]

  return (
    <Card className="border-dashed border-2 border-primary/30">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{draft.name}</CardTitle>
          <Badge variant="outline" className="bg-primary/10">
            Draft
          </Badge>
        </div>
        <CardDescription>{draft.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Progress</div>
            <div className="text-sm">
              Step {draft.lastStep} of 3: {stepLabels[draft.lastStep - 1]}
            </div>
          </div>
          {draft.outlets.length > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Outlets</div>
              <div className="flex flex-wrap gap-2">
                {draft.outlets.map((outlet) => (
                  <Badge key={outlet} variant="outline" className="flex items-center gap-1">
                    <Store className="h-3 w-3" />
                    {outlet}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {totalProducts > 0 && (
            <div>
              <div className="text-sm font-medium mb-1">Sections</div>
              <div className="text-sm text-muted-foreground">
                {draft.sections.filter((s) => s.items.length > 0).length} sections • {totalProducts} products
              </div>
            </div>
          )}
          <div className="text-xs text-muted-foreground">Last edited on {formattedDate}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="default" size="sm" onClick={() => onContinue?.(draft)}>
          <FileEdit className="mr-2 h-4 w-4" /> Continue Editing
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(draft.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  )
}

function MenuCard({ menu, onDelete }: { menu: SavedMenu; onDelete: (id: string) => void }) {
  const totalProducts = menu.sections.reduce((total, section) => total + section.items.length, 0)
  const formattedDate = new Date(menu.createdAt).toLocaleDateString()

  return (
    <Card>
      <CardHeader>
        <CardTitle>{menu.name}</CardTitle>
        <CardDescription>{menu.description || "No description"}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm font-medium mb-1">Outlets</div>
            <div className="flex flex-wrap gap-2">
              {menu.outlets.map((outlet) => (
                <Badge key={outlet} variant="outline" className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {outlet}
                </Badge>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium mb-1">Sections</div>
            <div className="text-sm text-muted-foreground">
              {menu.sections.length} sections • {totalProducts} products
            </div>
          </div>
          <div className="text-xs text-muted-foreground">Created on {formattedDate}</div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/edit/${menu.id}`}>
            <Edit className="mr-2 h-4 w-4" /> Edit
          </Link>
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDelete(menu.id)}>
          <Trash2 className="mr-2 h-4 w-4" /> Delete
        </Button>
      </CardFooter>
    </Card>
  )
}

