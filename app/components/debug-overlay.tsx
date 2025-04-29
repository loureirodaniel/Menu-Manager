"use client"

import { useState, useEffect } from "react"

interface DebugOverlayProps {
  enabled?: boolean
}

export function DebugOverlay({ enabled = false }: DebugOverlayProps) {
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [elements, setElements] = useState<{ id: string; rect: DOMRect }[]>([])

  useEffect(() => {
    if (!enabled) return

    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY })

      // Find all droppable elements
      const droppables = document.querySelectorAll('[data-droppable="true"]')
      const elementsData = Array.from(droppables).map((el) => {
        const rect = el.getBoundingClientRect()
        return {
          id: el.id || "unknown",
          rect,
        }
      })

      setElements(elementsData)
    }

    window.addEventListener("mousemove", handleMouseMove)
    return () => window.removeEventListener("mousemove", handleMouseMove)
  }, [enabled])

  if (!enabled) return null

  return (
    <div className="fixed bottom-4 right-4 bg-black/80 text-white p-4 rounded-lg z-50 text-xs font-mono">
      <div>
        Mouse: {mousePos.x}, {mousePos.y}
      </div>
      <div className="mt-2">
        <div>Droppable Elements:</div>
        {elements.map((el, i) => (
          <div key={i} className="mt-1">
            {el.id}: {Math.round(el.rect.left)},{Math.round(el.rect.top)} - {Math.round(el.rect.right)},
            {Math.round(el.rect.bottom)}
          </div>
        ))}
      </div>
    </div>
  )
}

