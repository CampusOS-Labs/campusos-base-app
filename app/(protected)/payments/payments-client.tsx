"use client"

import { useCallback, useEffect } from "react"
import { Bell, Copy } from "lucide-react"
import { toast } from "sonner"

import { trackAuthEvent } from "@/lib/analytics/track-event-client"
import { formatCurrencyRaw, formatDate } from "@/lib/format"
import {
  PAGE_VIEW,
  PAYMENT_LINK_COPIED,
  PAYMENT_REMINDER_STARTED,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events"

import {
  DataTable,
  MetricStrip,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-layout"
import { EmptyState } from "@/components/empty-state"
import { Button } from "@/components/ui/button"

type Invoice = {
  invoiceNumber: string
  academicYear: string
  dueDate: string
  status: string
  totalAmount: number
  student: { id: string; name: string; class: string }
  parent: { name: string; phone: string; email: string }
}

function paymentLinkForInvoice(invoiceId: string) {
  return `${window.location.origin}/pay/${invoiceId}`
}

export function PaymentsClient({ invoices }: { invoices: Invoice[] }) {
  useEffect(() => {
    trackAuthEvent(PAGE_VIEW, { page: PRODUCT_PAGES.payments })
  }, [])

  const copyLink = useCallback(async (invoiceId: string) => {
    const link = paymentLinkForInvoice(invoiceId)
    try {
      await navigator.clipboard.writeText(link)
      trackAuthEvent(PAYMENT_LINK_COPIED, { invoiceId })
      toast.success("Payment link copied")
    } catch {
      toast.error("Could not copy link")
    }
  }, [])

  const remindToPay = useCallback((invoiceId: string) => {
    trackAuthEvent(PAYMENT_REMINDER_STARTED, { invoiceId })
    const url = new URL("/announcements", window.location.origin)
    url.searchParams.set("invoice", invoiceId)
    window.location.href = url.toString()
  }, [])

  const unpaid = invoices.filter((inv) => inv.status === "pending")
  const totalDue = unpaid.reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <PageShell>
      <PageHeader
        title="Payments"
        description="Track invoices and send payment reminders."
      />

      <MetricStrip
        metrics={[
          { value: unpaid.length, label: "pending" },
          { value: formatCurrencyRaw(totalDue), label: "total due" },
        ]}
      />

      <PageSection title="Invoices">
        {invoices.length === 0 ? (
          <EmptyState
            title="No invoices"
            description="Invoices will appear here when available."
          />
        ) : (
          <DataTable>
            <thead className="border-b border-border text-left">
              <tr>
                <th className="px-0 py-3 pr-4 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="py-3 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-muted/30">
                  <td className="py-3 pr-4">
                    <div className="font-medium">{inv.student.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.student.class}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.parent.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.parent.phone}</div>
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    {formatCurrencyRaw(inv.totalAmount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      {inv.status}
                    </span>
                  </td>
                  <td className="py-3 pl-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => copyLink(inv.invoiceNumber)}
                      >
                        <Copy /> Copy link
                      </Button>
                      <Button
                        size="xs"
                        disabled={inv.status !== "pending"}
                        onClick={() => remindToPay(inv.invoiceNumber)}
                      >
                        <Bell /> Remind
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </PageSection>
    </PageShell>
  )
}
