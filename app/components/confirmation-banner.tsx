"use client"

import { useState, useEffect } from "react"
import { CheckCircle2, X } from "lucide-react"

interface ConfirmationBannerProps {
  message: string
  isVisible: boolean
  onClose: () => void
  duration?: number
}

export function ConfirmationBanner({ message, isVisible, onClose, duration = 30000 }: ConfirmationBannerProps) {
  const [isClosing, setIsClosing] = useState(false)
  const [isEntering, setIsEntering] = useState(true)

  useEffect(() => {
    if (isVisible) {
      setIsEntering(true)
      // Remove entering state after animation completes
      const enterTimer = setTimeout(() => {
        setIsEntering(false)
      }, 300)

      // Set up auto-dismiss timer
      const dismissTimer = setTimeout(() => {
        setIsClosing(true)
        setTimeout(onClose, 300) // Allow time for exit animation
      }, duration)

      return () => {
        clearTimeout(enterTimer)
        clearTimeout(dismissTimer)
      }
    }
  }, [isVisible, onClose, duration])

  const handleClose = () => {
    setIsClosing(true)
    setTimeout(onClose, 300) // Allow time for exit animation
  }

  if (!isVisible) return null

  return (
    <div
      className="fixed top-6 right-6 z-50"
      style={{
        perspective: "1000px",
      }}
    >
      <div
        className={`bg-white border border-gray-200 rounded-lg shadow-md px-4 py-2 flex items-center justify-between w-[320px] transition-all duration-300 transform ${
          isEntering ? "translate-x-[100%] opacity-0" : "translate-x-0 opacity-100"
        } ${isClosing ? "translate-x-[120%] opacity-0" : ""}`}
        style={{
          transformOrigin: "right center",
          transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <div className="flex items-center">
          <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
          <span className="text-sm font-medium">{message}</span>
        </div>
        <button onClick={handleClose} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0">
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
