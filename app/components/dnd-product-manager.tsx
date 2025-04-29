"use client"

import { useState } from "react"
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  rectIntersection,
  type CollisionDetection,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
  type UniqueIdentifier,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { useDroppable } from "@dnd-kit/core"
import { useDraggable } from "@dnd-kit/core"

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

// Draggable Product Item Component
function DraggableProductItem({ product, isInCart = false }: { product: Product; isInCart?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: isInCart ? `cart-${product.id}` : product.id,
    data: {
      product,
      isInCart,
    },
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 1000 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="draggable-item bg-white border rounded-lg p-4 cursor-grab active:cursor-grabbing"
    >
      <div className="flex items-start">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <span className="font-medium">{product.name}</span>
            <span className="text-sm">{product.price.toFixed(2)} €</span>
          </div>
          <div className="flex gap-1 mt-1">
            {product.dietary?.vegan && (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs">V</span>
              </div>
            )}
            {product.dietary?.glutenFree && (
              <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                <span className="text-xs">G</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Droppable Zone Component
function DroppableZone({
  id,
  items,
  title,
  className = "",
}: {
  id: string
  items: Product[]
  title: string
  className?: string
}) {
  const { setNodeRef, isOver } = useDroppable({
    id,
    data: {
      accepts: "product",
    },
  })

  return (
    <div
      ref={setNodeRef}
      data-droppable="true"
      data-over={isOver}
      className={`drop-zone ${isOver ? "active" : ""} ${className} p-4 rounded-lg border-2 border-dashed`}
    >
      <h3 className="font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {items.map((product) => (
          <DraggableProductItem key={`${id}-${product.id}`} product={product} isInCart={id === "cart"} />
        ))}
        {items.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {id === "cart" ? "Drop items here to add to cart" : "No products available"}
          </div>
        )}
      </div>
    </div>
  )
}

// Drag Overlay Component (what appears while dragging)
function ProductDragOverlay({ product }: { product: Product | null }) {
  if (!product) return null

  return (
    <div className="bg-white border rounded-lg p-4 shadow-lg w-[250px]">
      <div className="flex items-start">
        <img
          src={product.image || "/placeholder.svg"}
          alt={product.name}
          className="w-12 h-12 rounded-lg object-cover"
        />
        <div className="ml-3 flex-1">
          <div className="flex justify-between">
            <span className="font-medium">{product.name}</span>
            <span className="text-sm">{product.price.toFixed(2)} €</span>
          </div>
        </div>
      </div>
    </div>
  )
}

// Debug Overlay to help diagnose collision issues
function CollisionDebugOverlay({
  active,
  collisions,
}: {
  active: boolean
  collisions: { id: UniqueIdentifier; data?: any }[]
}) {
  if (!active) return null

  return (
    <div className="fixed bottom-4 left-4 bg-black/80 text-white p-4 rounded-lg z-50 text-xs font-mono">
      <div>Active Collisions:</div>
      {collisions.length === 0 ? (
        <div className="mt-1">No collisions detected</div>
      ) : (
        collisions.map((collision) => (
          <div key={String(collision.id)} className="mt-1">
            {String(collision.id)}
          </div>
        ))
      )}
    </div>
  )
}

// Main Component
export default function DndProductManager({ products: initialProducts }: { products: Product[] }) {
  const [availableProducts, setAvailableProducts] = useState<Product[]>(initialProducts)
  const [cartItems, setCartItems] = useState<Product[]>([])
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [debugMode, setDebugMode] = useState(false)
  const [collisions, setCollisions] = useState<{ id: UniqueIdentifier; data?: any }[]>([])

  // Configure sensors for drag detection
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // Require a drag distance of 8px before activating
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  // Custom collision detection strategy that combines algorithms
  const customCollisionDetection: CollisionDetection = (args) => {
    // First try rectIntersection (fastest and most accurate for rectangles)
    const rectCollisions = rectIntersection(args)

    if (rectCollisions.length > 0) {
      return rectCollisions
    }

    // Fall back to closestCenter if no rect collisions
    return closestCenter(args)
  }

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const activeData = active.data.current

    if (activeData) {
      setActiveProduct(activeData.product)
      document.body.classList.add("is-dragging")
      document.body.classList.add("is-dragging-active")

      // Add a class to indicate we're in a constrained drag mode
      document.body.classList.add("constrained-drag")
    }
  }

  // Handle drag over for real-time collision feedback
  function handleDragOver(event: DragOverEvent) {
    const { collisions } = event
    setCollisions(collisions || [])
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    document.body.classList.remove("is-dragging")
    document.body.classList.remove("is-dragging-active")
    document.body.classList.remove("constrained-drag")

    // Reset active product
    setActiveProduct(null)
    setCollisions([])

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeData = active.data.current

    if (!activeData) return

    const { product, isInCart } = activeData

    // Handle dropping from available to cart
    if (overId === "cart" && !isInCart) {
      setCartItems((prev) => [...prev, product])
      setAvailableProducts((prev) => prev.filter((p) => p.id !== product.id))
    }

    // Handle dropping from cart back to available
    if (overId === "available" && isInCart) {
      setAvailableProducts((prev) => [...prev, product])
      setCartItems((prev) => prev.filter((p) => p.id !== product.id))
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={customCollisionDetection}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="p-4">
        <div className="flex justify-between mb-4">
          <h2 className="text-xl font-bold">Product Manager</h2>
          <button onClick={() => setDebugMode(!debugMode)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">
            {debugMode ? "Hide Debug" : "Show Debug"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DroppableZone id="available" items={availableProducts} title="Available Products" className="bg-gray-50" />

          <DroppableZone id="cart" items={cartItems} title="Shopping Cart" className="bg-blue-50" />
        </div>

        {/* Drag overlay - what appears under the cursor while dragging */}
        <DragOverlay>{activeProduct && <ProductDragOverlay product={activeProduct} />}</DragOverlay>

        {/* Debug overlay */}
        <CollisionDebugOverlay active={debugMode} collisions={collisions} />
      </div>
    </DndContext>
  )
}
