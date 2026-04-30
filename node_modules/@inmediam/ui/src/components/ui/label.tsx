import * as LabelPrimitive from '@radix-ui/react-label'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from "../../lib/utils"


interface LabelProps extends React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> {
  required?: boolean
}

const labelVariants = cva(
  'text-sm/5 font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-gray-700 dark:text-gray-400',
)

const Label = React.forwardRef<
  React.ElementRef<typeof LabelPrimitive.Root>,
  LabelProps &
  VariantProps<typeof labelVariants> // eslint-disable-line
>(({ className, required = false, ...props }, ref) => (
  <LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
  >
    {props.children}
    <span className="text-brand-600 data-[required=false]:hidden ml-[2px]" data-required={required}>*</span>
  </LabelPrimitive.Root>
))
Label.displayName = LabelPrimitive.Root.displayName

export { Label }
