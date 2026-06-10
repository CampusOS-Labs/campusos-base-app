"use client"

import { useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Bell } from "lucide-react"

type Invoice = {
  invoiceNumber: string
  academicYear: string
  dueDate: string
  status: string
  totalAmount: number
  student: { id: string; name: string; class: string }
  parent: { name: string; phone: string; email: string }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
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
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-6">
        <div>
          <h1 className="text-xl text-muted-foreground">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">Track unpaid invoices and send payment reminders.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Pending Payments</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{unpaid.length}</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <CardTitle className="text-sm text-muted-foreground">Total Due</CardTitle>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{formatCurrency(totalDue)}</span>
            </CardContent>
          </Card>
        </div>

        {unpaid.length === 0 ? (
          <p className="text-sm text-muted-foreground">No unpaid invoices right now.</p>
        ) : (
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 text-left">
                <tr>
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Parent</th>
                  <th className="px-4 py-3 font-medium text-right">Amount</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {unpaid.map((inv) => (
                  <tr key={inv.invoiceNumber} className="hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.student.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.student.class}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium">{inv.parent.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.parent.phone}</div>
                    </td>
                    <td className="px-4 py-3 text-right font-medium">{formatCurrencyRaw(inv.totalAmount)}</td>
                    <td className="px-4 py-3 text-muted-foreground">{formatDate(inv.dueDate)}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="outline" size="xs" onClick={() => copyLink(inv.invoiceNumber)}>
                          <Copy /> Copy Link
                        </Button>
                        <Button size="xs" onClick={() => remindToPay(inv.invoiceNumber)}>
                          <Bell /> Remind
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
