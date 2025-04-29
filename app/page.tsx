"use client"

import { useState, useEffect } from "react"
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
  closestCenter,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { GripVertical } from "lucide-react"

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
]

export default function MenuCreationPage() {
  const [currentStep, setCurrentStep] = useState(1)
  const [viewMode, setViewMode] = useState<"list" | "create">("list")
  const [savedMenus, setSavedMenus] = useState<(SavedMenu | DraftMenu)[]>([])
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
  const [addedProducts, setAddedProducts] = useState<string[]>([])
  const [selectedProducts, setSelectedProducts] = useState<string[]>([])
  const [openSectionId, setOpenSectionId] = useState<string | null>("section-1")
  const [activeProduct, setActiveProduct] = useState<Product | null>(null)
  const [activeMultipleProducts, setActiveMultipleProducts] = useState<{ count: number; products: Product[] } | null>(
    null,
  )
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [draftId, setDraftId] = useState<string | null>(null)

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

  useEffect(() => {
    if (menuData.sections.length === 0) {
      setMenuData((prev) => ({
        ...prev,
        sections: [
          { id: "section-1", name: "Appetizers", items: [] },
          { id: "section-2", name: "Mains", items: [] },
          { id: "section-3", name: "Desserts", items: [] },
          { id: "section-4", name: "Drinks", items: [] },
        ],
      }))
    }
  }, [menuData.sections.length])

  // Load saved menus from localStorage on component mount
  useEffect(() => {
    const savedMenusFromStorage = localStorage.getItem("savedMenus")
    if (savedMenusFromStorage) {
      setSavedMenus(JSON.parse(savedMenusFromStorage))
    }
  }, [])

  // Save menus to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("savedMenus", JSON.stringify(savedMenus))
  }, [savedMenus])

  const updateMenuData = (data: Partial<typeof menuData>) => {
    setMenuData((prev) => ({ ...prev, ...data }))
  }

  const nextStep = () => setCurrentStep((prev) => Math.min(prev + 1, 3))
  const prevStep = () => setCurrentStep((prev) => Math.max(prev - 1, 1))

  const handleRemoveProduct = (sectionId: string, productId: string) => {
    const updatedSections = menuData.sections.map((section) => {
      if (section.id === sectionId) {
        return {
          ...section,
          items: section.items.filter((item) => item.id !== productId),
        }
      }
      return section
    })
    updateMenuData({ sections: updatedSections })
    setAddedProducts((prev) => prev.filter((id) => id !== productId))
  }

  const handleAddProducts = (productIds: string[]) => {
    if (!openSectionId) return

    const productsToAdd = initialProducts.filter((p) => productIds.includes(p.id) && !addedProducts.includes(p.id))
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
    setAddedProducts((prev) => [...prev, ...productsToAdd.map((p) => p.id)])
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
    }

    // If we had a draft, replace it with the completed menu
    if (draftId) {
      setSavedMenus((prev) => prev.map((menu) => (menu.id === draftId ? newMenu : menu)))
    } else {
      // Otherwise add a new menu
      setSavedMenus((prev) => [...prev, newMenu])
    }

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
    setAddedProducts([])
    setSelectedProducts([])
    setDraftId(null)
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

    // Recalculate added products
    const addedProductIds: string[] = []
    draft.sections.forEach((section) => {
      section.items.forEach((item) => {
        if (!addedProductIds.includes(item.id)) {
          addedProductIds.push(item.id)
        }
      })
    })
    setAddedProducts(addedProductIds)
  }

  // Handle drag start
  function handleDragStart(event: DragStartEvent) {
    const { active } = event
    const activeData = active.data.current

    if (activeData && activeData.type === "section") {
      setActiveSectionId(active.id as string)
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
    }
  }

  // Handle drag end
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event

    document.body.classList.remove("is-dragging")
    document.body.classList.remove("is-dragging-active")
    document.body.classList.remove("is-dragging-multiple")

    // Reset active states
    setActiveProduct(null)
    setActiveMultipleProducts(null)
    setActiveSectionId(null)

    if (!over) return

    const activeId = String(active.id)
    const overId = String(over.id)
    const activeData = active.data.current
    const overData = over.data.current

    if (!activeData) return

    console.log("Active data:", activeData)
    console.log("Over data:", overData)

    // Handle section reordering
    if (activeData.type === "section" && overData?.type === "section") {
      if (active.id !== over.id) {
        // Find the indices of the active and over sections
        const activeIndex = menuData.sections.findIndex((section) => section.id === active.id)
        const overIndex = menuData.sections.findIndex((section) => section.id === over.id)

        if (activeIndex !== -1 && overIndex !== -1) {
          // Create a new array with the sections reordered
          const newSections = [...menuData.sections]
          const [movedSection] = newSections.splice(activeIndex, 1)
          newSections.splice(overIndex, 0, movedSection)

          // Update the menu data with the new order
          updateMenuData({ sections: newSections })
        }
      }
      return
    }

    // Handle product drops
    if (activeData.type === "product" && overData?.type === "section") {
      const sectionId = overId

      // Handle multiple products being dragged
      if (activeData.isMultiple && activeData.selectedProducts && activeData.selectedProducts.length > 0) {
        // Find the section that was dropped on
        const targetSection = menuData.sections.find((section) => section.id === sectionId)

        if (targetSection) {
          // Filter out products that are already in the target section
          const productsToAdd = activeData.selectedProducts.filter(
            (product: Product) =>
              !addedProducts.includes(product.id) || !targetSection.items.some((item) => item.id === product.id),
          )

          if (productsToAdd.length > 0) {
            // Update sections with all the products
            const updatedSections = menuData.sections.map((section) => {
              if (section.id === sectionId) {
                // Create a new array with unique products
                const newItems = [...section.items]

                // Add each product if it's not already in the section
                productsToAdd.forEach((product) => {
                  if (!newItems.some((item) => item.id === product.id)) {
                    newItems.push(product)
                  }
                })

                return {
                  ...section,
                  items: newItems,
                }
              }
              return section
            })

            updateMenuData({ sections: updatedSections })

            // Update added products - only add products that weren't already added
            const newProductIds = productsToAdd.filter((p) => !addedProducts.includes(p.id)).map((p) => p.id)

            if (newProductIds.length > 0) {
              setAddedProducts((prev) => [...prev, ...newProductIds])
            }
          }

          return
        }
      }

      // Original single product logic
      const { product } = activeData

      // Find the section that was dropped on
      const targetSection = menuData.sections.find((section) => section.id === sectionId)

      if (targetSection) {
        // Check if product is already in any section
        const productInSections = menuData.sections.some((section) =>
          section.items.some((item) => item.id === product.id),
        )

        // Update sections
        const updatedSections = menuData.sections.map((section) => {
          if (section.id === sectionId) {
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

        updateMenuData({ sections: updatedSections })

        // Add to addedProducts if not already there
        if (!addedProducts.includes(product.id)) {
          setAddedProducts((prev) => [...prev, product.id])
        }
      }
    }
  }

  return (
    <>
      {viewMode === "list" ? (
        <MenuList
          menus={savedMenus}
          onDeleteMenu={handleDeleteMenu}
          onCreateNewMenu={handleCreateNewMenu}
          onContinueDraft={(draft) => continueDraft(draft as DraftMenu)}
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex min-h-screen">
            <div className={`${currentStep === 3 ? "flex-1" : "w-full"} p-6 overflow-hidden`}>
              <div className="space-y-2 mb-6">
                <div
                  className="text-sm text-muted-foreground cursor-pointer hover:text-primary"
                  onClick={() => {
                    // Save the current menu as a draft before navigating back
                    saveMenuAsDraft()
                    setViewMode("list")
                  }}
                >
                  Menus
                </div>
                <h1 className="text-2xl font-semibold">Create menu</h1>
              </div>

              <MenuCreationStepper currentStep={currentStep} />

              <div className="mt-8 h-[calc(100vh-200px)]">
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
                  />
                )}
              </div>
            </div>

            {currentStep === 3 && (
              <div className="w-[468px]">
                <ProductSidepanel
                  products={initialProducts}
                  onAddProducts={handleAddProducts}
                  selectedProducts={selectedProducts}
                  setSelectedProducts={setSelectedProducts}
                  addedProducts={addedProducts}
                />
              </div>
            )}

            {/* Drag overlay - what appears under the cursor while dragging */}
            <DragOverlay>
              {activeProduct && !activeMultipleProducts && (
                <div className="bg-white border rounded-lg px-4 py-3 shadow-lg w-auto">
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
                <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 shadow-lg flex items-center gap-3 w-auto whitespace-nowrap">
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

