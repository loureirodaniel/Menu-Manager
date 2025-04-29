"use client"

import type React from "react"
import ProductSidepanelContent from "./product-sidepanel-content"

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
  addedProducts: string[]
}

export function ProductSidepanel({
  products,
  onAddProducts,
  selectedProducts,
  setSelectedProducts,
  addedProducts,
}: ProductSidepanelProps) {
  const handleAddSelected = () => {
    onAddProducts(selectedProducts)
    setSelectedProducts([])
  }

  return (
    <ProductSidepanelContent
      products={products.filter((p) => !addedProducts.includes(p.id))}
      selectedProducts={selectedProducts}
      setSelectedProducts={setSelectedProducts}
      onAddProducts={handleAddSelected}
    />
  )
}

