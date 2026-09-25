import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "cn"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[6px] font-label text-sm font-semibold tracking-[0.01em] whitespace-nowrap [font-stretch:85%] transition-all outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "relative bg-[var(--adj-red)] text-[var(--adj-cream)] hover:bg-[var(--adj-red-dark)] after:pointer-events-none after:absolute after:inset-1 after:rounded-[3px] after:border after:border-[rgb(241_234_219/0.38)] after:content-['']",
        destructive:
          "bg-destructive text-white hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/40",
        outline:
          "border border-[var(--adj-ink)]/30 bg-transparent text-[var(--adj-ink)] hover:border-[var(--adj-ink)] hover:bg-[var(--adj-cream-dark)]/60",
        secondary: "bg-[var(--adj-khaki)] text-[var(--adj-cream)] hover:bg-[var(--adj-khaki)]/90",
        ghost: "hover:bg-[var(--adj-cream-dark)]/70",
        link: "underline decoration-[var(--adj-gold)] decoration-1 underline-offset-[6px] hover:text-[var(--adj-red)] hover:decoration-[var(--adj-red)]",
      },
      size: {
        default: "h-12 px-4 py-2 md:h-10 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-[6px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[6px] px-3 has-[>svg]:px-2.5",
        lg: "h-14 min-h-12 px-7 text-[17px] has-[>svg]:px-4",
        icon: "size-9",
        "icon-xs": "size-6 rounded-[6px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8",
        "icon-lg": "size-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
