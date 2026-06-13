"use client"

import { useCallback } from "react"
import { Bell, Copy } from "lucide-react"

import {
  DataTable,
  MetricStrip,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-layout"
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

function formatDate(value: string) {
  if (!value) return "-"
  return new Date(value).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

function paymentLinkForInvoice(invoiceId: string) {
  return `${window.location.origin}/pay/${invoiceId}`
}

function formatCurrencyRaw(amount: number) {
  return `₹${amount.toLocaleString("en-IN")}`
}

export function PaymentsClient({ invoices }: { invoices: Invoice[] }) {
  const copyLink = useCallback(async (invoiceId: string) => {
    const link = paymentLinkForInvoice(invoiceId)
    try {
      await navigator.clipboard.writeText(link)
    } catch {}
  }, [])

  const remindToPay = useCallback((invoiceId: string) => {
    const url = new URL("/announcements", window.location.origin)
    url.searchParams.set("invoice", invoiceId)
    url.searchParams.set("audience", "unpaid-parents")
    window.location.href = url.toString()
  }, [])

  const unpaid = invoices.filter((inv) => inv.status === "pending")
  const totalDue = unpaid.reduce((sum, inv) => sum + inv.totalAmount, 0)

  return (
    <PageShell>
      <PageHeader
        title="Payments"
        description="Track unpaid invoices and send payment reminders."
      />

      <MetricStrip
        metrics={[
          { value: unpaid.length, label: "pending" },
          { value: formatCurrencyRaw(totalDue), label: "total due" },
        ]}
      />

      <PageSection title="Unpaid invoices">
        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unpaid invoices right now.</p>
        ) : (
          <DataTable>
            <thead className="border-b border-border text-left">
              <tr>
                <th className="px-0 py-3 pr-4 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="py-3 pl-4 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {unpaid.map((inv) => (
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
                  <td className="py-3 pl-4 text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="outline"
                        size="xs"
                        onClick={() => copyLink(inv.invoiceNumber)}
                      >
                        <Copy /> Copy link
                      </Button>
                      <Button size="xs" onClick={() => remindToPay(inv.invoiceNumber)}>
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
