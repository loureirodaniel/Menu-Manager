"use client"

import type React from "react"
import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Filter } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import ProductItem from "./product-item"

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
  products,
  selectedProducts,
  setSelectedProducts,
  onAddProducts,
}: ProductSidepanelContentProps) {
  const [searchTerm, setSearchTerm] = useState("")

  const filteredProducts = products.filter((product) => product.name.toLowerCase().includes(searchTerm.toLowerCase()))

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedProducts((prev) => {
      if (isSelected) {
        return [...prev, id]
      } else {
        return prev.filter((productId) => productId !== id)
      }
    })
  }

  const handleAddSelected = () => {
    onAddProducts()
  }

  const handleClearSelection = () => {
    setSelectedProducts([])
  }

  return (
    <div className="w-[468px] bg-background h-screen border-l relative">
      <div className="p-6 flex flex-col h-full">
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Products</h2>
            <p className="text-sm text-muted-foreground">
              Select products and click "Add" to include them in your menu or drag them directly to a section.
            </p>
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
        </div>

        <ScrollArea className="flex-1 -mx-6 px-6">
          <div className="space-y-2 py-4">
            {filteredProducts.map((product) => (
              <ProductItem
                key={product.id}
                product={product}
                isSelected={selectedProducts.includes(product.id)}
                onSelect={handleSelect}
                isDraggable={true}
                allSelectedProducts={
                  selectedProducts.length > 1 ? products.filter((p) => selectedProducts.includes(p.id)) : undefined
                }
              />
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-between items-center pt-4 mt-4 border-t">
          <Button variant="ghost" onClick={handleClearSelection} disabled={selectedProducts.length === 0}>
            Clear Selection
          </Button>
          <Button onClick={handleAddSelected} disabled={selectedProducts.length === 0}>
            Add items {selectedProducts.length > 0 ? `(${selectedProducts.length})` : ""}
          </Button>
        </div>
      </div>
    </div>
  )
}

