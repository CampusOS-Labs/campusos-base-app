import { headers } from "next/headers"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { MetricStrip, PageHeader, PageSection, PageShell } from "@/components/page-layout"
import { ORG_DISPLAY_NAME } from "@/lib/constants"
import { auth } from "@/lib/auth"
import { listInvoices } from "@/lib/services/invoices"
import { HomeQuickActions } from "./home-quick-actions"

type Invoice = {
  invoiceNumber: string
  academicYear: string
  dueDate: string
  status: string
  totalAmount: number
  student: { id: string; name: string; class: string }
  parent: { name: string; phone: string; email: string }
}

function formatCurrencyRaw(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return "Good morning"
  if (hour < 17) return "Good afternoon"
  return "Good evening"
}

function getFirstName(name?: string | null) {
  if (!name?.trim()) return "there"
  return name.trim().split(/\s+/)[0] ?? "there"
}

function formatToday() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date())
}

export default async function HomePage() {
  const session = await auth.api.getSession({ headers: await headers() })
  let invoices: Invoice[] = []
  let error: string | null = null

  try {
    invoices = await listInvoices()
  } catch {
    error = "Could not load data."
  }

  if (error) {
    return (
      <PageShell>
        <PageHeader title="Dashboard" />
        <p className="text-sm text-destructive">{error}</p>
      </PageShell>
    )
  }

  const pending = invoices.filter((inv) => inv.status === "pending")
  const paid = invoices.filter((inv) => inv.status === "paid")
  const totalDue = pending.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCollected = paid.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const recentInvoices = invoices.slice(0, 5)
  const firstName = getFirstName(session?.user?.name)

  return (
    <PageShell>
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
        description={`${formatToday()} · ${ORG_DISPLAY_NAME}`}
      />

      <HomeQuickActions />

      <MetricStrip
        metrics={[
          { value: pending.length, label: "pending" },
          { value: formatCurrencyRaw(totalDue), label: "outstanding" },
          { value: formatCurrencyRaw(totalCollected), label: "collected" },
        ]}
      />

      {pending.length > 0 ? (
        <PageSection title="Needs attention">
          <p className="text-sm">
            <span className="font-medium">
              {pending.length} unpaid {pending.length === 1 ? "invoice" : "invoices"}
            </span>
            <span className="text-muted-foreground">
              {" "}
              — {formatCurrencyRaw(totalDue)} due from families
            </span>
            <Link
              href="/payments"
              className="ml-2 text-sm font-medium underline-offset-4 hover:underline"
            >
              Review payments
            </Link>
          </p>
        </PageSection>
      ) : null}

      <PageSection
        title="Recent invoices"
        action={
          invoices.length > 5 ? (
            <Link
              href="/payments"
              className="text-sm text-muted-foreground underline-offset-4 hover:underline"
            >
              View all
            </Link>
          ) : null
        }
      >
        {recentInvoices.length === 0 ? (
          <p className="text-sm text-muted-foreground">No invoices yet.</p>
        ) : (
          <div className="divide-y border-t border-border">
            {recentInvoices.map((inv) => (
              <div
                key={inv.invoiceNumber}
                className="flex items-center justify-between gap-4 py-3 first:pt-3"
              >
                <div className="min-w-0">
                  <div className="truncate text-sm font-medium">{inv.student.name}</div>
                  <div className="text-xs text-muted-foreground">{inv.parent.name}</div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm tabular-nums">
                    {formatCurrencyRaw(inv.totalAmount)}
                  </span>
                  <Badge variant={inv.status === "paid" ? "secondary" : "outline"}>
                    {inv.status === "paid" ? "Paid" : "Pending"}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageSection>
    </PageShell>
  )
}
