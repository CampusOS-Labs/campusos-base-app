import { NextResponse } from "next/server"

import { listInvoices } from "@/lib/services/invoices"

export async function GET() {
  try {
    const invoices = await listInvoices()

    return NextResponse.json({
      success: true,
      data: invoices.map((inv) => ({
        invoiceNumber: inv.invoiceNumber,
        academicYear: inv.academicYear,
        dueDate: inv.dueDate,
        status: inv.status,
        totalAmount: inv.totalAmount,
        student: inv.student,
        parent: inv.parent,
      })),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list invoices"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
