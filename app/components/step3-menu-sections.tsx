"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Accordion, AccordionContent, AccordionItem } from "@/components/ui/accordion"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, Plus, GripVertical, ChevronDown } from "lucide-react"
import { useDroppable } from "@dnd-kit/core"
import { SortableContext, verticalListSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { ScrollArea } from "@/components/ui/scroll-area"

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
}

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
}: Step3Props) {
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null)
  const [selectedItems, setSelectedItems] = useState<{ [sectionId: string]: string[] }>({})
  const [openSections, setOpenSections] = useState<string[]>(["section-1"])
  const [newSectionId, setNewSectionId] = useState<string | null>(null)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [isDraggingSection, setIsDraggingSection] = useState(false)

  // Initialize sections if empty
  useState(() => {
    if (menuData.sections.length === 0) {
      updateMenuData({ sections: defaultSections })
    }
  })

  // Effect to scroll to newly added section
  useEffect(() => {
    if (newSectionId) {
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

  // Effect to close all accordions when dragging sections
  useEffect(() => {
    if (isDraggingSection && openSections.length > 0) {
      setOpenSections([])
      setOpenSectionId(null)
    }
  }, [isDraggingSection, openSections, setOpenSectionId])

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
    } else {
      setOpenSections([])
      setOpenSectionId(null)
    }
  }

  return (
    <div className="flex flex-col h-full overflow-hidden pb-16">
      <h2 className="text-2xl font-semibold mb-4">{menuData.name}</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Customize your menu sections and add products to each section. Drag sections to reorder them.
      </p>

      <ScrollArea className="flex-1 pr-4" ref={scrollContainerRef}>
        <div className="w-full">
          <Accordion type="single" value={openSections[0]} onValueChange={handleAccordionChange} className="w-full">
            <SortableContext
              items={menuData.sections.map((section) => section.id)}
              strategy={verticalListSortingStrategy}
            >
              {menuData.sections.map((section) => (
                <SortableMenuSection
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
                />
              ))}
            </SortableContext>
          </Accordion>
        </div>
      </ScrollArea>

      <Button variant="ghost" className="mt-4 text-primary justify-start px-0 font-normal" onClick={addSection}>
        <Plus className="mr-2 h-4 w-4" />
        Add menu section
      </Button>

      <div className="fixed bottom-0 left-0 right-0 flex justify-between p-4 bg-background border-t z-10 max-w-[calc(100%-468px)]">
        <Button onClick={prevStep} variant="outline">
          Previous
        </Button>
        <Button onClick={onFinish}>Finish</Button>
      </div>
    </div>
  )
}

// Create a new SortableMenuSection component that wraps MenuSectionItem
function SortableMenuSection(props: MenuSectionItemProps & { setIsDraggingSection: (isDragging: boolean) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: props.section.id,
    data: {
      type: "section",
      section: props.section,
    },
  })

  // Update parent component about dragging state
  useEffect(() => {
    props.setIsDraggingSection(isDragging)
  }, [isDragging, props.setIsDraggingSection])

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0 : 1,
    zIndex: isDragging ? 1000 : 1,
    position: "relative" as const,
    width: "auto",
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`mb-2 sortable-section ${isDragging ? "border-primary" : ""}`}
      data-dragging={isDragging}
      id={`section-${props.section.id}`}
    >
      <div className="relative">
        <div
          {...attributes}
          {...listeners}
          className="absolute left-0 top-4 p-2 cursor-grab active:cursor-grabbing touch-none z-10 drag-handle"
        >
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="pl-8">
          <MenuSectionItem {...props} />
        </div>
      </div>
    </div>
  )
}

interface MenuSectionItemProps {
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
}

function MenuSectionItem({
  section,
  onRemoveProduct,
  onDeleteSection,
  onSectionNameChange,
  isEditing,
  setEditingSectionId,
  selectedItems,
  onToggleSelection,
  onDeleteSelected,
  isOpen,
  onToggleAccordion,
}: MenuSectionItemProps) {
  // Function to toggle the accordion
  const toggleAccordion = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleAccordion(isOpen ? "" : section.id)
  }

  return (
    <AccordionItem value={section.id} className="border-none">
      <div className="sticky top-0 bg-background z-10 shadow-sm">
        <div className="flex items-center justify-between w-full py-4 hover:no-underline">
          <div className="flex items-center flex-1">
            <div className="flex flex-col items-start">
              {isEditing ? (
                <Input
                  value={section.name}
                  onChange={(e) => onSectionNameChange(section.id, e.target.value)}
                  onBlur={() => setEditingSectionId(null)}
                  autoFocus
                />
              ) : (
                <>
                  <span className="font-semibold text-lg">{section.name}</span>
                  <span className="text-sm text-muted-foreground">{section.items.length} products added</span>
                </>
              )}
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {selectedItems.length > 0 && (
              <div
                className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteSelected()
                }}
              >
                <Trash2 className="h-4 w-4" />
              </div>
            )}
            <div
              className="p-2 hover:bg-gray-100 rounded-full cursor-pointer"
              onClick={(e) => {
                e.stopPropagation()
                setEditingSectionId(section.id)
              }}
            >
              <Edit2 className="h-4 w-4" />
            </div>
            <div className="p-2 hover:bg-gray-100 rounded-full cursor-pointer" onClick={toggleAccordion}>
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "transform rotate-180" : ""}`}
              />
            </div>
          </div>
        </div>
      </div>
      <AccordionContent>
        <SectionContent section={section} selectedItems={selectedItems} onToggleSelection={onToggleSelection} />
      </AccordionContent>
    </AccordionItem>
  )
}

function SectionContent({
  section,
  selectedItems,
  onToggleSelection,
}: {
  section: MenuSection
  selectedItems: string[]
  onToggleSelection: (sectionId: string, itemId: string) => void
}) {
  // Make the dropzone area droppable
  const { setNodeRef, isOver } = useDroppable({
    id: section.id,
    data: {
      type: "section",
      accepts: ["product"],
      sectionId: section.id,
    },
  })

  return (
    <div className="space-y-4 p-4">
      {/* Items display area - two column grid layout */}
      {section.items.length > 0 && (
        <div className="grid grid-cols-2 gap-4 mb-4">
          {section.items.map((item) => (
            <ProductItem
              key={item.id}
              item={item}
              isSelected={selectedItems.includes(item.id)}
              onToggleSelection={() => onToggleSelection(section.id, item.id)}
            />
          ))}
        </div>
      )}

      {/* Dropzone area - always visible below items */}
      <div
        ref={setNodeRef}
        data-droppable="true"
        data-over={isOver}
        className={`min-h-[100px] rounded-lg border-2 ${
          isOver ? "border-primary bg-primary/5 border-dashed" : "border-gray-200 border-dashed"
        } transition-colors duration-200 p-4 flex items-center justify-center mt-4`}
      >
        <div className="text-center text-muted-foreground">
          Drag and drop products here to add them to this section.
        </div>
      </div>
    </div>
  )
}

function ProductItem({
  item,
  isSelected,
  onToggleSelection,
}: {
  item: Product
  isSelected: boolean
  onToggleSelection: () => void
}) {
  return (
    <div className="flex flex-col bg-white border rounded-lg overflow-hidden">
      <div className="flex items-start p-4">
        <Checkbox checked={isSelected} onCheckedChange={onToggleSelection} className="mt-1" />
        <div className="ml-3 flex items-start flex-1">
          <img src={item.image || "/placeholder.svg"} alt={item.name} className="w-12 h-12 rounded-lg object-cover" />
          <div className="ml-3 flex-1">
            <div className="flex justify-between">
              <span className="font-medium">{item.name}</span>
              <span className="text-sm">{item.price.toFixed(2)} €</span>
            </div>
            <div className="flex gap-1 mt-1">
              {item.dietary?.vegan && (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">V</span>
                </div>
              )}
              {item.dietary?.glutenFree && (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">G</span>
                </div>
              )}
              {item.dietary?.seafood && (
                <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs">S</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Step3MenuSections

