"use client"

import { useState, useEffect, useCallback } from "react"

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

export default function PaymentsPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  async function loadInvoices() {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch("/api/invoices")
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to fetch invoices")
      setInvoices(json.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadInvoices()
  }, [])

  const copyLink = useCallback(async (invoiceId: string, btn: HTMLElement) => {
    const link = paymentLinkForInvoice(invoiceId)
    try {
      await navigator.clipboard.writeText(link)
      btn.textContent = "Copied"
    } catch {
      btn.textContent = "Copy failed"
    }
    setTimeout(() => {
      btn.textContent = "Copy link"
    }, 1200)
  }, [])

  const remindToPay = useCallback((invoiceId: string) => {
    const url = new URL("/announcements", window.location.origin)
    url.searchParams.set("invoice", invoiceId)
    url.searchParams.set("audience", "unpaid-parents")
    window.location.href = url.toString()
  }, [])

  const unpaid = invoices.filter((inv) => inv.status === "pending")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payments</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track unpaid invoices and send reminders.
          </p>
        </div>
        <button
          onClick={loadInvoices}
          disabled={loading}
          className="rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-muted/50 disabled:opacity-50"
        >
          {loading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-600">{error}</div>
      )}

      {loading && (
        <p className="text-sm text-muted-foreground">Loading invoices...</p>
      )}

      {!loading && !error && unpaid.length === 0 && (
        <p className="text-sm text-muted-foreground">No unpaid invoices right now.</p>
      )}

      {!loading && !error && unpaid.length > 0 && (
        <div className="overflow-x-auto rounded-md border">
          <table className="min-w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Parent</th>
                <th className="px-4 py-3 font-medium">Amount</th>
                <th className="px-4 py-3 font-medium">Due</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {unpaid.map((inv) => (
                <tr key={inv.invoiceNumber} className="hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{inv.invoiceNumber}</td>
                  <td className="px-4 py-3">{inv.student.name}</td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{inv.parent.name}</div>
                    <div className="text-xs text-muted-foreground">{inv.parent.phone}</div>
                  </td>
                  <td className="px-4 py-3">{formatCurrency(inv.totalAmount)}</td>
                  <td className="px-4 py-3">{formatDate(inv.dueDate)}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                      Pending
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={(e) => copyLink(inv.invoiceNumber, e.currentTarget)}
                        className="rounded-md border px-2 py-1 text-xs font-medium hover:bg-muted/50"
                      >
                        Copy link
                      </button>
                      <button
                        onClick={() => remindToPay(inv.invoiceNumber)}
                        className="rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        Remind to pay
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
