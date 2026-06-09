"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Receipt, AlertCircle, CheckCircle, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"

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

export default function HomePage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        setLoading(true)
        setError(null)
        const res = await fetch("/api/invoices")
        const json = await res.json()
        if (!json.success) throw new Error()
        setInvoices(json.data)
      } catch {
        setError("Could not load data.")
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  if (loading) {
    return (
      <div className="flex justify-center pt-6">
        <div className="w-full max-w-[66.666667%]">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-4">Loading...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex justify-center pt-6">
        <div className="w-full max-w-[66.666667%]">
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-destructive mt-4">{error}</p>
        </div>
      </div>
    )
  }

  const pending = invoices.filter((inv) => inv.status === "pending")
  const paid = invoices.filter((inv) => inv.status === "paid")
  const totalDue = pending.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCollected = paid.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const recentInvoices = invoices.slice(0, 5)

  return (
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Overview of your school payments.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Total Invoices</CardTitle>
                <Receipt className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <span className="text-2xl font-semibold">{invoices.length}</span>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
                <AlertCircle className="size-4 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <span className="text-2xl font-semibold">{pending.length}</span>
              <div className="text-xs text-muted-foreground">{formatCurrencyRaw(totalDue)}</div>
            </CardContent>
          </Card>
          <Card size="sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm text-muted-foreground">Collected</CardTitle>
                <CheckCircle className="size-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent className="space-y-1">
              <span className="text-2xl font-semibold">{paid.length}</span>
              <div className="text-xs text-muted-foreground">{formatCurrencyRaw(totalCollected)}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Link href="/announcements">
              <Button variant="default">
                Send Announcement <ArrowRight />
              </Button>
            </Link>
            <Link href="/payments">
              <Button variant="outline">
                View Payments <ArrowRight />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            ) : (
              <div className="divide-y">
                {recentInvoices.map((inv) => (
                  <div key={inv.invoiceNumber} className="flex items-center justify-between py-2.5 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{inv.student.name}</div>
                      <div className="text-xs text-muted-foreground">{inv.parent.name}</div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm">{formatCurrencyRaw(inv.totalAmount)}</span>
                      <Badge variant={inv.status === "paid" ? "success" : "warning"}>
                        {inv.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
