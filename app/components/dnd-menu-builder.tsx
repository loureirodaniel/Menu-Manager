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
import { Leaf, Wheat, Fish } from "lucide-react"

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

// Draggable Product Item Component
function DraggableProductItem({ product }: { product: Product }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: product.id,
    data: {
      product,
      type: "product",
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
    </div>
  )
}

// Droppable Section Component
function DroppableSection({
  section,
  onProductDrop,
}: {
  section: MenuSection
  onProductDrop: (sectionId: string, product: Product) => void
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: "section",
      accepts: "product",
    },
  })

  return (
    <div
      ref={setNodeRef}
      data-droppable="true"
      data-over={isOver}
      id={section.id}
      className={`drop-zone ${isOver ? "active" : ""} p-4 rounded-lg border-2 border-dashed`}
    >
      <h3 className="font-medium mb-3">{section.name}</h3>
      <div className="space-y-2">
        {section.items.map((product) => (
          <DraggableProductItem key={`${section.id}-${product.id}`} product={product} />
        ))}
        {section.items.length === 0 && <div className="text-center py-8 text-muted-foreground">Drag products here</div>}
      </div>
    </div>
  )
}

// Product Sidebar Component
function ProductSidebar({
  products,
  title = "Available Products",
}: {
  products: Product[]
  title?: string
}) {
  return (
    <div className="bg-gray-50 p-4 rounded-lg border">
      <h3 className="font-medium mb-3">{title}</h3>
      <div className="space-y-2">
        {products.map((product) => (
          <DraggableProductItem key={product.id} product={product} />
        ))}
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
export default function DndMenuBuilder({
  availableProducts,
  sections,
  onSectionUpdate,
}: {
  availableProducts: Product[]
  sections: MenuSection[]
  onSectionUpdate: (updatedSections: MenuSection[]) => void
}) {
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

    if (activeData && activeData.product) {
      setActiveProduct(activeData.product)
      document.body.classList.add("is-dragging")
      document.body.classList.add("is-dragging-active")
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

    // Reset active product
    setActiveProduct(null)
    setCollisions([])

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeData = active.data.current

    if (!activeData || !activeData.product) return

    const { product } = activeData

    // Find the section that was dropped on
    const targetSection = sections.find((section) => section.id === overId)

    if (targetSection) {
      // Check if product is already in any section
      const productInSections = sections.some((section) => section.items.some((item) => item.id === product.id))

      // Update sections
      const updatedSections = sections.map((section) => {
        if (section.id === overId) {
          // Don't add duplicate products
          if (section.items.some((item) => item.id === product.id)) {
            return section
          }
          return {
            ...section,
            items: [...section.items, product],
          }
        }
        // If product was moved from another section, remove it
        if (productInSections) {
          return {
            ...section,
            items: section.items.filter((item) => item.id !== product.id),
          }
        }
        return section
      })

      onSectionUpdate(updatedSections)
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
          <h2 className="text-xl font-bold">Menu Builder</h2>
          <button onClick={() => setDebugMode(!debugMode)} className="px-3 py-1 bg-gray-200 rounded-md text-sm">
            {debugMode ? "Hide Debug" : "Show Debug"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1">
            <ProductSidebar products={availableProducts} />
          </div>

          <div className="md:col-span-2 space-y-6">
            {sections.map((section) => (
              <DroppableSection
                key={section.id}
                section={section}
                onProductDrop={(sectionId, product) => {
                  const updatedSections = sections.map((s) => {
                    if (s.id === sectionId) {
                      return {
                        ...s,
                        items: [...s.items, product],
                      }
                    }
                    return s
                  })
                  onSectionUpdate(updatedSections)
                }}
              />
            ))}
          </div>
        </div>

        {/* Drag overlay - what appears under the cursor while dragging */}
        <DragOverlay>{activeProduct && <ProductDragOverlay product={activeProduct} />}</DragOverlay>

        {/* Debug overlay */}
        <CollisionDebugOverlay active={debugMode} collisions={collisions} />
      </div>
    </DndContext>
  )
}

