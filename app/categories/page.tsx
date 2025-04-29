"use client"

import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

export default function CategoriesPage() {
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Categories</h1>
          <p className="text-muted-foreground">Organize your menu items into categories</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>

      <div className="text-center py-12 rounded-lg border border-dashed">
        <h2 className="text-xl font-semibold mb-2">No categories created yet</h2>
        <p className="text-muted-foreground mb-6">Create your first category to organize your menu items</p>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Add Category
        </Button>
      </div>
    </div>
  )
}
