import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
}

export function MenuCreationStepper({ currentStep }: StepperProps) {
  const steps = ["Menu name", "Outlets", "Products"]

  return (
    <div className="max-w-2xl mx-auto flex items-center justify-center gap-4 w-full">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 max-w-[200px]">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center w-6 h-6 p-1 rounded-full border-2 shrink-0 ${
                index + 1 <= currentStep ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
              }`}
            >
              {index + 1 < currentStep ? (
                <Check className="w-5 h-5" />
              ) : (
                <span className="font-inter text-xs font-medium">{index + 1}</span>
              )}
            </div>
            <span className={`text-sm text-gray-700 ${index + 1 <= currentStep ? "font-medium" : ""}`}>{step}</span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-[2px] flex-1 mx-4 ${index + 1 < currentStep ? "bg-primary" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  )
}
