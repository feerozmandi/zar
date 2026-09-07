import * as LabelPrimitive from "@radix-ui/react-label";
import { cn } from "../lib/utils.js";

export function Label({ className, ...props }: React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn(
        "text-sm font-medium leading-none text-muted-foreground peer-disabled:opacity-70",
        className,
      )}
      {...props}
    />
  );
}
