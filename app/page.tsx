"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { MenuCreationStepper } from "./components/menu-creation-stepper"
import { Step1MenuInfo } from "./components/step1-menu-info"
import { Step2Outlets } from "./components/step2-outlets"
import { Step3MenuSections } from "./components/step3-menu-sections"
import { ProductSidepanel } from "./components/product-sidepanel"
import { MenuList, type SavedMenu } from "./components/menu-list"
import {
  DndContext,
  DragOverlay,
  useSensors,
  useSensor,
  PointerSensor,
  KeyboardSensor,
  rectIntersection,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ConfirmationBanner } from "./components/confirmation-banner"

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

// Extend SavedMenu to include draft information
interface DraftMenu extends SavedMenu {
  isDraft: boolean
  lastStep: number
}

// Interface for drop animation data
interface DropAnimationData {
  sectionId: string
  itemId: string
  startPosition: { x: number; y: number }
  endPosition: { x: number; y: number }
}

const initialProducts: Product[] = [
  {
    id: "p1",
    name: "Chicken Wings",
    price: 13.6,
    image: "/images/wings.png",
    dietary: { glutenFree: true, seafood: false },
  },
  {
    id: "p2",
    name: "Stuffed mushrooms",
    price: 8.6,
    image: "/images/salad.png",
    dietary: { vegan: true, glutenFree: true },
  },
  {
    id: "p3",
    name: "Parmesan breadsticks",
    price: 5.0,
    image: "/images/fries.png",
    dietary: { glutenFree: false },
  },
  {
    id: "p4",
    name: "Caprese",
    price: 4.5,
    image: "/images/caprese.png",
    dietary: { vegan: true },
  },
  {
    id: "p5",
    name: "Calamari rings",
    price: 6.0,
    image: "/images/pasta.png",
    dietary: { seafood: true },
  },
  {
    id: "p6",
    name: "Grilled Salmon",
    price: 15.5,
    image: "/images/salmon.png",
    dietary: { glutenFree: true, seafood: true },
  },
  // Adding 10 more products
  {
    id: "p7",
    name: "Margherita Pizza",
    price: 12.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: false, glutenFree: false },
  },
  {
    id: "p8",
    name: "Caesar Salad",
    price: 9.5,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: false, glutenFree: false },
  },
  {
    id: "p9",
    name: "Chocolate Mousse",
    price: 7.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: false, glutenFree: true },
  },
  {
    id: "p10",
    name: "Espresso",
    price: 3.5,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: true, glutenFree: true },
  },
  {
    id: "p11",
    name: "Shrimp Cocktail",
    price: 14.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { seafood: true, glutenFree: true },
  },
  {
    id: "p12",
    name: "Vegan Burger",
    price: 13.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: true, glutenFree: false },
  },
  {
    id: "p13",
    name: "Tiramisu",
    price: 8.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: false, glutenFree: false },
  },
  {
    id: "p14",
    name: "Fresh Lemonade",
    price: 4.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: true, glutenFree: true },
  },
  {
    id: "p15",
    name: "Lobster Bisque",
    price: 16.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { seafood: true, glutenFree: false },
  },
  {
    id: "p16",
    name: "Gluten-Free Pasta",
    price: 11.0,
    image: "/placeholder.svg?height=200&width=200",
    dietary: { vegan: false, glutenFree: true },
  },
]

// Add this sample menu data after the initialProducts array
const sampleMenus: SavedMenu[] = [
  {
    id: "sample-1",
    name: "Lunch Menu",
    description: "Weekday lunch offerings with seasonal specials",
    outlets: ["Main Restaurant", "Terrace"],
    sections: [
      {
        id: "section-1",
        name: "Starters",
        items: [
          initialProducts[0], // Chicken Wings
          initialProducts[3], // Caprese
        ],
      },
      {
        id: "section-2",
        name: "Main Courses",
        items: [
          initialProducts[5], // Grilled Salmon
          initialProducts[4], // Calamari rings
        ],
      },
      {
        id: "section-3",
        name: "Desserts",
        items: [
          initialProducts[8], // Chocolate Mousse
        ],
      },
    ],
    createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
    status: "Active",
  },
  {
    id: "sample-2",
    name: "Dinner Menu",
    description: "Evening dining with premium options",
    outlets: ["Main Restaurant", "Bar"],
    sections: [
      {
        id: "section-1",
        name: "Appetizers",
        items: [
          initialProducts[1], // Stuffed mushrooms
          initialProducts[2], // Parmesan breadsticks
        ],
      },
      {
        id: "section-2",
        name: "Entrées",
        items: [
          initialProducts[5], // Grilled Salmon
          initialProducts[14], // Lobster Bisque
        ],
      },
      {
        id: "section-3",
        name: "Sides",
        items: [
          initialProducts[15], // Gluten-Free Pasta
        ],
      },
    ],
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
    status: "Active",
  },
  {
    id: "sample-3",
    name: "Weekend Brunch",
    description: "Special weekend brunch menu",
    outlets: ["Terrace", "Main Restaurant"],
    sections: [
      {
        id: "section-1",
        name: "Breakfast Classics",
        items: [
          initialProducts[7], // Caesar Salad
          initialProducts[9], // Espresso
        ],
      },
      {
        id: "section-2",
        name: "Lunch Options",
        items: [
          initialProducts[6], // Margherita Pizza
          initialProducts[11], // Vegan Burger
        ],
      },
    ],
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
    status: "Inactive",
  },
]

export default function MenuCreationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "create">("list")
  const [savedMenus, setSavedMenus] = useState<(SavedMenu | DraftMenu)[]>(sampleMenus)
  const [menuData, setMenuData] = useState<{
    name: string
    description: string
    outlets: string[]
    sections: MenuSection[]
  }>({
    name: "",
    description: "",
    outlets: [],
    sections: [],
  })
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [openSectionId, setOpenSectionId] = useState<string | null>("section-1")
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [activeMultipleProducts, setActiveMultipleProducts] = useState<{ count: number; products: Product[] } | null>(
    null,
  )
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)
  const [openSections, setOpenSections] = useState<string[]>([])
  const [recentlyAddedItem, setRecentlyAddedItem] = useState<{ sectionId: string; itemId: string } | null>(null)
  const [dropAnimationData, setDropAnimationData] = useState<DropAnimationData | null>(null)
  const [snapToSection, setSnapToSection] = useState<{ sectionId: string; rect: DOMRect } | null>(null)
  const [isDropRejected, setIsDropRejected] = useState(false)
  const [hasInitialMenuData, setHasInitialMenuData] = useState(false)
  const [showConfirmation, setShowConfirmation] = useState(false)
  const [confirmationMessage, setConfirmationMessage] = useState("")

  // Ref to track if we're dropping onto the sidepanel
  const droppingOnSidepanel = useRef(false)

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

  const initializeMenuData = useCallback(() => {
    if (!hasInitialMenuData) {
      setMenuData((prev) => ({
        ...prev,
        sections: [
          { id: "section-1", name: "Appetizers", items: [] },
          { id: "section-2", name: "Mains", items: [] },
          { id: "section-3", name: "Desserts", items: [] },
          { id: "section-4", name: "Drinks", items: [] },
        ],
      }))
      setHasInitialMenuData(true)
    }
  }, [hasInitialMenuData])

  useEffect(() => {
    initializeMenuData()
  }, [initializeMenuData])

  // Load saved menus from localStorage on component mount
  useEffect(() => {
    const savedMenusFromStorage = localStorage.getItem("savedMenus")
    if (savedMenusFromStorage) {
      const parsedMenus = JSON.parse(savedMenusFromStorage)
      if (parsedMenus && parsedMenus.length > 0) {
        setSavedMenus(parsedMenus)
      }
    }
  }, [])

  // Save menus to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("savedMenus", JSON.stringify(savedMenus))
  }, [savedMenus])

  // Effect to handle drop rejection animation
  useEffect(() => {
    if (isDropRejected) {
      // Add a class to the body for styling
      document.body.classList.add("drop-rejected")

      // Remove the class after animation completes
      const timer = setTimeout(() => {
        document.body.classList.remove("drop-rejected")
        setIsDropRejected(false)
      }, 500)

      return () => clearTimeout(timer)
    }
  }, [isDropRejected])

  const updateMenuData = (data: Partial<typeof menuData>) => {
    setMenuData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleRemoveProduct = (sectionId: string, productId: string) => {
    // Create a new array of sections with the product removed
    const updatedSections = menuData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter((item) => item.id !== productId),
        }
      }
      return section
    })

    // Update the state immediately with the new sections
    updateMenuData({ sections: updatedSections })

    // Also clear the product from selected products if it was selected
    if (selectedProducts && selectedProducts.includes(productId)) {
      setSelectedProducts((prev) => prev.filter((id) => id !== productId))
    }
  }

  const handleAddProducts = (productIds: string[]) => {
    if (!openSectionId || !productIds || productIds.length === 0) return

    // Find the target section
    const targetSection = menuData.sections.find((section) => section.id === openSectionId)
    if (!targetSection) return

    // Filter out products that already exist in the section
    const existingProductIds = targetSection.items.map((item) => item.id)
    const newProductIds = productIds.filter((id) => !existingProductIds.includes(id))

    // If all products are duplicates, don't proceed
    if (newProductIds.length === 0) return

    // Get only the non-duplicate products to add
    const productsToAdd = initialProducts.filter((p) => newProductIds.includes(p.id))

    setMenuData((prevData) => ({
      ...prevData,
      sections: prevData.sections.map((section) => {
        if (section.id === openSectionId) {
          return {
            ...section,
            items: [...section.items, ...productsToAdd],
          }
        }
        return section
      }),
    }))

    // Set the recently added item to the last product for scrolling
    if (productsToAdd.length > 0) {
      const lastProduct = productsToAdd[productsToAdd.length - 1]
      setRecentlyAddedItem({
        sectionId: openSectionId,
        itemId: lastProduct.id,
      })
    }

    setSelectedProducts([]) // Clear selection after adding
  }

  // Function to save the current menu as a draft
  const saveMenuAsDraft = () => {
    // Only save if there's at least a name or we're beyond step 1
    if (menuData.name || currentStep > 1) {
      const draftMenu: DraftMenu = {
        id: draftId || Date.now().toString(),
        name: menuData.name || "Untitled Menu",
        description: menuData.description,
        outlets: menuData.outlets,
        sections: menuData.sections,
        createdAt: new Date().toISOString(),
        isDraft: true,
        lastStep: currentStep,
      }

      // If we already have a draft, update it
      if (draftId) {
        setSavedMenus((prev) => prev.map((menu) => ("isDraft" in menu && menu.id === draftId ? draftMenu : menu)))
      } else {
        // Otherwise add a new draft
        setSavedMenus((prev) => [...prev, draftMenu])
        setDraftId(draftMenu.id)
      }
    }
  }

  // Function to handle finishing menu creation
  const handleFinishMenu = () => {
    const newMenu: SavedMenu = {
      id: draftId || Date.now().toString(),
      name: menuData.name,
      description: menuData.description,
      outlets: menuData.outlets,
      sections: menuData.sections,
      createdAt: new Date().toISOString(),
      status: "Active", // Default to active status
    }

    // If we had a draft, replace it with the completed menu
    if (draftId) {
      setSavedMenus((prev) => prev.map((menu) => (menu.id === draftId ? newMenu : menu)))
    } else {
      // Otherwise add a new menu
      setSavedMenus((prev) => [...prev, newMenu])
    }

    // Show confirmation banner
    setConfirmationMessage(`Menu "${newMenu.name}" created successfully`)
    setShowConfirmation(true)

    setViewMode("list")
    resetMenuData()
  }

  // Function to reset menu data for a new menu
  const resetMenuData = () => {
    setMenuData({
      name: "",
      description: "",
      outlets: [],
      sections: [],
    })
    setCurrentStep(1)
    setSelectedProducts([])
    setDraftId(null)
    setHasInitialMenuData(false)
  }

  // Function to handle deleting a menu
  const handleDeleteMenu = (id: string) => {
    setSavedMenus((prev) => prev.filter((menu) => menu.id !== id))
    if (id === draftId) {
      setDraftId(null)
    }
  }

  // Function to start creating a new menu
  const handleCreateNewMenu = () => {
    resetMenuData()
    setViewMode("create")

    // Collapse the sidebar when creating a new menu
    // Access the sidebar state through the window object
    if (typeof window !== "undefined" && window.sidebarState) {
      window.sidebarState.setCollapsed(true)
    }
  }

  // Function to toggle menu status
  const handleToggleStatus = (id: string, newStatus: "Active" | "Inactive") => {
    setSavedMenus((prev) =>
      prev.map((menu) => {
        if (menu.id === id) {
          // Show confirmation banner
          setConfirmationMessage(`Menu "${menu.name}" ${newStatus === "Active" ? "activated" : "deactivated"}`)
          setShowConfirmation(true)
          return { ...menu, status: newStatus }
        }
        return menu
      }),
    )
  }

  // Function to continue editing a draft
  const continueDraft = (draft: DraftMenu) => {
    setMenuData({
      name: draft.name,
      description: draft.description,
      outlets: draft.outlets,
      sections: draft.sections,
    })
    setCurrentStep(draft.lastStep)
    setDraftId(draft.id)
    setViewMode("create")
    setHasInitialMenuData(true)

    // Collapse the sidebar when continuing a draft
    if (typeof window !== "undefined" && window.sidebarState) {
      window.sidebarState.setCollapsed(true)
    }

    // Recalculate added products
    const addedProductIds: string[] = []
    draft.sections.forEach((section) => {
      section.items.forEach((item) => {
        if (!addedProductIds.includes(item.id)) {
          addedProductIds.push(item.id)
        }
      })
    })
  }

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const activeData = active.data.current

    // Reset the sidepanel drop flag
    droppingOnSidepanel.current = false

    if (activeData && activeData.type === "section") {
      setActiveSectionId(active.id as string)
      // Remove product-specific classes
      document.body.classList.remove("is-dragging-product")
      // Add section-specific class
      document.body.classList.add("is-dragging-section")

      // Add a data attribute to clearly mark this as a section drag
      document.body.setAttribute("data-drag-type", "section")

      // Set a custom property to enforce vertical-only movement
      document.documentElement.style.setProperty("--force-vertical-only", "true")

      // For sections, make sure we also set classes specific to section dragging
      document.body.classList.add("sorting-sections-only")
      // Disable product-related classes
      document.body.classList.remove("is-dragging-product")
      return
    }

    if (activeData && activeData.product) {
      // Check if we're dragging multiple items
      if (activeData.isMultiple && activeData.selectedProductIds && activeData.selectedProductIds.length > 1) {
        // Set a flag and the selected products for the overlay
        document.body.classList.add("is-dragging-multiple")
        setActiveProduct(null) // Clear single product

        // Get the actual product objects from the IDs
        const selectedProducts = activeData.allProducts
          ? activeData.allProducts.filter((p) => activeData.selectedProductIds.includes(p.id))
          : activeData.selectedProducts || [activeData.product]

        setActiveMultipleProducts({
          count: selectedProducts.length,
          products: selectedProducts,
        })
      } else {
        // Single product drag
        setActiveProduct(activeData.product)
        setActiveMultipleProducts(null)
      }
      document.body.classList.add("is-dragging")
      document.body.classList.add("is-dragging-active")
      // Add a class to indicate we're dragging a product specifically
      document.body.classList.add("is-dragging-product")

      // Add a data attribute to clearly mark this as a product drag
      document.body.setAttribute("data-drag-type", "product")

      // For products, set product-specific class
      document.body.classList.add("dragging-products-only")
      document.body.classList.remove("is-dragging-section")
    }
  }

  // Modify the handleDragEnd function to ensure products are only added when dropped in the dropzone
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    // Immediately add the drag-operation-complete class to prevent snap-back
    document.body.classList.add("drag-operation-complete")

    // Check if we're dropping onto the sidepanel
    if (over && over.id === "product-sidepanel") {
      droppingOnSidepanel.current = true
      cleanupDragClasses()
      return
    }

    // If no valid drop target, check if it's dropped back on the sidepanel
    if (!over) {
      // Get the drop coordinates from the event
      const dropPoint = {
        x: (event.activatorEvent as MouseEvent).clientX,
        y: (event.activatorEvent as MouseEvent).clientY,
      }

      // Check if the drop occurred within the sidepanel
      const sidepanel = document.querySelector("[data-sidepanel='true']")
      if (sidepanel) {
        const rect = sidepanel.getBoundingClientRect()
        const isWithinSidepanel =
          dropPoint.x >= rect.left && dropPoint.x <= rect.right && dropPoint.y >= rect.top && dropPoint.y <= rect.bottom

        // If dropped within sidepanel, just clean up and return without showing rejection animation
        if (isWithinSidepanel) {
          droppingOnSidepanel.current = true
          cleanupDragClasses()
          return
        }
      }

      // Otherwise, trigger the drop rejection animation
      setIsDropRejected(true)
      cleanupDragClasses()
      return
    }

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData) {
      cleanupDragClasses()
      return
    }

    // Handle section reordering
    if (activeData.type === "section") {
      // Make sure we have a valid over section
      if (over && active.id !== over.id) {
        // Only reorder if we're over another section
        const activeIndex = menuData.sections.findIndex((section) => section.id === active.id)
        const overIndex = menuData.sections.findIndex((section) => section.id === over.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          // Create a new array with the sections reordered
          const newSections = [...menuData.sections]
          const [movedSection] = newSections.splice(activeIndex, 1)

          // Simplified insertion logic based on cursor position
          const dropPosition = document.body.getAttribute("data-drop-position")

          // Default to inserting at the over index
          let insertIndex = overIndex

          // If dropping at bottom and moving down, keep at target position
          // If dropping at top and moving up, keep at target position
          // If dropping at bottom and moving up, insert AFTER target
          if (dropPosition === "bottom" && overIndex < activeIndex) {
            insertIndex = overIndex + 1
          }

          newSections.splice(insertIndex, 0, movedSection)

          // Update the menu data with the new order
          updateMenuData({ sections: newSections })

          // Show a confirmation message
          setConfirmationMessage("Menu section reordered successfully")
          setShowConfirmation(true)
        }
      }

      // Clean up after section reordering
      cleanupDragClasses()
      return
    }

    // Handle product drops
    if (activeData.type === "product" || activeData.product) {
      // Check if we're dropping on a section header or section content
      const isHeaderDrop = overId.startsWith("header-")
      const sectionId = isHeaderDrop ? overId.replace("header-", "") : overId

      // Verify this is a valid section ID
      const isValidSection = menuData.sections.some((section) => section.id === sectionId)

      // Check if we're dropping directly in the dropzone container
      // If it's a header drop, we allow it (for UX reasons)
      // If it's not a header drop, we need to check if the over element is the section itself
      const isDroppableContainer =
        isHeaderDrop || (overData?.type === "section" && over.id === sectionId) || overData?.accepts === "product"

      // If not a valid section or not dropped in dropzone, reject the drop
      if (!isValidSection || !isDroppableContainer) {
        setIsDropRejected(true)
        cleanupDragClasses()
        return
      }

      // Find the target section
      const targetSection = menuData.sections.find((section) => section.id === sectionId)
      if (!targetSection) {
        setIsDropRejected(true)
        cleanupDragClasses()
        return
      }

      // Check for duplicate products
      if (activeData.isMultiple && activeData.selectedProducts && activeData.selectedProducts.length > 0) {
        // For multiple products, check if any are duplicates
        const hasDuplicates = activeData.selectedProducts.some((product) =>
          targetSection.items.some((item) => item.id === product.id),
        )

        if (hasDuplicates) {
          // Reject the drop if duplicates are found
          setIsDropRejected(true)
          cleanupDragClasses()
          return
        }
      } else if (activeData.product) {
        // For single product, check if it's a duplicate
        const isDuplicate = targetSection.items.some((item) => item.id === activeData.product.id)

        if (isDuplicate) {
          // Reject the drop if it's a duplicate
          setIsDropRejected(true)
          cleanupDragClasses()
          return
        }
      }

      // Get the target section's position for snap animation
      const sectionElement = document.getElementById(sectionId) || document.getElementById(`header-${sectionId}`)

      if (sectionElement) {
        const rect = sectionElement.getBoundingClientRect()

        // Add the snapping class to prevent default DnD Kit animations
        document.body.classList.add("snapping-to-section")

        // Set the snap target for the drag overlay
        setSnapToSection({
          sectionId,
          rect,
        })

        // Handle multiple products being dragged
        if (activeData.isMultiple && activeData.selectedProducts && activeData.selectedProducts.length > 0) {
          // Find the section that was dropped on
          const targetSection = menuData.sections.find((section) => section.id === sectionId)

          if (targetSection) {
            // Delay updating the menu data until after the snap animation
            setTimeout(() => {
              // Update sections with all the products
              const updatedSections = menuData.sections.map((section) => {
                if (section.id === sectionId) {
                  // Add all selected products
                  return {
                    ...section,
                    items: [...section.items, ...activeData.selectedProducts],
                  }
                }
                return section
              })

              updateMenuData({ sections: updatedSections })

              // Auto-open the section if it was a header drop
              if (isHeaderDrop) {
                setOpenSections([sectionId])
                setOpenSectionId(sectionId)
              }

              // Set recently added items for animation - use the last product for scrolling
              if (activeData.selectedProducts.length > 0) {
                const lastProduct = activeData.selectedProducts[activeData.selectedProducts.length - 1]
                setRecentlyAddedItem({
                  sectionId,
                  itemId: lastProduct.id,
                })
              }

              // Clean up after the snap animation
              setTimeout(() => {
                cleanupDragClasses()
                setSnapToSection(null)
              }, 300)
            }, 300) // Delay to allow for snap animation
          }
        } else {
          // Original single product logic
          const { product } = activeData

          // Find the section that was dropped on
          const targetSection = menuData.sections.find((section) => section.id === sectionId)

          if (targetSection) {
            // Delay updating the menu data until after the snap animation
            setTimeout(() => {
              // Update sections
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

              // Auto-open the section if it was a header drop
              if (isHeaderDrop) {
                setOpenSections([sectionId])
                setOpenSectionId(sectionId)
              }

              // Set recently added item for animation and scrolling
              setRecentlyAddedItem({
                sectionId,
                itemId: product.id,
              })

              // Clean up after the snap animation
              setTimeout(() => {
                cleanupDragClasses()
                setSnapToSection(null)
              }, 300)
            }, 300) // Delay to allow for snap animation
          }
        }
      } else {
        // If we couldn't find the section element, reject the drop
        setIsDropRejected(true)
        cleanupDragClasses()
      }
    } else {
      // If not a product or section drop, reject it
      setIsDropRejected(true)
      cleanupDragClasses()
    }
  }

  // Helper function to clean up drag classes
  function cleanupDragClasses() {
    // If we're dropping on the sidepanel, don't trigger the rejection animation
    if (droppingOnSidepanel.current) {
      setIsDropRejected(false)
    }

    setActiveProduct(null)
    setActiveMultipleProducts(null)
    setActiveSectionId(null)
    document.body.classList.remove("is-dragging")
    document.body.classList.remove("is-dragging-active")
    document.body.classList.remove("is-dragging-multiple")
    document.body.classList.remove("is-dragging-product")
    document.body.classList.remove("is-dragging-section")
    document.body.classList.remove("snapping-to-section")
    document.body.removeAttribute("data-drop-position")
    document.body.removeAttribute("data-drag-type") // Remove the drag type attribute

    // Remove the custom property for vertical-only movement
    document.documentElement.style.removeProperty("--force-vertical-only")

    // Remove drag-operation-complete class after a short delay
    setTimeout(() => {
      document.body.classList.remove("drag-operation-complete")
    }, 100)

    document.body.classList.remove("sorting-sections-only")
    document.body.classList.remove("dragging-products-only")
  }

  return (
    <>
      <ConfirmationBanner
        message={confirmationMessage}
        isVisible={showConfirmation}
        onClose={() => setShowConfirmation(false)}
      />
      {viewMode === "list" ? (
        <MenuList
          menus={savedMenus}
          onDeleteMenu={handleDeleteMenu}
          onCreateNewMenu={handleCreateNewMenu}
          onContinueDraft={(draft) => continueDraft(draft as DraftMenu)}
          onToggleStatus={handleToggleStatus}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={(args) => {
            const { active } = args
            const activeData = active.data.current

            // If we're dragging a section, ONLY allow collisions with other sections - STRICT TYPE CHECKING
            if (activeData?.type === "section") {
              // Filter collisions to ONLY include other sections and ensure they're not the same section
              const sectionsOnly = args.droppableContainers.filter((container) => {
                const containerData = container.data.current
                // Only allow sections to interact with sections (not with section headers or products)
                return containerData?.type === "section" && container.id !== active.id
              })

              return rectIntersection({
                ...args,
                droppableContainers: sectionsOnly,
              })
            }

            // For products, ONLY allow dropping into section dropzones, not between sections
            if (activeData?.type === "product" || activeData?.product) {
              // Filter to only include actual dropzones and section headers
              const validDropTargets = args.droppableContainers.filter((container) => {
                const containerData = container.data.current
                const containerId = String(container.id)

                // Only allow product drops on sections or section headers
                return (
                  containerData?.accepts === "product" ||
                  containerData?.type === "section" ||
                  containerId.startsWith("header-")
                )
              })

              // Use rect intersection for accurate product dropping
              return rectIntersection({
                ...args,
                droppableContainers: validDropTargets,
              })
            }

            // Fallback for any other cases
            return rectIntersection(args)
          }}
          // REMOVED: modifiers={[restrictToVerticalAxis]} - Allow products to move freely
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-screen">
            <div className={`${currentStep === 3 ? "flex-1 pr-[400px]" : "w-full"} overflow-hidden flex flex-col`}>
              {/* Make the entire left panel scrollable */}
              <div className="menu-sections-scroll p-6 pb-24">
                <div className="flex items-center gap-2 mb-6">
                  <div
                    className="text-base text-muted-foreground cursor-pointer hover:text-primary"
                    onClick={() => {
                      // Save the current menu as a draft before navigating back
                      saveMenuAsDraft()
                      setViewMode("list")
                    }}
                  >
                    Menus
                  </div>
                  <span className="text-base text-muted-foreground">/</span>
                  <h1 className="text-base font-semibold">Create menu</h1>
                </div>
                <MenuCreationStepper currentStep={currentStep} />
                <div className="mt-8">
                  {currentStep === 1 && (
                    <Step1MenuInfo menuData={menuData} updateMenuData={updateMenuData} nextStep={nextStep} />
                  )}
                  {currentStep === 2 && (
                    <Step2Outlets
                      menuData={menuData}
                      updateMenuData={updateMenuData}
                      nextStep={nextStep}
                      prevStep={prevStep}
                    />
                  )}
                  {currentStep === 3 && (
                    <Step3MenuSections
                      menuData={menuData}
                      updateMenuData={updateMenuData}
                      prevStep={prevStep}
                      onRemoveProduct={handleRemoveProduct}
                      setOpenSectionId={setOpenSectionId}
                      onFinish={handleFinishMenu}
                      dropAnimationData={dropAnimationData}
                      currentStep={currentStep}
                      handleFinishMenu={handleFinishMenu}
                    />
                  )}
                </div>
              </div>

              {/* Fixed bottom buttons */}
              {/* Bottom buttons */}
              {currentStep === 3 && (
                <div className="sticky bottom-0 flex justify-between p-4 bg-background border-t w-full relative">
                  <Button onClick={prevStep} variant="outline">
                    Previous
                  </Button>
                  <Button onClick={handleFinishMenu}>Finish</Button>
                </div>
              )}
            </div>

            {currentStep === 3 && (
              <div className="fixed top-0 right-0 bottom-0 w-[400px] border-l shadow-sm">
                <ProductSidepanel
                  products={initialProducts}
                  onAddProducts={handleAddProducts}
                  selectedProducts={selectedProducts || []}
                  setSelectedProducts={setSelectedProducts}
                />
              </div>
            )}

            {/* Drag overlay - what appears under the cursor while dragging */}
            <DragOverlay>
              {activeProduct && !activeMultipleProducts && (
                <div
                  className={`bg-white border rounded-lg px-4 py-3 shadow-lg w-auto snap-product-overlay ${
                    isDropRejected ? "drop-rejected-overlay" : ""
                  }`}
                  style={
                    snapToSection
                      ? {
                          position: "fixed",
                          left: `${snapToSection.rect.left + snapToSection.rect.width / 2 - 125}px`,
                          top: `${snapToSection.rect.top + snapToSection.rect.height / 2 - 30}px`,
                          width: "250px",
                          zIndex: 9999,
                        }
                      : undefined
                  }
                  data-constrained={window.innerWidth - (window.event?.clientX || 0) < 400}
                >
                  <div className="flex items-start">
                    <img
                      src={activeProduct.image || "/images/wings.png"}
                      alt={activeProduct.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="ml-3 flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{activeProduct.name}</span>
                        <span className="text-sm">{activeProduct.price.toFixed(2)} €</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              {activeMultipleProducts && (
                <div
                  className={`bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 w-auto whitespace-nowrap snap-product-overlay ${
                    isDropRejected ? "drop-rejected-overlay" : ""
                  }`}
                  style={
                    snapToSection
                      ? {
                          position: "fixed",
                          left: `${snapToSection.rect.left + snapToSection.rect.width / 2 - 75}px`,
                          top: `${snapToSection.rect.top + snapToSection.rect.height / 2 - 20}px`,
                          zIndex: 9999,
                        }
                      : undefined
                  }
                >
                  <span className="font-medium">Adding products</span>
                  <span className="bg-white text-primary rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                    {activeMultipleProducts.count}
                  </span>
                </div>
              )}
              {activeSectionId && (
                <div className="bg-white border-2 border-[#3B37F2] rounded-lg shadow-lg p-4 w-[500px] opacity-80">
                  <div className="flex items-center">
                    <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
                    <span className="font-semibold">
                      {menuData.sections.find((s) => s.id === activeSectionId)?.name || "Section"}
                    </span>
                  </div>
                </div>
              )}
            </DragOverlay>
          </div>
        </DndContext>
      )}
    </>
  )
}
