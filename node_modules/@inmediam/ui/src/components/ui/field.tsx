import * as React from 'react'
import { cn } from '../../lib/utils'
import { Label } from './label'

function Field({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="field"
      className={cn('flex flex-col gap-1', className)}
      {...props}
    />
  )
}

interface FieldLabelProps extends React.ComponentPropsWithoutRef<typeof Label> {}

function FieldLabel({ className, ...props }: FieldLabelProps) {
  return (
    <Label
      data-slot="field-label"
      className={cn('text-sm font-medium text-gray-700', className)}
      {...props}
    />
  )
}

export { Field, FieldLabel }
