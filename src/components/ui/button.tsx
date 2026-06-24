import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline"
  size?: "sm" | "md" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-colors focus:outline-none disabled:opacity-50 disabled:pointer-events-none",
          {
            "bg-cyan-400 text-zinc-950 font-bold hover:bg-cyan-500 shadow-[0_0_20px_rgba(8,145,178,0.15)] hover:shadow-[0_0_20px_rgba(8,145,178,0.3)]": variant === "primary",
            "bg-zinc-800 text-white hover:bg-zinc-700": variant === "secondary",
            "bg-transparent hover:bg-zinc-800 text-zinc-300 hover:text-white": variant === "ghost",
            "bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900 dark:hover:text-red-200": variant === "danger",
            "border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 text-white": variant === "outline",
            "h-8 px-3 text-[10px] sm:text-[11px] lg:text-xs": size === "sm",
            "h-10 px-4 py-2 text-xs sm:text-[13px] lg:text-sm": size === "md",
            "h-12 px-6 py-3 text-[13px] sm:text-sm lg:text-base": size === "lg",
            "h-10 w-10 p-2": size === "icon",
          },
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
