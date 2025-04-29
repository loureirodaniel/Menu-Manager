import { Check } from "lucide-react"

interface StepperProps {
  currentStep: number
}

export function MenuCreationStepper({ currentStep }: StepperProps) {
  const steps = ["Menu name", "Outlets", "Products"]

  return (
    <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center flex-1 max-w-[200px]">
          <div className="flex flex-col items-center gap-2">
            <div
              className={`flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 ${
                index + 1 <= currentStep ? "bg-primary border-primary text-primary-foreground" : "border-gray-300"
              }`}
            >
              {index + 1 < currentStep ? <Check className="w-5 h-5" /> : <span>{index + 1}</span>}
            </div>
            <span className={`text-sm ${index + 1 <= currentStep ? "text-primary font-medium" : "text-gray-500"}`}>
              {step}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`h-[2px] flex-1 mx-4 ${index + 1 < currentStep ? "bg-primary" : "bg-gray-300"}`} />
          )}
        </div>
      ))}
    </div>
  )
}

