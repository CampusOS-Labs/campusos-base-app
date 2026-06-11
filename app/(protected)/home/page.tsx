import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { listInvoices } from "@/lib/services/invoices"

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

export default async function HomePage() {
  let invoices: Invoice[] = []
  let error: string | null = null

  try {
    invoices = await listInvoices()
  } catch {
    error = "Could not load data."
  }

  if (error) {
    return (
      <div className="flex justify-center pt-6">
        <div className="w-full max-w-[66.666667%]">
          <h1 className="text-3xl font-heading">Dashboard</h1>
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
          <h1 className="text-3xl font-heading">Dashboard</h1>
        </div>

        <div className="grid w-full grid-cols-1 sm:grid-cols-3">
          <div className="aspect-[2/1] rounded-xl border bg-card flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-semibold font-heading">{invoices.length}</span>
            <span className="text-sm text-muted-foreground">Total Invoices</span>
          </div>
          <div className="aspect-[2/1] rounded-xl border bg-card flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-semibold font-heading">{pending.length}</span>
            <span className="text-sm text-muted-foreground">Pending</span>
          </div>
          <div className="aspect-[2/1] rounded-xl border bg-card flex flex-col items-center justify-center gap-1">
            <span className="text-4xl font-semibold font-heading">{paid.length}</span>
            <span className="text-sm text-muted-foreground">Collected</span>
          </div>
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
