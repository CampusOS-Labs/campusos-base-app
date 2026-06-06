import { NextRequest, NextResponse } from "next/server"

import { markInvoicePaid } from "@/lib/services/invoices"
import { verifyWebhookSignature } from "@/lib/services/webhook"

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get("x-razorpay-signature")

    const isValid = verifyWebhookSignature(rawBody, signature)
    if (!isValid) {
      return NextResponse.json(
        { success: false, error: "Invalid webhook signature" },
        { status: 400 },
      )
    }

    const event = JSON.parse(rawBody)

    switch (event.event) {
      case "payment.captured": {
        const payment = event.payload.payment.entity
        const invoiceId = payment.notes?.invoice_id

        if (invoiceId) {
          await markInvoicePaid(invoiceId, {
            razorpayOrderId: payment.order_id,
            razorpayPaymentId: payment.id,
            method: payment.method,
            paidAt: new Date(payment.created_at * 1000).toISOString(),
            source: "webhook",
          })
        }
        break
      }

      case "payment.failed":
      case "refund.created":
        // Log and handle as needed
        break
    }

    return NextResponse.json({ received: true })
  } catch {
    return NextResponse.json(
      { success: false, error: "Webhook handler failed" },
      { status: 500 },
    )
  }
}
