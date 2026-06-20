"use client"

import Link from "next/link"
import { CreditCardIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react"

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { FEATURE_UNDER_DEVELOPMENT_MESSAGE } from "@/components/under-development-hint"
import { isUnderDevelopmentRoute } from "@/lib/under-development-routes"

const actions = [
  {
    href: "/announcements",
    label: "Send announcement",
    icon: PaperPlaneTiltIcon,
    iconClass: "bg-primary/10 text-primary",
    disabled: false,
  },
  {
    href: "/payments",
    label: "Payments",
    icon: CreditCardIcon,
    iconClass: "bg-sidebar-primary/15 text-sidebar-primary-foreground",
    disabled: isUnderDevelopmentRoute("/payments"),
  },
] as const

function QuickActionCard({
  action,
}: {
  action: (typeof actions)[number]
}) {
  const content = (
    <>
      <span
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-lg transition-transform duration-150 ease-out",
          action.iconClass,
          !action.disabled && "group-hover:scale-[1.03]",
        )}
      >
        <action.icon className="size-4" weight="duotone" />
      </span>
      <span className="text-sm font-medium leading-snug">{action.label}</span>
    </>
  )

  if (action.disabled) {
    return (
      <div className="min-w-0 w-full">
        <Tooltip>
          <TooltipTrigger render={<span className="flex w-full min-w-0 cursor-not-allowed" />}>
            <div
              aria-disabled="true"
              className={cn(
                "flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-xs ring-1 ring-foreground/[0.04]",
                "text-muted-foreground opacity-60",
              )}
            >
              {content}
            </div>
          </TooltipTrigger>
          <TooltipContent>{FEATURE_UNDER_DEVELOPMENT_MESSAGE}</TooltipContent>
        </Tooltip>
      </div>
    )
  }

  return (
    <Link
      href={action.href}
      className={cn(
        "group ui-press flex w-full min-w-0 items-center gap-3 rounded-xl border border-border/80 bg-card px-4 py-3.5 shadow-xs ring-1 ring-foreground/[0.04] transition-[background-color,box-shadow,border-color] duration-150 ease-out",
        "hover:border-border hover:bg-muted/30 hover:shadow-sm",
      )}
    >
      {content}
    </Link>
  )
}

export function HomeQuickActions() {
  return (
    <nav
      aria-label="Quick actions"
      className="grid grid-cols-2 gap-3 [&>*]:min-w-0 [&>*]:w-full"
    >
      {actions.map((action) => (
        <QuickActionCard key={action.href} action={action} />
      ))}
    </nav>
  )
}
