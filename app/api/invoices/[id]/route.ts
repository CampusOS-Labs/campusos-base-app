import { NextRequest, NextResponse } from "next/server"

import { getInvoiceById } from "@/lib/services/invoices"
import { getRazorpayKeyId } from "@/lib/razorpay"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const invoice = await getInvoiceById(id.toUpperCase())

    return NextResponse.json({
      success: true,
      data: {
        invoiceNumber: invoice.invoiceNumber,
        academicYear: invoice.academicYear,
        dueDate: invoice.dueDate,
        status: invoice.status,
        student: invoice.student,
        parent: invoice.parent,
        totalAmount: invoice.totalAmount,
        schoolName: process.env.SCHOOL_NAME || "Sunrise International School",
        razorpayKeyId: getRazorpayKeyId(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invoice not found"
    const status = message.includes("not found") ? 404 : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
