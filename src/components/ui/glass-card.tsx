import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
}

export function GlassCard({ className, hover = true, children, ...props }: GlassCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-card/50 backdrop-blur-md shadow-sm transition-all duration-300",
        hover && "hover:shadow-md hover:border-primary/20 hover:bg-card/80 hover:-translate-y-0.5",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
