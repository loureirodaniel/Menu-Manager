"use client"
import { Leaf, Wheat, Fish, GripVertical } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { useDraggable } from "@dnd-kit/core"
import { CSS } from "@dnd-kit/utilities"

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

interface ProductItemProps {
  product: Product
  isSelected: boolean
  onSelect: (id: string, isSelected: boolean) => void
  isDraggable?: boolean
  selectedProductIds?: string[]
  allProducts?: Product[]
  allSelectedProducts?: Product[]
}

export default function ProductItem({
  product,
  isSelected,
  onSelect,
  isDraggable = false,
  selectedProductIds,
  allProducts,
  allSelectedProducts,
}: ProductItemProps) {
  // Ensure we have safe values to work with - use explicit null checks
  const safeSelectedProductIds = selectedProductIds && Array.isArray(selectedProductIds) ? selectedProductIds : []
  const safeAllProducts = allProducts && Array.isArray(allProducts) ? allProducts : []
  const safeAllSelectedProducts = allSelectedProducts && Array.isArray(allSelectedProducts) ? allSelectedProducts : []

  // Explicitly check if safeAllSelectedProducts is an array and has length > 1
  const isMultipleSelected = Boolean(
    isSelected &&
      safeAllSelectedProducts &&
      Array.isArray(safeAllSelectedProducts) &&
      safeAllSelectedProducts.length > 1,
  )

  // Use optional chaining for safety
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: product?.id || "unknown",
    data: {
      product,
      type: "product",
      isMultiple: isMultipleSelected,
      // Ensure we're only mapping if it's an array
      selectedProductIds:
        isMultipleSelected && Array.isArray(safeAllSelectedProducts)
          ? safeAllSelectedProducts.map((p) => p?.id || "").filter(Boolean)
          : [],
      selectedProducts: isMultipleSelected ? safeAllSelectedProducts : [],
      allProducts: safeAllProducts,
    },
    disabled: !isDraggable,
    modifiers: [
      // Add a modifier to constrain horizontal movement
      (args) => {
        // Only allow dragging to the left (negative x values)
        // If x is positive (dragging right), set it to 0
        if (args.transform.x > 0) {
          args.transform.x = 0
        }
        return args
      },
    ],
  })

  const style = transform
    ? {
        transform: CSS.Translate.toString(transform),
        // Don't change opacity - we'll handle the ghost effect with CSS classes
        zIndex: isDragging ? 1000 : 1,
      }
    : undefined

  const handleCheckboxChange = (checked: boolean) => {
    if (typeof onSelect === "function") {
      onSelect(product.id, checked)
    }
  }

  return (
    <div
      ref={isDraggable ? setNodeRef : undefined}
      style={style}
      data-dragging={isDragging}
      className={`flex items-center p-4 bg-white border-[1.5px] ${
        Boolean(isSelected) ? "border-primary" : "border-[#DFDFEA]"
      } rounded-lg ${isDraggable ? "draggable-item product-item" : ""} ${isDragging ? "product-ghost" : ""} max-w-[350px]`}
    >
      {isDraggable && (
        <div
          className="flex items-center self-center h-full mr-2 cursor-grab active:cursor-grabbing touch-none"
          {...listeners}
          {...attributes}
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
      )}
      <div className="flex items-center self-center h-full">
        <Checkbox
          id={`checkbox-${product.id}`}
          checked={isSelected}
          onCheckedChange={handleCheckboxChange}
          className="mx-3 text-gray-300 border-gray-300"
        />
      </div>
      <div className="flex-1 flex items-start">
        <img
          src={product.image || "/images/wings.png"}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="flex-1 min-w-0 ml-3">
          <h3 className="font-medium text-base leading-6 truncate">{product.name}</h3>
          <div className="flex gap-1 mt-0.5">
            {product.dietary?.vegan && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Leaf className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {product.dietary?.glutenFree && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Wheat className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            {product.dietary?.seafood && (
              <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                <Fish className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="text-right ml-4">
        <span className="font-medium text-base">{`${product.price.toFixed(2)} €`}</span>
      </div>
    </div>
  )
}
