"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Step1Props {
  menuData: {
    name: string
    description: string
  }
  updateMenuData: (data: Partial<{ name: string; description: string }>) => void
  nextStep: () => void
}

export function Step1MenuInfo({ menuData, updateMenuData, nextStep }: Step1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    nextStep()
  }

  return (
    <div className="flex justify-center w-full">
      <form onSubmit={handleSubmit} className="space-y-4 w-[50vw]">
        <div>
          <Label htmlFor="menu-name">Menu Name</Label>
          <Input
            id="menu-name"
            value={menuData.name}
            onChange={(e) => updateMenuData({ name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="menu-description">Menu Description</Label>
          <Textarea
            id="menu-description"
            value={menuData.description}
            onChange={(e) => updateMenuData({ description: e.target.value })}
          />
        </div>
        <Button type="submit">Next</Button>
      </form>
    </div>
  )
}
