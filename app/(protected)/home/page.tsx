"use client"

import { useState, useEffect } from "react"
import { ArrowRight, Bell, Receipt } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartAreaInteractive } from "@/components/chart-area-interactive"
import { InvoiceTable } from "@/components/invoice-table"
import { SectionCards } from "@/components/section-cards"

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
      <div className="px-4 lg:px-6">
        <p className="text-sm text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 lg:px-6">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    )
  }

  const pending = invoices.filter((inv) => inv.status === "pending")
  const paid = invoices.filter((inv) => inv.status === "paid")
  const totalDue = pending.reduce((sum, inv) => sum + inv.totalAmount, 0)
  const totalCollected = paid.reduce((sum, inv) => sum + inv.totalAmount, 0)

  const sectionCards = [
    {
      title: "Total Invoices",
      value: String(invoices.length),
      description: "All invoices in the system",
      trend: "up" as const,
      trendLabel: "Total issued",
      trendValue: "",
    },
    {
      title: "Pending",
      value: formatCurrency(totalDue),
      description: `${pending.length} unpaid invoice(s)`,
      trend: "down" as const,
      trendLabel: `${pending.length} pending`,
      trendValue: "",
    },
    {
      title: "Collected",
      value: formatCurrency(totalCollected),
      description: `${paid.length} paid invoice(s)`,
      trend: "up" as const,
      trendLabel: `${paid.length} paid`,
      trendValue: "",
    },
    {
      title: "Collection Rate",
      value: invoices.length > 0
        ? `${Math.round((paid.length / invoices.length) * 100)}%`
        : "0%",
      description: "Of total invoices paid",
      trend: "up" as const,
      trendLabel: "Overall rate",
      trendValue: "",
    },
  ]

  return (
    <>
      <SectionCards cards={sectionCards} />
      <div className="px-4 lg:px-6">
        <ChartAreaInteractive />
      </div>
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @5xl/main:grid-cols-2">
        <Link href="/announcements">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Send Announcement</CardTitle>
                <Bell className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              Send a WhatsApp message to parents
              <ArrowRight className="size-4 ml-auto" />
            </CardContent>
          </Card>
        </Link>
        <Link href="/payments">
          <Card className="cursor-pointer transition-colors hover:bg-muted/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>View Payments</CardTitle>
                <Receipt className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent className="flex items-center gap-2 text-sm text-muted-foreground">
              Track unpaid invoices and send reminders
              <ArrowRight className="size-4 ml-auto" />
            </CardContent>
          </Card>
        </Link>
      </div>
      <div>
        <h2 className="px-4 text-lg font-semibold lg:px-6">Recent Invoices</h2>
        <InvoiceTable data={invoices} />
      </div>
    </>
  )
}
