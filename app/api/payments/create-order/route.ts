import { NextRequest, NextResponse } from "next/server"

import { SCHOOL_ID } from "@/lib/constants"
import { getInvoiceById } from "@/lib/services/invoices"
import { createOrder } from "@/lib/services/payment"
import { PAYMENT_STARTED } from "@/lib/services/product-analytics-events"
import { trackProductEvent } from "@/lib/services/product-analytics"
import { createOrderSchema } from "@/lib/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = createOrderSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      )
    }

    const invoice = await getInvoiceById(parsed.data.invoiceId.toUpperCase())

    const order = await createOrder({
      amount: invoice.totalAmount,
      invoiceId: invoice.invoiceNumber,
      studentName: invoice.student.name,
      parentName: invoice.parent.name,
    })

    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: null,
      event: PAYMENT_STARTED,
      properties: { invoiceId: invoice.invoiceNumber },
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          orderId: order.id,
          amount: order.amount,
          currency: order.currency,
          invoiceId: invoice.invoiceNumber,
          studentName: invoice.student.name,
          parentName: invoice.parent.name,
          prefillEmail: invoice.parent.email,
          prefillContact: invoice.parent.phone,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create payment order"
    return NextResponse.json({ success: false, error: message }, { status: 502 })
  }
}
