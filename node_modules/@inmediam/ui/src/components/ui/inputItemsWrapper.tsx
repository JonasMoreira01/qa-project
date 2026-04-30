
import { cn } from "../../lib/utils"

interface InputItemsWrapperProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode,
}

export function InputItemsWrapper({ children, ...rest }: InputItemsWrapperProps) {
  return (
    <div {...rest} className={cn("flex flex-col gap-2 w-fit", rest.className)}>
      {children}
    </div>
  )
}