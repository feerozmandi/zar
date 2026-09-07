import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentPropsWithoutRef } from "react";
import { cn } from "../lib/utils.js";

/**
 * دکمه‌ی سازمانی Xennic.
 * واریانت `action` همان «قدرت و اقدام» (قرمز) و `default` همان «زر» (طلایی) نوت ۴ است.
 */
export const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 rounded-(--radius-button) text-sm font-semibold transition-[background,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:brightness-110",
        action: "bg-destructive text-destructive-foreground hover:brightness-110",
        secondary: "bg-secondary text-secondary-foreground hover:brightness-110",
        outline: "border border-input bg-transparent text-foreground hover:bg-secondary/10",
        ghost: "bg-transparent text-foreground hover:bg-secondary/10",
        link: "bg-transparent text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3 text-xs",
        lg: "h-12 px-6 text-base",
        icon: "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends ComponentPropsWithoutRef<"button">, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

export function Button({ className, variant, size, asChild = false, children, ...props }: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp className={cn(buttonVariants({ className, size, variant }))} {...props}>
      {children}
    </Comp>
  );
}
