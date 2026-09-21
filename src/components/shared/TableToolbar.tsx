import * as React from "react"
import { cn } from "cn"

interface TableToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function TableToolbar({ className, children, ...props }: TableToolbarProps) {
  return (
    <div
      data-slot="table-toolbar"
      className={cn(
        "flex flex-wrap items-center gap-3 py-3",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface TableToolbarSearchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void
}

export function TableToolbarSearch({ className, onClear, ...props }: TableToolbarSearchProps) {
  return (
    <div className="relative">
      <input
        type="text"
        data-slot="table-toolbar-search"
        className={cn(
          "h-8 w-full min-w-[200px] rounded-md border border-input bg-transparent px-3 py-1 text-sm transition-colors",
          "placeholder:text-muted-foreground",
          "focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
          "disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        {...props}
      />
      {props.value && onClear && (
        <button
          type="button"
          onClick={onClear}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        >
          ×
        </button>
      )}
    </div>
  )
}

interface TableToolbarActionsProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
}

export function TableToolbarActions({ className, children, ...props }: TableToolbarActionsProps) {
  return (
    <div
      data-slot="table-toolbar-actions"
      className={cn("ml-auto flex items-center gap-2", className)}
      {...props}
    >
      {children}
    </div>
  )
}
