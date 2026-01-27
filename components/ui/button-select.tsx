"use client"

import { cn } from "@/lib/utils"
import { Check } from "lucide-react"

interface ButtonSelectOption {
  value: string
  label: string
  description?: string
}

interface ButtonSelectProps {
  options: ButtonSelectOption[]
  value: string | string[]
  onChange: (value: string | string[]) => void
  multiple?: boolean
  columns?: 2 | 3 | 4 | 5 | 6
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ButtonSelect({
  options,
  value,
  onChange,
  multiple = false,
  columns = 3,
  size = "md",
  className,
}: ButtonSelectProps) {
  const selectedValues = Array.isArray(value) ? value : value ? [value] : []

  const handleClick = (optionValue: string) => {
    if (multiple) {
      const newValues = selectedValues.includes(optionValue)
        ? selectedValues.filter((v) => v !== optionValue)
        : [...selectedValues, optionValue]
      onChange(newValues)
    } else {
      onChange(optionValue === value ? "" : optionValue)
    }
  }

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  }

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  }

  return (
    <div className={cn("grid gap-2", gridCols[columns], className)}>
      {options.map((option) => {
        const isSelected = selectedValues.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 font-medium transition-all",
              sizeStyles[size],
              isSelected
                ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50/50",
            )}
          >
            {isSelected && <Check className="absolute right-2 top-2 h-4 w-4 text-pink-500" />}
            <span>{option.label}</span>
            {option.description && <span className="mt-0.5 text-xs text-gray-500">{option.description}</span>}
          </button>
        )
      })}
    </div>
  )
}

interface ButtonSelectMultiProps {
  options: ButtonSelectOption[]
  value: string[]
  onChange: (value: string[]) => void
  columns?: 2 | 3 | 4 | 5 | 6
  size?: "sm" | "md" | "lg"
  className?: string
}

export function ButtonSelectMulti({
  options,
  value,
  onChange,
  columns = 3,
  size = "md",
  className,
}: ButtonSelectMultiProps) {
  const handleClick = (optionValue: string) => {
    const newValues = value.includes(optionValue) ? value.filter((v) => v !== optionValue) : [...value, optionValue]
    onChange(newValues)
  }

  const gridCols = {
    2: "grid-cols-2",
    3: "grid-cols-2 sm:grid-cols-3",
    4: "grid-cols-2 sm:grid-cols-4",
    5: "grid-cols-2 sm:grid-cols-3 md:grid-cols-5",
    6: "grid-cols-3 sm:grid-cols-6",
  }

  const sizeStyles = {
    sm: "px-3 py-2 text-sm",
    md: "px-4 py-3 text-base",
    lg: "px-5 py-4 text-lg",
  }

  return (
    <div className={cn("grid gap-2", gridCols[columns], className)}>
      {options.map((option) => {
        const isSelected = value.includes(option.value)
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => handleClick(option.value)}
            className={cn(
              "relative flex flex-col items-center justify-center rounded-lg border-2 font-medium transition-all",
              sizeStyles[size],
              isSelected
                ? "border-pink-500 bg-pink-50 text-pink-700 shadow-md"
                : "border-gray-200 bg-white text-gray-700 hover:border-pink-300 hover:bg-pink-50/50",
            )}
          >
            {isSelected && <Check className="absolute right-2 top-2 h-4 w-4 text-pink-500" />}
            <span>{option.label}</span>
            {option.description && <span className="mt-0.5 text-xs text-gray-500">{option.description}</span>}
          </button>
        )
      })}
    </div>
  )
}
