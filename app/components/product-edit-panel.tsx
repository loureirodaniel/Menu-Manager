"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { X, Info } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { motion, AnimatePresence } from "framer-motion"

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

interface ProductEditPanelProps {
  product: Product | null
  isOpen: boolean
  onClose: () => void
  onSave: (updatedProduct: Product) => void
}

export function ProductEditPanel({ product, isOpen, onClose, onSave }: ProductEditPanelProps) {
  const [formData, setFormData] = useState<Product>({
    id: "",
    name: "",
    price: 0,
    image: "",
    dietary: {
      vegan: false,
      glutenFree: false,
      seafood: false,
    },
  })

  // Update form data when product changes
  useEffect(() => {
    if (product) {
      setFormData({
        ...product,
        dietary: {
          vegan: product.dietary?.vegan || false,
          glutenFree: product.dietary?.glutenFree || false,
          seafood: product.dietary?.seafood || false,
        },
      })
    }
  }, [product])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target

    if (name === "price") {
      // Handle price as a number
      setFormData({
        ...formData,
        [name]: Number.parseFloat(value) || 0,
      })
    } else {
      setFormData({
        ...formData,
        [name]: value,
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black/50 z-[110] flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.div
              className="bg-white shadow-xl w-full max-w-md h-[calc(100vh-32px)] my-4 mr-4 overflow-auto border-l rounded-lg z-[120]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold">Edit product</h2>
                  <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100" aria-label="Close panel">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <Tabs defaultValue="description">
                  <TabsList className="mb-6 border-b w-full justify-start rounded-none h-auto p-0 bg-transparent">
                    <TabsTrigger
                      value="description"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2 h-auto"
                    >
                      Description
                    </TabsTrigger>
                    <TabsTrigger
                      value="variants"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2 h-auto"
                    >
                      Variants
                    </TabsTrigger>
                    <TabsTrigger
                      value="modifiers"
                      className="rounded-none data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none px-4 py-2 h-auto"
                    >
                      Modifiers
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="description" className="mt-0">
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="space-y-2">
                        <label htmlFor="name" className="block text-sm font-medium">
                          Product name
                        </label>
                        <Input id="name" name="name" value={formData.name} onChange={handleInputChange} required />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="description" className="block text-sm font-medium">
                          Description
                        </label>
                        <Input
                          id="description"
                          name="description"
                          value={formData.dietary?.glutenFree ? "Gluten free" : ""}
                          onChange={(e) => {
                            // This is simplified - in a real app you'd handle description separately
                            setFormData({
                              ...formData,
                              dietary: {
                                ...formData.dietary,
                                glutenFree: e.target.value.toLowerCase().includes("gluten free"),
                              },
                            })
                          }}
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="price" className="block text-sm font-medium">
                          Price (incl. tax)
                        </label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2">$</span>
                          <Input
                            id="price"
                            name="price"
                            type="number"
                            step="0.01"
                            min="0"
                            value={formData.price}
                            onChange={handleInputChange}
                            className="pl-8"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor="notes" className="block text-sm font-medium">
                          Internal notes
                        </label>
                        <Textarea id="notes" name="notes" rows={3} />
                      </div>

                      <div className="bg-blue-50 p-4 rounded-lg flex gap-3 items-start">
                        <Info className="h-5 w-5 text-blue-500 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">Product changes only affect this menu</p>
                          <p className="text-sm text-gray-600 mt-1">
                            Any changes you make to products in this menu will only apply here. Products in other menus
                            and inventory will remain unaffected.
                          </p>
                        </div>
                      </div>
                    </form>
                  </TabsContent>

                  <TabsContent value="variants">
                    <div className="py-8 text-center text-gray-500">
                      Variants configuration will be available in a future update.
                    </div>
                  </TabsContent>

                  <TabsContent value="modifiers">
                    <div className="py-8 text-center text-gray-500">
                      Modifiers configuration will be available in a future update.
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="sticky bottom-0 left-0 right-0 flex justify-between pt-4 pb-4 border-t bg-white mt-8 z-10">
                  <Button variant="outline" onClick={onClose}>
                    Cancel
                  </Button>
                  <Button onClick={handleSubmit} className="bg-indigo-600 hover:bg-indigo-700">
                    Save
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
