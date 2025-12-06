"use client"

import * as React from "react"
import { Check, ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/lib/utils"

interface SelectProps {
  value?: string
  onValueChange?: (value: string) => void
  children: React.ReactNode
}

interface SelectTriggerProps {
  className?: string
  children: React.ReactNode
}

interface SelectContentProps {
  className?: string
  children: React.ReactNode
}

interface SelectItemProps {
  value: string
  className?: string
  children: React.ReactNode
}

interface SelectValueProps {
  placeholder?: string
  value?: string
  children?: React.ReactNode
}

const SelectContext = React.createContext<{
  value?: string
  onValueChange?: (value: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export const Select: React.FC<SelectProps> = ({ value, onValueChange, children }) => {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <SelectContext.Provider value={{ value, onValueChange, isOpen, setIsOpen }}>
      <div className="relative">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

export const SelectTrigger = React.forwardRef<HTMLButtonElement, SelectTriggerProps>(
  ({ className, children }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(SelectContext)

    return (
      <button
        ref={ref}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1",
          className
        )}
      >
        {children}
        {isOpen ? (
          <ChevronUp className="h-4 w-4 opacity-50" />
        ) : (
          <ChevronDown className="h-4 w-4 opacity-50" />
        )}
      </button>
    )
  }
)
SelectTrigger.displayName = "SelectTrigger"

export const SelectContent = React.forwardRef<HTMLDivElement, SelectContentProps>(
  ({ className, children }, ref) => {
    const { isOpen, setIsOpen } = React.useContext(SelectContext)
    const contentRef = React.useRef<HTMLDivElement | null>(null)

    React.useEffect(() => {
      if (!isOpen) {
        return
      }

      const handleClickOutside = (event: MouseEvent) => {
        if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
          setIsOpen(false)
        }
      }

      const handleEscape = (event: KeyboardEvent) => {
        if (event.key === "Escape") {
          setIsOpen(false)
        }
      }

      document.addEventListener("mousedown", handleClickOutside)
      document.addEventListener("keydown", handleEscape)

      return () => {
        document.removeEventListener("mousedown", handleClickOutside)
        document.removeEventListener("keydown", handleEscape)
      }
    }, [isOpen, setIsOpen])

    if (!isOpen) return null

    const setRefs = (node: HTMLDivElement | null) => {
      contentRef.current = node
      if (typeof ref === "function") {
        ref(node)
      } else if (ref) {
        ;(ref as React.MutableRefObject<HTMLDivElement | null>).current = node
      }
    }

    return (
      <div
        ref={setRefs}
        className={cn(
          "absolute top-full left-0 right-0 z-50 mt-1 max-h-96 min-w-[8rem] overflow-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
          className
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-1">
          {children}
        </div>
      </div>
    )
  }
)
SelectContent.displayName = "SelectContent"

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(
  ({ value, className, children }, ref) => {
    const { value: selectedValue, onValueChange, setIsOpen } = React.useContext(SelectContext)
    const isSelected = selectedValue === value

    return (
      <div
        ref={ref}
        onClick={() => {
          onValueChange?.(value)
          setIsOpen(false)
        }}
        className={cn(
          "relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 cursor-pointer hover:bg-white/10",
          isSelected && "bg-white/20 text-white",
          className
        )}
      >
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          {isSelected && <Check className="h-4 w-4" />}
        </span>
        {children}
      </div>
    )
  }
)
SelectItem.displayName = "SelectItem"

export const SelectValue: React.FC<SelectValueProps> = ({ placeholder, value, children }) => {
  const { value: contextValue } = React.useContext(SelectContext)
  const displayValue = value || contextValue

  return (
    <span className={cn(!displayValue && !children && "text-muted-foreground")}>
      {children || displayValue || placeholder}
    </span>
  )
}

export const SelectGroup = ({ children }: { children: React.ReactNode }) => children
