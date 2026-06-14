"use client"

import Link from "next/link"
import {
  CalendarCheckIcon,
  CreditCardIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react"

import { cn } from "@/lib/utils"

const actions = [
  {
    href: "/announcements",
    label: "Send announcement",
    icon: PaperPlaneTiltIcon,
    iconClass: "bg-primary/10 text-primary",
    featured: true,
  },
  {
    href: "/attendance",
    label: "Attendance",
    icon: CalendarCheckIcon,
    iconClass: "bg-sidebar-primary/15 text-sidebar-primary-foreground",
    featured: false,
  },
  {
    href: "/payments",
    label: "Payments",
    icon: CreditCardIcon,
    iconClass: "bg-muted text-muted-foreground",
    featured: false,
  },
] as const

export function HomeQuickActions() {
  return (
    <nav aria-label="Quick actions" className="grid gap-2 sm:grid-cols-3">
      {actions.map((action) => (
        <Link
          key={action.href}
          href={action.href}
          className={cn(
            "group ui-press flex items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-xs ring-1 ring-foreground/[0.04] transition-[background-color,box-shadow,border-color] duration-150 ease-out",
            "hover:border-border hover:bg-muted/30 hover:shadow-sm",
            action.featured && "border-primary/20 bg-primary/[0.03]",
          )}
        >
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 ease-out group-hover:scale-[1.03]",
              action.iconClass,
            )}
          >
            <action.icon className="size-4" weight="duotone" />
          </span>
          <span className="text-sm font-medium leading-snug">{action.label}</span>
        </Link>
      ))}
    </nav>
  )
}
