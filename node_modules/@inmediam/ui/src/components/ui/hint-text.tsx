import { cn } from "../../lib/utils";

interface HintTextProps extends React.HTMLAttributes<HTMLSpanElement> {
}

export function HintText({ ...rest }: HintTextProps) {

  return (
    <span {...rest} className={cn("font-normal text-sm/5 text-error-600", rest.className)}>
      {rest.children}
    </span>
  )
}