"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import type { SavedMenu } from "@/app/components/menu-list"

export default function EditMenuPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [menu, setMenu] = useState<SavedMenu | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Load saved menus from localStorage
    const savedMenusFromStorage = localStorage.getItem("savedMenus")
    if (savedMenusFromStorage) {
      const menus = JSON.parse(savedMenusFromStorage) as SavedMenu[]
      const foundMenu = menus.find((m) => m.id === params.id)

      if (foundMenu) {
        setMenu(foundMenu)
      } else {
        // Menu not found, redirect to list
        router.push("/")
      }
    } else {
      // No menus saved, redirect to list
      router.push("/")
    }

    setIsLoading(false)
  }, [params.id, router])

  if (isLoading) {
    return <div className="container mx-auto py-8">Loading...</div>
  }

  if (!menu) {
    return <div className="container mx-auto py-8">Menu not found</div>
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <Button variant="outline" asChild>
          <Link href="/">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Menu List
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <h1 className="text-3xl font-bold">{menu.name}</h1>
        <p className="text-muted-foreground">{menu.description}</p>

        <div>
          <h2 className="text-xl font-semibold mb-2">Outlets</h2>
          <ul className="list-disc pl-5">
            {menu.outlets.map((outlet) => (
              <li key={outlet}>{outlet}</li>
            ))}
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">Sections</h2>
          <div className="space-y-4">
            {menu.sections.map((section) => (
              <div key={section.id} className="border p-4 rounded-lg">
                <h3 className="font-medium text-lg">{section.name}</h3>
                <p className="text-sm text-muted-foreground">{section.items.length} products</p>
              </div>
            ))}
          </div>
        </div>

        <div className="text-sm text-muted-foreground">Created on {new Date(menu.createdAt).toLocaleDateString()}</div>
      </div>

      <div className="mt-8">
        <p className="text-center text-muted-foreground">
          This is a placeholder for the edit functionality. In a real application, you would implement the full menu
          editing experience here.
        </p>
      </div>
    </div>
  )
}

