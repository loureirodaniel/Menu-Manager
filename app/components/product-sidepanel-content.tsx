"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Filter } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProductItem from "./product-item"
import { Button } from "@/components/ui/button"

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

interface ProductSidepanelContentProps {
  products: Product[]
  selectedProducts: string[]
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>
  onAddProducts: () => void
  allSelectedProducts?: Product[]
}

export default function ProductSidepanelContent({
  products = [], // Provide default empty array
  selectedProducts = [], // Provide default empty array
  setSelectedProducts,
  onAddProducts,
}: ProductSidepanelContentProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [isDragging, setIsDragging] = useState(false)

  // Listen for global drag events to detect when a product is being dragged
  useEffect(() => {
    const handleDragStart = () => {
      if (document.body.classList.contains("is-dragging-product")) {
        setIsDragging(true)
      }
    }

    const handleDragEnd = () => {
      setIsDragging(false)
    }

    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragend", handleDragEnd)

    // Also listen for DnD-kit specific classes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const body = document.body
          const isDraggingProduct = body.classList.contains("is-dragging-product")

          // Only update state if it's actually changing
          if (isDraggingProduct && !isDragging) {
            setIsDragging(true)
          } else if (!isDraggingProduct && isDragging) {
            setIsDragging(false)
          }
        }
      })
    })

    observer.observe(document.body, { attributes: true })

    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragend", handleDragEnd)
      observer.disconnect()
    }
  }, [isDragging])

  // Add this after the existing useEffect hooks
  useEffect(() => {
    // Add a global event listener to constrain drag movement
    const handleDragMove = (e: any) => {
      if (isDragging) {
        // Use a data attribute selector instead of class with square brackets
        const sidepanelRect = document.querySelector("[data-sidepanel='true']")?.getBoundingClientRect()
        if (sidepanelRect && e.clientX > sidepanelRect.right + 50) {
          // Prevent the default behavior to stop the drag
          e.preventDefault()
          e.stopPropagation()
        }
      }
    }

    document.addEventListener("mousemove", handleDragMove)
    document.addEventListener("touchmove", handleDragMove, { passive: false })

    return () => {
      document.removeEventListener("mousemove", handleDragMove)
      document.removeEventListener("touchmove", handleDragMove)
    }
  }, [isDragging])

  // Ensure products is always an array
  const safeProducts = Array.isArray(products) ? products : []

  const filteredProducts = safeProducts.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedProducts((prev) => {
      const safeArray = Array.isArray(prev) ? prev : []
      if (isSelected) {
        return [...safeArray, id]
      } else {
        return safeArray.filter((productId) => productId !== id)
      }
    })
  }

  const handleAddSelected = () => {
    onAddProducts()
  }

  const handleClearSelection = () => {
    setSelectedProducts([])
  }

  // Ensure selectedProducts is always an array
  const safeSelectedProducts = Array.isArray(selectedProducts) ? selectedProducts : []

  // Calculate allSelectedProducts safely
  const allSelectedProducts =
    Array.isArray(safeSelectedProducts) && safeSelectedProducts.length > 1 && Array.isArray(safeProducts)
      ? safeProducts.filter(
          (p) => p && p.id && Array.isArray(safeSelectedProducts) && safeSelectedProducts.includes(p.id),
        )
      : []

  return (
    <div
      className="w-[400px] bg-background fixed right-0 top-0 bottom-0 border-l shadow-sm flex flex-col h-full"
      data-sidepanel="true"
    >
      <div className="p-6 flex flex-col h-full pt-10">
        {" "}
        {/* Further reduced padding to account for the top bar */}
        <div className="space-y-4 flex-shrink-0">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
          </div>

          <div className="relative">
            <Input
              placeholder="Search products"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pr-8"
            />
            <Filter className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          </div>

          {safeSelectedProducts.length > 0 && (
            <div
              className={`p-3 mb-4 rounded-lg flex items-center justify-between ${safeSelectedProducts.length > 0 ? "multi-select-active" : "bg-muted/50"}`}
            >
              <div className="font-medium">
                {safeSelectedProducts.length} {safeSelectedProducts.length === 1 ? "item" : "items"} selected
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleClearSelection}>
                  Cancel
                </Button>
                <Button size="sm" onClick={handleAddSelected}>
                  Add
                </Button>
              </div>
            </div>
          )}
        </div>
        <ScrollArea className="flex-grow overflow-y-auto pr-4 -mr-4">
          <div className="space-y-2 py-4 pb-0">
            {filteredProducts.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                isSelected={Boolean(
                  Array.isArray(safeSelectedProducts) &&
                    safeSelectedProducts &&
                    product &&
                    product.id &&
                    safeSelectedProducts.includes(product.id),
                )}
                onSelect={handleSelect}
                isDraggable={true}
                selectedProductIds={safeSelectedProducts}
                allProducts={safeProducts}
                allSelectedProducts={allSelectedProducts}
              />
            ))}
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
