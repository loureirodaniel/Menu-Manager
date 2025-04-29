"use client"

import { useState, useEffect } from "react"
import { DebugOverlay } from "./debug-overlay"

export default function DndDebugHelper() {
  const [isActive, setIsActive] = useState(false)
  const [droppableElements, setDroppableElements] = useState<HTMLElement[]>([])
  const [draggableElements, setDraggableElements] = useState<HTMLElement[]>([])

  useEffect(() => {
    // Find all droppable and draggable elements
    const droppables = document.querySelectorAll('[data-droppable="true"]')
    const draggables = document.querySelectorAll(".draggable-item")

    setDroppableElements(Array.from(droppables) as HTMLElement[])
    setDraggableElements(Array.from(draggables) as HTMLElement[])

    // Add event listener for drag start
    const handleDragStart = () => {
      document.body.classList.add("is-dragging")

      // Highlight all droppable areas
      droppables.forEach((el) => {
        el.classList.add("highlight-droppable")
      })
    }

    // Add event listener for drag end
    const handleDragEnd = () => {
      document.body.classList.remove("is-dragging")

      // Remove highlight from all droppable areas
      droppables.forEach((el) => {
        el.classList.remove("highlight-droppable")
      })
    }

    document.addEventListener("dragstart", handleDragStart)
    document.addEventListener("dragend", handleDragEnd)

    return () => {
      document.removeEventListener("dragstart", handleDragStart)
      document.removeEventListener("dragend", handleDragEnd)
    }
  }, [])

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button onClick={() => setIsActive(!isActive)} className="bg-black text-white px-3 py-1 rounded-md text-sm">
        {isActive ? "Hide Debug" : "Show Debug"}
      </button>

      <DebugOverlay enabled={isActive} />

      {isActive && (
        <div className="fixed top-4 right-4 bg-black/80 text-white p-4 rounded-lg text-xs font-mono">
          <div>Droppable Elements: {droppableElements.length}</div>
          <div>Draggable Elements: {draggableElements.length}</div>
          <div className="mt-2">
            <div>Collision Detection Tips:</div>
            <ul className="list-disc pl-4 mt-1">
              <li>Ensure elements have proper dimensions</li>
              <li>Check z-index values during drag</li>
              <li>Verify CSS isn't interfering with hit testing</li>
              <li>Try different collision algorithms</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

