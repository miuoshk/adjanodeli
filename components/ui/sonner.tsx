"use client"

import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      toastOptions={{
        classNames: {
          toast:
            "bg-[var(--adj-paper-light)] text-[var(--adj-ink)] border border-[rgba(43,42,31,0.18)] rounded-[4px] font-label [font-stretch:85%]",
        },
      }}
      style={
        {
          "--normal-bg": "var(--adj-paper-light)",
          "--normal-text": "var(--adj-ink)",
          "--normal-border": "rgba(43, 42, 31, 0.18)",
          "--border-radius": "4px",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
