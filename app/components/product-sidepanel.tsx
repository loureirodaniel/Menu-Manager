"use client"

import type React from "react"
import ProductSidepanelContent from "./product-sidepanel-content"
import { useDroppable } from "@dnd-kit/core"

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

interface ProductSidepanelProps {
  products: Product[]
  onAddProducts: (productIds: string[]) => void
  selectedProducts: string[]
  setSelectedProducts: React.Dispatch<React.SetStateAction<string[]>>
}

export function ProductSidepanel({
  products = [], // Provide default empty array
  onAddProducts,
  selectedProducts = [], // Provide default empty array
  setSelectedProducts,
}: ProductSidepanelProps) {
  // Make the sidepanel a droppable area to handle drops back onto it
  const { setNodeRef: setSidepanelDroppableRef, isOver } = useDroppable({
    id: "product-sidepanel",
    data: {
      type: "product-sidepanel",
      accepts: "product-return",
    },
  })

  const handleAddSelected = () => {
    if (selectedProducts && selectedProducts.length > 0) {
      onAddProducts(selectedProducts)
      setSelectedProducts([])
    }
  }

  return (
    <div
      className={`h-full ${isOver ? "bg-gray-50" : ""}`}
      data-sidepanel="true"
      ref={setSidepanelDroppableRef}
      onDragOver={(e) => {
        // Explicitly prevent default to ensure the browser knows this is a valid drop target
        e.preventDefault()
      }}
    >
      <div className="pt-14">
        {" "}
        {/* Add this wrapper div with pt-14 to match the top bar height */}
        <ProductSidepanelContent
          products={products}
          selectedProducts={selectedProducts}
          setSelectedProducts={setSelectedProducts}
          onAddProducts={handleAddSelected}
        />
      </div>
    </div>
  )
}
