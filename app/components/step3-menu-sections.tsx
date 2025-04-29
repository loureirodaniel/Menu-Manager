"use client"

import { DropdownMenuItem } from "@/components/ui/dropdown-menu"

import { DropdownMenuContent } from "@/components/ui/dropdown-menu"

import { DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

import { DropdownMenu } from "@/components/ui/dropdown-menu"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Edit2,
  Plus,
  GripVertical,
  ChevronDown,
  CheckCircle,
  MoreVertical,
  Trash2,
  Leaf,
  Wheat,
  Fish,
} from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { ProductEditPanel } from "./product-edit-panel"
import { motion, AnimatePresence } from "framer-motion"
import { Checkbox } from "@/components/ui/checkbox"

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

// Interface for drop animation data
interface DropAnimationData {
  sectionId: string
  itemId: string
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
}

interface Step3Props {
  menuData: {
    name: string
    sections: MenuSection[]
  }
  updateMenuData: (data: Partial<{ sections: MenuSection[] }>) => void
  prevStep: () => void
  onRemoveProduct: (sectionId: string, productId: string) => void
  setOpenSectionId: (sectionId: string | null) => void
  onFinish: () => void
  dropAnimationData?: DropAnimationData | null
  currentStep: number
  handleFinishMenu: () => void
}

// Add these type definitions and constants near the top of the file, after the interfaces
// Define an enum for drop positions
enum DropPosition {
  Top = "top",
  Bottom = "bottom",
}

// Constants for the updateDropIndicator function
const DEADZONE_PERCENTAGE = 0.1 // 10% of the section height as deadzone
const DROP_INDICATOR_NOT_FOUND_WARNING = "Section element not found for drop indicator"

// SVG for the drop indicator
const DropIndicatorSVG = () => <div className="h-[2px] w-full bg-primary rounded-full" />

const defaultSections: MenuSection[] = [
  { id: "section-1", name: "Appetizers", items: [] },
  { id: "section-2", name: "Mains", items: [] },
  { id: "section-3", name: "Desserts", items: [] },
  { id: "section-4", name: "Drinks", items: [] },
]

export function Step3MenuSections({
  menuData,
  updateMenuData,
  prevStep,
  onRemoveProduct,
  setOpenSectionId,
  onFinish,
  dropAnimationData,
  currentStep,
  handleFinishMenu,
}: Step3Props) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<{ [sectionId: string]: string[] }>({})
  const [openSections, setOpenSections] = useState<string[]>(["section-1"])
  const [newSectionId, setNewSectionId] = useState<string | null>(null)
  const [scrollContainerRef] = useState<React.RefObject<HTMLDivElement>>(useRef<HTMLDivElement>(null))
  const [isDraggingSection, setIsDraggingSection] = useState(false)
  const [editingProduct, setEditingProduct] = useState<{ product: Product; sectionId: string } | null>(null)
  const [isEditPanelOpen, setIsEditPanelOpen] = useState(false)
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null)
  const [recentlyDroppedSection, setRecentlyDroppedSection] = useState<string | null>(null)
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<{ sectionId: string; itemId: string } | null>(null)
  const [previousSections, setPreviousSections] = useState<MenuSection[]>([])
  const [isDraggingProduct, setIsDraggingProduct] = useState(false)
  const [showDropAnimation, setShowDropAnimation] = useState(false)
  const [hasInitializedSections, setHasInitializedSections] = useState(false) // Track if sections have been initialized
  const [lastAddedItems, setLastAddedItems] = useState<{ [sectionId: string]: string }>({})
  // Update the state type to use the enum
  const [dropPosition, setDropPosition] = useState<DropPosition | null>(null)
  const [activeDropSectionId, setActiveDropSectionId] = useState<string | null>(null)
  const [activeDragSectionId, setActiveDragSectionId] = useState<string | null>(null)
  const [mousePosition, setMousePosition] = useState<{ x: number; y: number } | null>(null)
  const [isScrolled, setIsScrolled] = useState(false)

  // Initialize sections if empty
  useEffect(() => {
    if (!hasInitializedSections && menuData.sections.length === 0) {
      updateMenuData({ sections: defaultSections })
      setHasInitializedSections(true) // Mark sections as initialized
    }
  }, [menuData.sections, updateMenuData, hasInitializedSections])

  // Effect to scroll to newly added section
  useEffect(() => {
    if (newSectionId && scrollContainerRef.current) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        const sectionElement = document.getElementById(`section-${newSectionId}`)
        if (sectionElement && scrollContainerRef.current) {
          sectionElement.scrollIntoView({ behavior: "smooth", block: "start" })
        }
        // Reset the new section ID after scrolling
        setNewSectionId(null)
      }, 100)
    }
  }, [newSectionId])

  // Effect to clear the recently dropped section after a delay
  useEffect(() => {
    if (recentlyDroppedSection) {
      const timer = setTimeout(() => {
        setRecentlyDroppedSection(null)
      }, 2000) // Clear after 2 seconds

      return () => clearTimeout(timer)
    }
  }, [recentlyDroppedSection])

  // Effect to clear the recently added item after a delay
  useEffect(() => {
    if (recentlyAddedItem) {
      const timer = setTimeout(() => {
        setRecentlyAddedItem(null)
      }, 8000) // Clear after 8 seconds

      return () => clearTimeout(timer)
    }
  }, [recentlyAddedItem])

  // Effect to scroll to recently added item
  useEffect(() => {
    if (recentlyAddedItem && scrollContainerRef.current) {
      // Small timeout to ensure the DOM has updated
      setTimeout(() => {
        const itemElement = document.getElementById(`item-${recentlyAddedItem.sectionId}-${recentlyAddedItem.itemId}`)
        if (itemElement) {
          itemElement.scrollIntoView({ behavior: "smooth", block: "center" })
        }
      }, 100)
    }
  }, [recentlyAddedItem])

  // Effect to handle drop animation
  useEffect(() => {
    if (dropAnimationData) {
      setShowDropAnimation(true)

      // Auto-hide the animation after it completes
      const timer = setTimeout(() => {
        setShowDropAnimation(false)
      }, 1000)

      return () => clearTimeout(timer)
    }
  }, [dropAnimationData])

  // Effect to close all accordions when dragging sections
  useEffect(() => {
    if (isDraggingSection && openSections.length > 0) {
      setOpenSections([])
      setOpenSectionId(null)
    }
  }, [isDraggingSection, openSections, setOpenSectionId])

  // Effect to track changes in menuData.sections
  useEffect(() => {
    // This will run whenever menuData.sections changes
    if (previousSections.length > 0) {
      // Find sections that have new items
      menuData.sections.forEach((section) => {
        const prevSection = previousSections.find((s) => s.id === section.id)

        if (prevSection && section.items.length > prevSection.items.length) {
          // Find the new items
          const newItems = section.items.filter(
            (item) => !prevSection.items.some((prevItem) => prevItem.id === item.id),
          )

          if (newItems.length > 0) {
            // Set the most recently added item
            const lastNewItem = newItems[newItems.length - 1]

            setRecentlyAddedItem({
              sectionId: section.id,
              itemId: lastNewItem.id,
            })

            // Also set the recently dropped section
            setRecentlyDroppedSection(section.id)

            // Store the last added item for this section
            setLastAddedItems((prev) => ({
              ...prev,
              [section.id]: lastNewItem.id,
            }))
          }
        }
      })
    }

    // Update previous sections for next comparison
    setPreviousSections(menuData.sections)
  }, [menuData.sections])

  // Listen for global drag events to detect when a product is being dragged
  useEffect(() => {
    const handleDragStart = () => {
      if (document.body.classList.contains("is-dragging-product")) {
        setIsDraggingProduct(true)
      }
    }

    const handleDragEnd = () => {
      setIsDraggingProduct(false)
    }

    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragend", handleDragEnd)

    // Also listen for DnD-kit specific classes
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === "class") {
          const body = document.body
          if (body.classList.contains("is-dragging-product")) {
            setIsDraggingProduct(true)
          } else if (!body.classList.contains("is-dragging-product")) {
            setIsDraggingProduct(false)
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
  }, [])

  // Effect to track mouse movement for drop indicators during section dragging
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Always update mouse position
      setMousePosition({ x: e.clientX, y: e.clientY })

      if (isDraggingSection) {
        // Find the section element under the cursor
        const elements = document.elementsFromPoint(e.clientX, e.clientY)
        const sectionElement = elements.find((el) => el.id && el.id.startsWith("section-"))

        if (sectionElement) {
          const sectionId = sectionElement.id.replace("section-", "")

          // Don't show indicator for the section being dragged
          if (sectionId !== activeDragSectionId) {
            updateDropIndicator(sectionId, e.clientY)
          } else {
            // Clear the active drop section when over the dragged section
            setActiveDropSectionId(null)
          }
        }
      }
    }

    document.addEventListener("mousemove", handleGlobalMouseMove)
    return () => {
      document.removeEventListener("mousemove", handleGlobalMouseMove)
    }
  }, [isDraggingSection, activeDragSectionId])

  // Add this function to the Step3MenuSections component to enforce vertical-only movement
  // Add this right after the existing useEffect hooks

  // Add this effect to enforce vertical-only movement during section dragging
  useEffect(() => {
    if (isDraggingSection) {
      // Function to enforce vertical-only movement
      const enforceVerticalOnly = (e: MouseEvent) => {
        // Find the drag overlay element
        const dragOverlay = document.querySelector(".dnd-kit-drag-overlay")
        if (dragOverlay) {
          // Get the current transform
          const transform = window.getComputedStyle(dragOverlay).transform
          const matrix = new DOMMatrix(transform)

          // Extract only the Y translation and apply it back
          const translateY = matrix.m42 // This is the Y translation value

          // Set a CSS variable for the Y translation that our CSS can use
          document.documentElement.style.setProperty("--transform-y", `${translateY}px`)

          // Force the overlay to only move vertically
          dragOverlay.setAttribute(
            "style",
            `
  transform: translateY(${translateY}px) !important;
`,
          )
        }
      }

      // Add the event listener
      document.addEventListener("mousemove", enforceVerticalOnly)

      // Clean up
      return () => {
        document.removeEventListener("mousemove", enforceVerticalOnly)
        document.documentElement.style.removeProperty("--transform-y")
      }
    }
  }, [isDraggingSection])

  // Add this effect to pre-initialize drag dimensions for all sections
  useEffect(() => {
    // Pre-calculate dimensions for all sections to prevent layout shift on first drag
    const preCalculateSectionDimensions = () => {
      menuData.sections.forEach((section) => {
        const sectionElement = document.getElementById(`section-${section.id}`)
        if (sectionElement) {
          // Store original dimensions as data attributes
          const rect = sectionElement.getBoundingClientRect()
          sectionElement.dataset.originalWidth = `${rect.width}px`
          sectionElement.dataset.originalLeft = `${rect.left}px`
          sectionElement.dataset.originalHeight = `${rect.height}px`

          // Also store these values in CSS variables for easier access in CSS
          document.documentElement.style.setProperty("--section-original-width", `${rect.width}px`)
          document.documentElement.style.setProperty("--section-original-left", `${rect.left}px`)
          document.documentElement.style.setProperty("--section-original-height", `${rect.height}px`)

          // Force a layout calculation
          void sectionElement.offsetWidth
          void sectionElement.offsetHeight
        }
      })
    }

    // Run immediately and after a short delay to ensure DOM is fully rendered
    preCalculateSectionDimensions()
    const timer = setTimeout(preCalculateSectionDimensions, 100)

    return () => clearTimeout(timer)
  }, [menuData.sections])

  const addSection = () => {
    const id = `section-${Date.now()}`
    const newSection: MenuSection = {
      id,
      name: "New Section",
      items: [],
    }
    updateMenuData({ sections: [...menuData.sections, newSection] })

    // Set the new section as the active section
    setOpenSections([id])
    setOpenSectionId(id)

    // Set the new section ID to trigger scrolling
    setNewSectionId(id)

    // Put the new section in edit mode immediately
    setEditingSectionId(id)
  }

  const deleteSection = (id: string) => {
    updateMenuData({ sections: menuData.sections.filter((section) => section.id !== id) })
    setSelectedItems((prev) => {
      const { [id]: _, ...rest } = prev
      return rest
    })
  }

  const handleSectionNameChange = (id: string, newName: string) => {
    const updatedSections = menuData.sections.map((section) =>
      section.id === id ? { ...section, name: newName } : section,
    )
    updateMenuData({ sections: updatedSections })
  }

  const toggleItemSelection = (sectionId: string, itemId: string) => {
    setSelectedItems((prev) => {
      const sectionItems = prev[sectionId] || []
      const updatedItems = sectionItems.includes(itemId)
        ? sectionItems.filter((id) => id !== itemId)
        : [...sectionItems, itemId]

      return {
        ...prev,
        [sectionId]: updatedItems,
      }
    })
  }

  const deleteSelectedItems = (sectionId: string) => {
    const itemsToDelete = selectedItems[sectionId] || []
    itemsToDelete.forEach((itemId) => onRemoveProduct(sectionId, itemId))
    setSelectedItems((prev) => ({
      ...prev,
      [sectionId]: [],
    }))
  }

  const handleAccordionChange = (value: string) => {
    if (value) {
      setOpenSections([value])
      setOpenSectionId(value)
      // Removed the scrolling behavior that was here
    } else {
      setOpenSections([])
      setOpenSectionId(null)
    }
  }

  // Function to handle editing a product
  const handleEditProduct = (sectionId: string, productId: string) => {
    // Find the product in the section
    const section = menuData.sections.find((s) => s.id === sectionId)
    if (!section) return

    const product = section.items.find((p) => p.id === productId)
    if (!product) return

    // Set the editing product and open the panel
    setEditingProduct({ product, sectionId })
    setIsEditPanelOpen(true)
  }

  // Function to handle saving edited product
  const handleSaveProduct = (updatedProduct: Product) => {
    if (!editingProduct) return

    // Update the product in the section
    const updatedSections = menuData.sections.map((section) => {
      if (section.id === editingProduct.sectionId) {
        return {
          ...section,
          items: section.items.map((item) => (item.id === updatedProduct.id ? updatedProduct : item)),
        }
      }
      return section
    })

    // Update the menu data
    updateMenuData({ sections: updatedSections })

    // Close the edit panel
    setIsEditPanelOpen(false)
    setEditingProduct(null)
  }

  // Function to close the edit panel
  const handleCloseEditPanel = () => {
    setIsEditPanelOpen(false)
    setEditingProduct(null)
  }

  // Function to handle product drop on a section
  const handleProductDropOnSection = (sectionId: string, product: Product) => {
    // Find the target section
    const targetSection = menuData.sections.find((section) => section.id === sectionId)

    if (!targetSection) return

    // Check if the product already exists in this section
    const isDuplicate = targetSection.items.some((item) => item.id === product.id)

    if (isDuplicate) {
      // If it's a duplicate, don't add it and optionally show some feedback
      // You could add a visual indicator or notification here
      return
    }

    // Update sections with the new product
    const updatedSections = menuData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: [...section.items, product],
        }
      }
      return section
    })

    updateMenuData({ sections: updatedSections })

    // Only set the recently dropped section if we're opening the section
    // This prevents the blue overlay on closed sections
    const isClosedSection = !openSections.includes(sectionId)
    if (!isClosedSection) {
      setRecentlyDroppedSection(sectionId)
    }

    // Set the recently added item to trigger animation
    setRecentlyAddedItem({
      sectionId,
      itemId: product.id,
    })

    // Auto-open the section when a product is dropped on it
    if (!openSections.includes(sectionId)) {
      setOpenSections([sectionId])
      setOpenSectionId(sectionId)
    }
  }

  // Update the function to implement all the improvements
  // Function to update drop indicator position
  const updateDropIndicator = (sectionId: string, clientY: number): void => {
    const sectionElement = document.getElementById(`section-${sectionId}`)

    if (!sectionElement) {
      console.warn(`${DROP_INDICATOR_NOT_FOUND_WARNING}: ${sectionId}`)
      return
    }

    const { top, height, bottom } = sectionElement.getBoundingClientRect()

    // Simplified logic - if cursor is in the top half, show top indicator, otherwise bottom
    const middleY = top + height / 2

    if (clientY < middleY) {
      setDropPosition(DropPosition.Top)
      document.body.setAttribute("data-drop-position", "top")
    } else {
      setDropPosition(DropPosition.Bottom)
      document.body.setAttribute("data-drop-position", "bottom")
    }

    setActiveDropSectionId(sectionId)
  }

  // Function to handle section drag start
  const handleSectionDragStart = (sectionId: string) => {
    setIsDraggingSection(true)
    setActiveDragSectionId(sectionId)

    // Reset any hover states that might be active
    setDragOverSectionId(null)

    // Close all sections when dragging starts
    if (openSections.length > 0) {
      setOpenSections([])
      setOpenSectionId(null)
    }

    // Add vertical-only constraint attributes to the body
    document.body.setAttribute("data-drag-type", "section")
    document.body.classList.add("is-dragging-section")
    document.body.classList.add("vertical-only-constraint")

    // Find the section element and add vertical-only attributes
    const sectionElement = document.getElementById(`section-${sectionId}`)
    if (sectionElement) {
      // Get the computed dimensions
      const rect = sectionElement.getBoundingClientRect()

      // Store dimensions in CSS variables for use during drag
      document.documentElement.style.setProperty("--section-original-width", `${rect.width}px`)
      document.documentElement.style.setProperty("--section-original-left", `${rect.left}px`)
      document.documentElement.style.setProperty("--section-original-height", `${rect.height}px`)
      document.documentElement.style.setProperty("--section-original-top", `${rect.top}px`)

      // Store the original position in the element itself
      sectionElement.dataset.originalWidth = `${rect.width}px`
      sectionElement.dataset.originalLeft = `${rect.left}px`
      sectionElement.dataset.originalTop = `${rect.top}px`
      sectionElement.dataset.originalHeight = `${rect.height}px`

      sectionElement.setAttribute("data-vertical-only", "true")
      sectionElement.setAttribute("data-axis", "y")
      sectionElement.classList.add("vertical-only-drag")

      // Force a reflow to ensure dimensions are applied before dragging starts
      void sectionElement.offsetHeight
    }

    // Add a mutation observer to enforce dimensions on the drag overlay
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          const dragOverlay = document.querySelector(".dnd-kit-drag-overlay")
          if (dragOverlay) {
            // Apply strict dimensions to the drag overlay
            dragOverlay.setAttribute(
              "style",
              `
              transform: translateY(var(--transform-y, 0)) !important;
              box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1) !important;
              background-color: white !important;
              border-radius: 8px !important;
              width: var(--section-original-width, auto) !important;
              left: var(--section-original-left, auto) !important;
              height: var(--section-original-height, auto) !important;
              position: fixed !important;
              top: var(--transform-y, var(--section-original-top, auto)) !important;
              margin: 0 !important;
              transition: none !important;
            `,
            )

            // Also apply to children
            const dragContent = dragOverlay.querySelector("div")
            if (dragContent) {
              dragContent.setAttribute(
                "style",
                `
                transform: translateY(0) !important;
                width: 100% !important;
                margin: 0 !important;
                padding: 0 !important;
              `,
              )
            }

            // Force a reflow to ensure styles are applied
            void dragOverlay.offsetHeight
          }
        }
      })
    })

    // Start observing the body for the drag overlay
    observer.observe(document.body, { childList: true, subtree: true })

    // Store the observer to disconnect it later
    ;(window as any).__sectionDragObserver = observer
  }

  // Function to handle section drag end
  const handleSectionDragEnd = () => {
    setIsDraggingSection(false)
    setActiveDragSectionId(null)
    setActiveDropSectionId(null)
    setDropPosition(null)

    // Clean up the data attributes
    document.body.removeAttribute("data-drop-position")
    document.body.removeAttribute("data-drag-type")
    document.body.classList.remove("is-dragging-section")
    document.body.classList.remove("vertical-only-constraint")

    // Clean up any section-specific attributes
    const sections = document.querySelectorAll(".menu-section-wrapper")
    sections.forEach((section) => {
      section.classList.remove("vertical-only-drag")
      section.removeAttribute("data-vertical-only")
      section.removeAttribute("data-axis")
    })

    // Clean up CSS variables
    document.documentElement.style.removeProperty("--transform-y")
    document.documentElement.style.removeProperty("--section-original-left")
    document.documentElement.style.removeProperty("--section-original-width")

    // Disconnect the mutation observer
    if ((window as any).__sectionDragObserver) {
      ;(window as any).__sectionDragObserver.disconnect()
      ;(window as any).__sectionDragObserver = null
    }
  }

  // Helper function to find the nearest section edge for the floating indicator
  const findNearestSectionEdge = (mouseY: number): number => {
    // Get all section elements
    const sectionElements = menuData.sections
      .map((section) => document.getElementById(`section-${section.id}`))
      .filter(Boolean) as HTMLElement[]

    if (sectionElements.length === 0) return mouseY

    // Find the nearest section edge (top or bottom)
    let nearestEdge = mouseY
    let minDistance = Number.POSITIVE_INFINITY

    sectionElements.forEach((element) => {
      const rect = element.getBoundingClientRect()

      // Check distance to top edge
      const distanceToTop = Math.abs(mouseY - rect.top)
      if (distanceToTop < minDistance) {
        minDistance = distanceToTop
        nearestEdge = rect.top
      }

      // Check distance to bottom edge
      const distanceToBottom = Math.abs(mouseY - rect.bottom)
      if (distanceToBottom < minDistance) {
        minDistance = distanceToBottom
        nearestEdge = rect.bottom
      }
    })

    return nearestEdge
  }

  return (
    <div className="flex flex-col h-full">
      <div className="mb-6 relative" style={{ position: "static" }}>
        <h2 className="text-2xl font-semibold mb-4">{menuData.name}</h2>
        <p className="text-sm text-muted-foreground">
          Customize your menu sections and add products to each section. Drag sections to reorder them.
        </p>
      </div>

      <div className="flex-1">
        <SortableContext items={menuData.sections.map((section) => section.id)} strategy={verticalListSortingStrategy}>
          {menuData.sections.map((section, index) => (
            <MenuSectionItem
              key={section.id}
              section={section}
              onRemoveProduct={onRemoveProduct}
              onDeleteSection={deleteSection}
              onSectionNameChange={handleSectionNameChange}
              isEditing={editingSectionId === section.id}
              setEditingSectionId={setEditingSectionId}
              selectedItems={selectedItems[section.id] || []}
              onToggleSelection={toggleItemSelection}
              onDeleteSelected={() => deleteSelectedItems(section.id)}
              isOpen={openSections.includes(section.id)}
              onToggleAccordion={handleAccordionChange}
              setIsDraggingSection={setIsDraggingSection}
              onEditProduct={handleEditProduct}
              onProductDrop={handleProductDropOnSection}
              dragOverSectionId={dragOverSectionId}
              setDragOverSectionId={setDragOverSectionId}
              recentlyDroppedSection={recentlyDroppedSection}
              recentlyAddedItem={recentlyAddedItem}
              isDraggingProduct={isDraggingProduct}
              dropAnimationData={dropAnimationData}
              showDropAnimation={showDropAnimation && dropAnimationData?.sectionId === section.id}
              scrollContainerRef={scrollContainerRef}
              isLastSection={index === menuData.sections.length - 1}
              isFirstSection={index === 0}
              sectionIndex={index}
              totalSections={menuData.sections.length}
              updateDropIndicator={updateDropIndicator}
              showDropIndicator={isDraggingSection && activeDropSectionId === section.id}
              dropPosition={activeDropSectionId === section.id ? dropPosition : null}
              onDragStart={() => handleSectionDragStart(section.id)}
              onDragEnd={handleSectionDragEnd}
              isDraggingSection={isDraggingSection}
              activeDragSectionId={activeDragSectionId}
              activeDropSectionId={activeDropSectionId}
            />
          ))}
        </SortableContext>
      </div>

      {/* Section-sized drop indicator that follows the mouse during section dragging */}
      {isDraggingSection && mousePosition && !activeDropSectionId && (
        <div
          className="fixed pointer-events-none z-[1000]"
          style={{
            left: 0,
            right: 0,
            width: "calc(100% - 500px)",
            top: findNearestSectionEdge(mousePosition.y),
            transform: "translateY(-1px)",
            marginLeft: "90px",
            marginRight: "40px",
          }}
        >
          <DropIndicatorSVG />
        </div>
      )}

      <Button
        variant="ghost"
        className="w-[200px] ml-4 text-primary justify-start px-4 py-2 font-normal z-20 bg-background/80 backdrop-blur-sm rounded-md shadow-sm border mt-6"
        onClick={addSection}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add menu section
      </Button>

      {/* Product Edit Panel */}
      <ProductEditPanel
        product={editingProduct?.product || null}
        isOpen={isEditPanelOpen}
        onClose={handleCloseEditPanel}
        onSave={handleSaveProduct}
      />

      {/* Overlay when edit panel is open */}
      {isEditPanelOpen && <div className="fixed inset-0 bg-black/20 z-[100]" onClick={handleCloseEditPanel} />}
    </div>
  )
}

// Replace the entire MenuSectionItem component with this implementation
// that doesn't rely on the Accordion component at all

function MenuSectionItem(props: {
  section: MenuSection
  onRemoveProduct: (sectionId: string, productId: string) => void
  onDeleteSection: (id: string) => void
  onSectionNameChange: (id: string, newName: string) => void
  isEditing: boolean
  setEditingSectionId: (id: string | null) => void
  selectedItems: string[]
  onToggleSelection: (sectionId: string, itemId: string) => void
  onDeleteSelected: () => void
  isOpen: boolean
  onToggleAccordion: (value: string) => void
  setIsDraggingSection: (isDragging: boolean) => void
  onEditProduct: (sectionId: string, productId: string) => void
  onProductDrop: (sectionId: string, product: Product) => void
  dragOverSectionId: string | null
  setDragOverSectionId: (id: string | null) => void
  recentlyDroppedSection: string | null
  recentlyAddedItem: { sectionId: string; itemId: string } | null
  isDraggingProduct: boolean
  dropAnimationData?: DropAnimationData | null
  showDropAnimation?: boolean
  scrollContainerRef: React.RefObject<HTMLDivElement> | null
  isLastSection: boolean
  isFirstSection: boolean
  sectionIndex: number
  totalSections: number
  updateDropIndicator: (sectionId: string, clientY: number) => void
  showDropIndicator: boolean
  dropPosition: DropPosition | null
  onDragStart: () => void
  onDragEnd: () => void
  isDraggingSection: boolean
  activeDragSectionId: string | null
  activeDropSectionId: string | null
}) {
  const {
    section,
    onRemoveProduct,
    onSectionNameChange,
    isEditing,
    setEditingSectionId,
    selectedItems,
    onToggleSelection,
    onDeleteSelected,
    isOpen,
    onToggleAccordion,
    setIsDraggingSection,
    onEditProduct,
    onProductDrop,
    dragOverSectionId,
    setDragOverSectionId,
    recentlyDroppedSection,
    recentlyAddedItem,
    isDraggingProduct,
    dropAnimationData,
    showDropAnimation,
    scrollContainerRef,
    isLastSection,
    isFirstSection,
    sectionIndex,
    totalSections,
    updateDropIndicator,
    showDropIndicator,
    dropPosition,
    onDragStart,
    onDragEnd,
    isDraggingSection,
    activeDragSectionId,
    activeDropSectionId,
  } = props

  // Sortable functionality
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
    data: {
      type: "section",
      section: section,
      isProduct: false,
    },
    animateLayoutChanges: () => false,
    modifiers: [
      // Ultra-strict vertical-only modifier
      (args) => {
        // Create a new transform object with ONLY the y property
        const newTransform = {
          ...args.transform,
          x: 0,
          scaleX: 1,
          scaleY: 1,
          rotate: 0,
        }

        // Override all transform methods to ensure only Y translation
        newTransform.toString = () => `translateY(${args.transform.y}px)`

        // Replace the transform object entirely
        args.transform = newTransform

        return args
      },
    ],
    // Force vertical-only axis
    axis: "y",
    // Lock to vertical axis
    lockAxis: "y",
  })

  // Make sure we update section dragging state as early as possible
  useEffect(() => {
    if (isDragging && !isDraggingSection) {
      // Signal that we're starting section dragging
      setIsDraggingSection(true)
      onDragStart()

      // Add section-specific attributes
      const sectionElement = document.getElementById(`section-${section.id}`)
      if (sectionElement) {
        sectionElement.setAttribute("data-sorting", "true")
      }

      // Close all sections for better UX during sorting
      if (isOpen) {
        onToggleAccordion("")
      }
    }
  }, [isDragging, section.id, onDragStart, isOpen, onToggleAccordion, isDraggingSection, setIsDraggingSection])

  // Update parent component about dragging state
  useEffect(() => {
    if (isDragging) {
      onDragStart()
    } else if (!isDragging && activeDragSectionId === section.id) {
      onDragEnd()
    }
  }, [isDragging, onDragStart, onDragEnd, activeDragSectionId, section.id])

  // Function to toggle the accordion
  const toggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleAccordion(isOpen ? "" : section.id)
  }

  // Add hover timer to auto-open sections after hovering for 1 second
  const hoverTimerRef = useRef<NodeJS.Timeout | null>(null)
  const [hoverProgress, setHoverProgress] = useState(0)
  const [isAutoOpening, setIsAutoOpening] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [isHovering, setIsHovering] = useState(false)

  // Effect to handle hover timing for auto-opening sections
  useEffect(() => {
    // Only set up timer if section is closed, we're dragging a product, and hovering over this section
    if (!isOpen && isDraggingProduct && dragOverSectionId === section.id) {
      setIsHovering(true)
      // Start progress tracking
      setHoverProgress(0)
      const startTime = Date.now()
      const totalHoverTime = 1000 // 1 second

      // Update progress every 30ms for smoother animation
      const progressInterval = setInterval(() => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / totalHoverTime, 1)
        setHoverProgress(progress)

        // When we reach 100%, clear the interval
        if (progress >= 1) {
          clearInterval(progressInterval)
        }
      }, 30)

      // Set a timer to open the section after 1 second
      hoverTimerRef.current = setTimeout(() => {
        setIsAutoOpening(true)

        // Force open the section
        onToggleAccordion(section.id)

        // Reset after animation completes
        setTimeout(() => {
          setIsAutoOpening(false)
          setHoverProgress(0)
        }, 1000)
      }, totalHoverTime)

      // Clean up function
      return () => {
        clearInterval(progressInterval)
        if (hoverTimerRef.current) {
          clearTimeout(hoverTimerRef.current)
          hoverTimerRef.current = null
        }
      }
    } else {
      // Clear the timer if we're no longer hovering or the section is already open
      setIsHovering(false)
      if (hoverTimerRef.current) {
        clearTimeout(hoverTimerRef.current)
        hoverTimerRef.current = null
        setHoverProgress(0)
      }
    }
  }, [isOpen, isDraggingProduct, dragOverSectionId, section.id, onToggleAccordion])

  // Make the section header droppable when closed
  const { setNodeRef: setHeaderDroppableRef, isOver: isOverHeader } = useDroppable({
    id: `header-${section.id}`,
    data: {
      type: "section-header",
      accepts: ["product"],
      sectionId: section.id,
    },
  })

  // Additional manual hover detection for more reliability
  useEffect(() => {
    // Only set hovering state when not dragging sections
    if ((isOverHeader || dragOverSectionId === section.id) && !isDraggingSection) {
      setIsHovering(true)
    } else {
      setIsHovering(false)
    }
  }, [isOverHeader, dragOverSectionId, section.id, isDraggingSection])

  // Update dragOverSectionId when hovering over the header
  useEffect(() => {
    if (isOverHeader) {
      setDragOverSectionId(section.id)
    } else if (dragOverSectionId === section.id && !isOverHeader) {
      // Only clear if this section is the current dragOverSection and we're no longer over it
      setDragOverSectionId(null)
    }
  }, [isOverHeader, section.id, dragOverSectionId, setDragOverSectionId])

  // Check if this section recently had an item dropped into it
  const isRecentlyDropped = recentlyDroppedSection === section.id

  // Handle drop on section header
  const handleHeaderDrop = (e: React.DragEvent) => {
    e.preventDefault()
    // Extract the product data from the drag event
    const productData = e.dataTransfer.getData("application/json")
    if (productData) {
      try {
        const product = JSON.parse(productData)
        onProductDrop(section.id, product)
      } catch (error) {
        console.error("Error parsing product data:", error)
      }
    }
  }

  // Add this useEffect after other useEffect hooks in MenuSectionItem
  useEffect(() => {
    if (isOpen && scrollContainerRef && scrollContainerRef.current) {
      const handleScroll = () => {
        // Check if we've scrolled down at all within the container
        if (scrollContainerRef.current) {
          setIsScrolled(scrollContainerRef.current.scrollTop > 10)
        }
      }

      scrollContainerRef.current.addEventListener("scroll", handleScroll)
      // Initial check
      handleScroll()

      return () => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.removeEventListener("scroll", handleScroll)
        }
      }
    } else {
      setIsScrolled(false)
    }
  }, [isOpen, scrollContainerRef])

  // Manual mouse event handlers for better hover detection
  const handleMouseEnter = () => {
    // Only activate hover state when dragging products, not when dragging sections
    if (isDraggingProduct && !isOpen && !isDraggingSection) {
      setDragOverSectionId(section.id)
      setIsHovering(true)

      // Force add hover class for first and last sections
      if (isFirstSection || isLastSection) {
        const sectionElement = document.getElementById(`section-${section.id}`)
        if (sectionElement) {
          sectionElement.setAttribute("data-hovering", "true")
          sectionElement.setAttribute("data-drag-over", "true")
        }
      }
    }
  }

  const handleMouseLeave = () => {
    if (isDraggingProduct && !isOpen) {
      setDragOverSectionId(null)
      setIsHovering(false)

      // Force remove hover class for first and last
      if (isFirstSection || isLastSection) {
        const sectionElement = document.getElementById(`section-${section.id}`)
        if (sectionElement) {
          sectionElement.removeAttribute("data-hovering")
          sectionElement.removeAttribute("data-drag-over")
        }
      }
    }
  }

  // Calculate if this section is being hovered over
  const isHovered = !isDraggingSection && (isOverHeader || dragOverSectionId === section.id || isHovering)

  // Handle mouse move to update drop indicator position
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging || isDraggingSection) {
      updateDropIndicator(section.id, e.clientY)
    }
  }

  // Determine if this section should show drop indicators
  const shouldShowDropIndicator =
    (showDropIndicator || (isDraggingSection && activeDropSectionId === section.id)) &&
    activeDragSectionId !== section.id

  return (
    <div
      ref={setNodeRef}
      style={{
        // Only apply transform to the actual dragged item, not the ghost
        transform: isDragging ? undefined : transform ? `translateY(${transform.y}px)` : undefined,
        transformOrigin: "initial",
        transition: isDragging ? "none" : transition,
        opacity: isDragging ? 0.4 : 1,
        position: "relative",
        zIndex: isDragging ? 50 : isHovered ? 10 : isFirstSection || isLastSection ? 5 : 1,
        pointerEvents: isDraggingSection && !isDragging ? "none" : "auto",
        cursor: isDragging ? "ns-resize" : "grab",
        touchAction: "pan-y",
        width: isDragging ? "var(--section-original-width, auto)" : "auto",
      }}
      className={`p-0 m-0 menu-section-wrapper relative ${isFirstSection ? "first-section" : ""} ${
        isLastSection ? "last-section" : ""
      } ${isDragging ? "vertical-only-drag" : ""}`}
      data-dragging={isDragging}
      data-hovering={isHovering}
      data-drag-over={dragOverSectionId === section.id}
      id={`section-${section.id}`}
      data-section-index={sectionIndex}
      data-first-section={isFirstSection}
      data-last-section={isLastSection}
      data-vertical-only={true}
      data-axis="y"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
    >
      {/* Drop indicator - top */}
      {shouldShowDropIndicator && dropPosition === DropPosition.Top && (
        <div
          className="absolute z-[200]"
          style={{
            top: -1,
            left: 0,
            right: 0,
            marginLeft: "40px",
            marginRight: "40px",
          }}
        >
          <DropIndicatorSVG />
        </div>
      )}

      {/* Drop indicator - bottom */}
      {shouldShowDropIndicator && dropPosition === DropPosition.Bottom && (
        <div
          className="absolute z-[200]"
          style={{
            bottom: -1,
            left: 0,
            right: 0,
            marginLeft: "40px",
            marginRight: "40px",
          }}
        >
          <DropIndicatorSVG />
        </div>
      )}

      {/* Fixed header that doesn't move - always the same size and position */}
      <div
        className={`${isOpen ? "sticky top-0 z-40" : ""}`}
        style={{
          position: isOpen ? "sticky" : "relative",
          marginLeft: 0,
          marginRight: 0,
          marginTop: 0,
          marginBottom: 0,
          padding: 0,
          background: isOpen ? "white" : "transparent",
        }}
      >
        <motion.div
          ref={!isOpen ? setHeaderDroppableRef : undefined}
          className={`rounded-lg menu-section-header ${isOpen ? "sticky-header" : "section-header-droppable"} ${
            isRecentlyDropped && isOpen ? "bg-[#F4F4FF]" : ""
          } ${isScrolled && isOpen ? "border-b" : ""} bg-background section-header-container ${
            isFirstSection ? "first-section" : ""
          } ${isLastSection ? "last-section" : ""}`}
          style={{
            ...(isOpen
              ? {
                  backdropFilter: "none",
                  backgroundColor: "white",
                  marginLeft: 0,
                  marginRight: 0,
                  marginTop: 0,
                  marginBottom: 0,
                  padding: 0,
                  zIndex: 40,
                  borderBottom: isScrolled ? "1px solid #e5e7eb" : "none",
                  boxShadow: isScrolled
                    ? "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
                    : "none",
                }
              : {
                  position: "relative", // Ensure position is set explicitly
                  zIndex: isHovered ? 20 : isFirstSection || isLastSection ? 10 : 1, // Higher z-index for first/last
                  pointerEvents: "auto", // Ensure pointer events are enabled
                  backgroundColor: isHovered ? "#f9f9f9" : "transparent", // Light gray instead of blue
                }),
          }}
          animate={
            !isOpen
              ? {
                  backgroundColor: isHovered && !isDraggingSection ? "#f9f9f9" : "transparent",
                  boxShadow:
                    isHovered && !isDraggingSection
                      ? "0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04)"
                      : "none",
                  y: isHovered && !isDraggingSection ? -1 : 0,
                  scale: isHovered && !isDraggingSection ? 1.01 : 1,
                }
              : {
                  boxShadow: isScrolled ? "0 6px 16px rgba(0, 0, 0, 0.12), 0 3px 6px rgba(0, 0, 0, 0.08)" : "none",
                  marginTop: 0,
                  marginRight: 0,
                  marginBottom: 0,
                  marginLeft: 0,
                }
          }
          transition={{
            type: "spring",
            stiffness: 300,
            damping: 25,
            backgroundColor: { duration: 0.2 },
            boxShadow: { duration: 0.3 },
          }}
          data-droppable={!isOpen}
          data-over={!isOpen && isHovered}
          onDrop={!isOpen ? handleHeaderDrop : undefined}
          onDragOver={!isOpen ? (e) => e.preventDefault() : undefined}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          id={`header-${section.id}`}
          initial={false}
        >
          <div
            className={`flex items-center h-full px-4`}
            style={{
              paddingTop: 0,
              paddingBottom: 0,
              transition: "box-shadow 0.3s ease",
            }}
          >
            {/* Drag handle moved to the left */}
            <div
              {...attributes}
              {...listeners}
              className="p-2 mr-3 hover:bg-gray-100 rounded-full cursor-grab active:cursor-grabbing"
            >
              <GripVertical className="h-4 w-4 text-muted-foreground" />
            </div>

            <div className="flex-1">
              {isEditing ? (
                <Input
                  value={section.name}
                  onChange={(e) => onSectionNameChange(section.id, e.target.value)}
                  onBlur={() => setEditingSectionId(null)}
                  autoFocus
                  className="max-w-xs"
                />
              ) : (
                <div className="flex flex-col">
                  <span className="font-medium text-lg">{section.name}</span>
                  <span className="text-sm text-muted-foreground">{section.items.length} products</span>
                </div>
              )}
            </div>

            <div className="flex items-center space-x-3">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="p-2 hover:bg-gray-100 rounded-full">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[160px]">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingSectionId(section.id)
                    }}
                  >
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation()
                      props.onDeleteSection(section.id)
                    }}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <button
                className={`p-2 hover:bg-gray-100 rounded-full ${isOpen ? "opacity-50 cursor-not-allowed" : ""}`}
                onClick={toggleAccordion}
                disabled={isOpen}
              >
                <ChevronDown
                  className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
                />
              </button>
            </div>
          </div>
          {!isOpen && isDraggingProduct && (
            <motion.div
              className="absolute bottom-0 left-0 h-1 bg-primary z-10"
              initial={{ width: 0 }}
              animate={{
                width: dragOverSectionId === section.id ? `${hoverProgress * 100}%` : "0%",
                opacity: dragOverSectionId === section.id ? 1 : 0,
              }}
              transition={{ duration: 0.05 }}
            />
          )}
        </motion.div>
      </div>

      {/* Content area that expands/collapses without affecting the header */}
      <div className="overflow-hidden">
        <AnimatePresence>
          {isOpen && (
            <motion.div
              className="pt-1 overflow-clip"
              initial={{ height: 0, opacity: 0 }}
              animate={{
                height: "auto",
                opacity: 1,
                transition: {
                  height: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.2, delay: 0.1 },
                },
              }}
              exit={{
                height: 0,
                opacity: 0,
                transition: {
                  height: { type: "spring", stiffness: 300, damping: 30 },
                  opacity: { duration: 0.1 },
                },
              }}
              style={{ overflow: "hidden" }}
            >
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{
                  y: 0,
                  opacity: 1,
                  transition: {
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                    delay: 0.1,
                  },
                }}
              >
                <SectionContent
                  section={section}
                  selectedItems={selectedItems}
                  onToggleSelection={onToggleSelection}
                  onRemoveProduct={onRemoveProduct}
                  onEditProduct={onEditProduct}
                  isRecentlyDropped={isRecentlyDropped}
                  recentlyAddedItem={recentlyAddedItem}
                  dropAnimationData={dropAnimationData}
                  showDropAnimation={showDropAnimation}
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!isLastSection && <Separator style={{ margin: "0" }} />}
    </div>
  )
}

function SectionContent({
  section,
  selectedItems,
  onToggleSelection,
  onRemoveProduct,
  onEditProduct,
  isRecentlyDropped,
  recentlyAddedItem,
  dropAnimationData,
  showDropAnimation,
}: {
  section: MenuSection
  selectedItems: string[]
  onToggleSelection: (sectionId: string, itemId: string) => void
  onRemoveProduct: (sectionId: string, productId: string) => void
  onEditProduct: (sectionId: string, productId: string) => void
  isRecentlyDropped: boolean
  recentlyAddedItem: { sectionId: string; itemId: string } | null
  dropAnimationData?: DropAnimationData | null
  showDropAnimation?: boolean
}) {
  // Make the dropzone area droppable
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: "section",
      accepts: "product",
      sectionId: section.id,
    },
  })

  return (
    <div className="space-y-4 py-4 pb-6 px-[40px] overflow-hidden">
      {/* Items display area - two column grid layout */}
      {section.items.length > 0 && (
        <motion.div
          className="grid grid-cols-1 gap-4 mb-4 mx-auto overflow-visible w-full"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}
          initial="closed"
          animate="open"
          variants={{
            open: {
              transition: { staggerChildren: 0.07, delayChildren: 0.1 },
            },
            closed: {
              transition: {
                staggerChildren: 0.05,
                staggerDirection: -1,
              },
            },
          }}
        >
          {section.items.map((item, index) => {
            // Check if this item was recently added
            const isRecentlyAdded = recentlyAddedItem?.sectionId === section.id && recentlyAddedItem?.itemId === item.id
            const isDropAnimationTarget =
              dropAnimationData?.sectionId === section.id && dropAnimationData?.itemId === item.id && showDropAnimation

            return (
              <ProductItem
                key={`${section.id}-${item.id}-${index}`} // Add index to ensure unique keys
                item={item}
                isSelected={Boolean(
                  Array.isArray(selectedItems) && selectedItems && item && item.id && selectedItems.includes(item.id),
                )}
                onToggleSelection={() => onToggleSelection(section.id, item.id)}
                sectionId={section.id}
                onRemoveProduct={onRemoveProduct}
                onEditProduct={onEditProduct}
                isRecentlyAdded={isRecentlyAdded}
                isDropAnimationTarget={isDropAnimationTarget}
              />
            )
          })}
        </motion.div>
      )}

      {/* Dropzone area - always visible below items */}
      <div
        ref={setNodeRef}
        data-droppable="true"
        data-over={isOver}
        className={`min-h-[100px] p-4 flex items-center justify-center rounded-lg transition-all duration-200 ${
          isOver ? "scale-105 transform" : ""
        }`}
        style={{
          border: isOver ? "2px dotted #3B37F2" : "1.5px dotted #C1C1D5",
          backgroundColor: isOver ? "#F4F4FF" : "white",
          boxShadow: isOver ? "0 0 0 2px rgba(59, 55, 242, 0.2)" : "0 0 0 1px rgba(193, 193, 213, 0.05)",
        }}
      >
        <div
          className="text-center"
          style={{
            color: isOver ? "#3B37F2" : "#21212E",
            fontFamily: "Inter",
            fontSize: "14px",
            fontWeight: isOver ? 500 : 400,
            lineHeight: "150%",
            fontVariantNumeric: "lining-nums tabular-nums ordinal slashed-zero",
            fontFeatureSettings:
              "'cpsp' on, 'ss01' on, 'ss03' on, 'ss04' on, 'cv01' on, 'cv02' on, 'cv03' on, 'cv04' on, 'cv05' on, 'cv06' on, 'cv07' on, 'cv08' on, 'cv09' on, 'cv10' on",
          }}
        >
          {isRecentlyDropped ? (
            <div className="flex flex-col items-center text-primary">
              <CheckCircle className="h-6 w-6 mb-2" />
              <span className="font-medium">Item added successfully!</span>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <span>{isOver ? "Release to add product" : "Drag and drop your products here"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Update the ProductItem component to add the fade-in animation for newly added items
function ProductItem({
  item,
  isSelected,
  onToggleSelection,
  sectionId,
  onRemoveProduct,
  onEditProduct,
  isRecentlyAdded = false,
  isDropAnimationTarget = false,
}: {
  item: Product
  isSelected: boolean
  onToggleSelection: () => void
  sectionId: string
  onRemoveProduct: (sectionId: string, productId: string) => void
  onEditProduct: (sectionId: string, productId: string) => void
  isRecentlyAdded?: boolean
  isDropAnimationTarget?: boolean
}) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [isNewlyAdded, setIsNewlyAdded] = useState(isRecentlyAdded)

  // Add effect to handle recently added items
  useEffect(() => {
    if (isRecentlyAdded) {
      setIsNewlyAdded(true)

      // Reset the newly added state after animation completes
      const timer = setTimeout(() => {
        setIsNewlyAdded(false)
      }, 2000)

      return () => clearTimeout(timer)
    }
  }, [isRecentlyAdded, item.id])

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Add visual feedback
    setIsDeleting(true)

    // Small timeout to allow for visual feedback before removal
    setTimeout(() => {
      onRemoveProduct(sectionId, item.id)
    }, 50)
  }

  return (
    <motion.div
      id={`item-${sectionId}-${item.id}`}
      className={`flex flex-col border rounded-lg overflow-hidden group relative min-w-[300px]
      ${isDeleting ? "opacity-50" : ""}
      ${isNewlyAdded ? "item-newly-added" : ""}`}
      variants={{
        open: {
          opacity: 1,
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 24,
          },
        },
        closed: {
          opacity: 0,
          y: 20,
          transition: {
            duration: 0.2,
          },
        },
      }}
      whileHover={{
        y: -2,
        zIndex: 10,
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
        transition: {
          type: "spring",
          stiffness: 400,
          damping: 17,
        },
      }}
    >
      <div className="flex items-start p-4 flex-1 box-border">
        <Checkbox
          checked={isSelected}
          onCheckedChange={onToggleSelection}
          className="mt-1 transition-opacity duration-300 checkbox"
        />
        <div className="ml-3 flex items-start flex-1">
          <div className="overflow-hidden rounded-lg">
            <motion.img
              src={item.image || "/placeholder.svg"}
              alt={item.name}
              className="w-12 h-12 object-cover"
              whileHover={{ scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            />
          </div>
          <div className="ml-3 flex-1">
            <div className="flex justify-between">
              <motion.span
                className="font-medium text-foreground"
                whileHover={{ y: -2, color: "hsl(var(--primary))" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                {item.name}
              </motion.span>
              <span className="text-sm text-muted-foreground">{item.price.toFixed(2)} €</span>
            </div>
            <div className="flex gap-1 mt-1">
              {item.dietary?.vegan && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Leaf className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {item.dietary?.glutenFree && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Wheat className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
              {item.dietary?.seafood && (
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center">
                  <Fish className="h-4 w-4 text-muted-foreground" />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col gap-2 ml-2">
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEditProduct(sectionId, item.id)
            }}
            className="p-1.5 rounded-full hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={handleDelete}
            className="p-1.5 rounded-full hover:bg-red-50 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Trash2 className="h-3.5 w-3.5 text-muted-foreground group-hover:text-red-500" />
          </button>
        </div>
      </div>
      {isNewlyAdded && (
        <motion.div
          className="absolute inset-0 bg-primary/10 pointer-events-none"
          initial={{ opacity: 0.8 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.5 }}
        />
      )}
    </motion.div>
  )
}
