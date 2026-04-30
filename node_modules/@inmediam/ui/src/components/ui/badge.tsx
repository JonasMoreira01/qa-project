import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"
import { Dot } from "./dot"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 flex gap-1.5 w-fit",
  {
    variants: {
      variant: {
        default:
          "border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100",
        secondary:
          "border-gray-200 bg-gray-50 text-gray-700 hover:bg-gray-100",
        destructive:
          "border-error-200 bg-error-50 text-error-700 hover:bg-error-100",
        success: "border-success-200 bg-success-50 text-success-700 hover:bg-success-100",
        warning: "border-warning-200 bg-warning-50 text-warning-700 hover:bg-warning-100",
        outline: "text-gray-700 dark:text-gray-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
  VariantProps<typeof badgeVariants> {
  dot?: boolean
}

function Badge({ className, variant, dot = false, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {dot && <Dot variant={variant} />}
      {props.children}
    </div>
  )
}

export { Badge, badgeVariants }
