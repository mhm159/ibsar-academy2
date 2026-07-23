"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, ToasterProps } from "sonner"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position="top-center"
      dir="rtl"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:rounded-2xl group-[.toaster]:border-2 group-[.toaster]:border-gold/30 group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:shadow-xl group-[.toaster]:backdrop-blur-md",
          title: "group-[.toast]:font-bold group-[.toast]:text-base",
          description: "group-[.toast]:text-sm group-[.toast]:text-muted-foreground",
          actionButton: "group-[.toast]:bg-gold group-[.toast]:text-night group-[.toast]:rounded-lg group-[.toast]:font-bold",
          cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground group-[.toast]:rounded-lg",
          success: "group-[.toaster]:!border-emerald-egypt/40 group-[.toaster]:!bg-emerald-egypt/5",
          error: "group-[.toaster]:!border-destructive/40 group-[.toaster]:!bg-destructive/5",
          warning: "group-[.toaster]:!border-gold/40 group-[.toaster]:!bg-gold/5",
          info: "group-[.toaster]:!border-azure/40 group-[.toaster]:!bg-azure/5",
        },
      }}
      style={
        {
          "--normal-bg": "var(--card)",
          "--normal-text": "var(--card-foreground)",
          "--normal-border": "var(--border)",
          fontFamily: "var(--font-tajawal), sans-serif",
        } as React.CSSProperties
      }
      {...props}
    />
  )
}

export { Toaster }
