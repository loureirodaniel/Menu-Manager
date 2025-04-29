"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"

interface Step2Props {
  menuData: {
    outlets: string[]
  }
  updateMenuData: (data: Partial<{ outlets: string[] }>) => void
  nextStep: () => void
  prevStep: () => void
}

export function Step2Outlets({ menuData, updateMenuData, nextStep, prevStep }: Step2Props) {
  const outlets = ["Main Restaurant", "Bar", "Terrace", "Room Service"]

  const handleOutletChange = (outlet: string) => {
    const updatedOutlets = menuData.outlets.includes(outlet)
      ? menuData.outlets.filter((o) => o !== outlet)
      : [...menuData.outlets, outlet]
    updateMenuData({ outlets: updatedOutlets })
  }

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      // Select all outlets
      updateMenuData({ outlets: [...outlets] })
    } else {
      // Deselect all outlets
      updateMenuData({ outlets: [] })
    }
  }

  // Check if all outlets are selected
  const allSelected = outlets.length > 0 && outlets.every((outlet) => menuData.outlets.includes(outlet))

  // Check if some outlets are selected (for indeterminate state)
  const someSelected = menuData.outlets.length > 0 && !allSelected

  return (
    <div className="flex justify-center w-full">
      <div className="space-y-4 w-[50vw]">
        <div className="space-y-4">
          {/* Individual outlets */}
          <div className="space-y-2 pl-1">
            {outlets.map((outlet) => (
              <div key={outlet} className="flex items-center space-x-2">
                <Checkbox
                  id={outlet}
                  checked={menuData.outlets.includes(outlet)}
                  onCheckedChange={() => handleOutletChange(outlet)}
                  className="checkbox"
                />
                <Label htmlFor={outlet}>{outlet}</Label>
              </div>
            ))}
          </div>
        </div>
        <div className="flex space-x-2">
          <Button onClick={prevStep} variant="outline">
            Previous
          </Button>
          <Button onClick={nextStep}>Next</Button>
        </div>
      </div>
    </div>
  )
}
