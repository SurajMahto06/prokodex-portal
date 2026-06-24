import * as React from "react"
import { cn } from "@/lib/utils"

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "danger" | "warning" | "admin" | "mentor" | "premium" | "elite"
}

function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] sm:text-[11px] lg:text-xs font-semibold transition-colors focus:outline-none",
        {
          "bg-cyan-100 text-cyan-700 dark:bg-cyan-400/15 dark:text-cyan-400": variant === "default",
          "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300": variant === "secondary",
          "border border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300": variant === "outline",
          "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400": variant === "success",
          "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-400": variant === "danger",
          "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-400": variant === "warning",
          "bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50": variant === "admin",
          "bg-indigo-100 text-indigo-700 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50": variant === "mentor",
          "bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-200 dark:border-purple-900/50": variant === "premium",
          "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50": variant === "elite",
        },
        className
      )}
      {...props}
    />
  )
}

export { Badge }
