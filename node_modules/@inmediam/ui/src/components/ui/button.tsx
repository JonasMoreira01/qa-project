import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "../../lib/utils"

const buttonVariants = cva(
  'flex gap-1 inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-semibold ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[loading-disabled=true]:border data-[loading-disabled=true]:border-input data-[loading-disabled=true]:bg-white data-[loading-disabled=true]:text-gray-400 data-[loading-disabled=true]:opacity-100',
  {
    variants: {
      variant: {
        default: 'bg-brand-400 text-primary-foreground hover:bg-brand-500 disabled:opacity-100 disabled:border disabled:border-gray-200 disabled:bg-gray-50 disabled:text-gray-400 disabled:opacity-100',
        destructive:
          'bg-error-600 text-destructive-foreground hover:bg-error-700',
        success:
          'bg-success-500 text-white hover:bg-success-600 dark:bg-success-600 dark:hover:bg-success-700',
        warning:
          'bg-warning-500 text-white hover:bg-warning-600 dark:bg-warning-600 dark:hover:bg-warning-700',
        outline:
          'border border-input bg-background hover:bg-accent text-accent-foreground',
        secondary: 'bg-secondary hover:bg-secondary/80',
        tertiary: 'border border-brand-500 bg-brand-50 text-gray-700 hover:bg-brand-100',
        ghost: 'hover:bg-accent text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-3.5',
        xs: 'h-8 px-3',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-4',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
  // eslint-disable-line 
  VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }
