"use client"

import Link from "next/link"
import {
  CalendarCheckIcon,
  CreditCardIcon,
  PaperPlaneTiltIcon,
} from "@phosphor-icons/react"

import { Button } from "@/components/ui/button"

export function HomeQuickActions() {
  return (
    <nav
      aria-label="Quick actions"
      className="flex flex-wrap items-center justify-center gap-2"
    >
      <Button render={<Link href="/announcements" />}>
        <PaperPlaneTiltIcon data-icon="inline-start" />
        Send announcement
      </Button>
      <Button variant="ghost" render={<Link href="/attendance" />}>
        <CalendarCheckIcon data-icon="inline-start" />
        Attendance
      </Button>
      <Button variant="ghost" render={<Link href="/payments" />}>
        <CreditCardIcon data-icon="inline-start" />
        Payments
      </Button>
    </nav>
  )
}
