import { NextRequest, NextResponse } from "next/server"

import { SCHOOL_ID } from "@/lib/constants"
import { markInvoicePaid } from "@/lib/services/invoices"
import {
  PAYMENT_COMPLETED,
  PAYMENT_FAILED,
} from "@/lib/services/product-analytics-events"
import { trackProductEvent } from "@/lib/services/product-analytics"
import {
  verifyPaymentSignature,
  fetchPaymentDetails,
} from "@/lib/services/payment"
import { verifyPaymentSchema } from "@/lib/schemas"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const parsed = verifyPaymentSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      )
    }

    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, invoiceId } =
      parsed.data

    const isValid = verifyPaymentSignature(
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    )

    if (!isValid) {
      trackProductEvent({
        schoolId: SCHOOL_ID,
        userId: null,
        event: PAYMENT_FAILED,
        properties: { invoiceId, reason: "invalid_signature" },
      })

      return NextResponse.json(
        { success: false, error: "Payment verification failed. Invalid signature." },
        { status: 400 },
      )
    }

    const paymentDetails = await fetchPaymentDetails(razorpayPaymentId)

    await markInvoicePaid(invoiceId.toUpperCase(), {
      razorpayOrderId,
      razorpayPaymentId,
      method: paymentDetails.method,
      paidAt: new Date().toISOString(),
    })

    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: null,
      event: PAYMENT_COMPLETED,
      properties: {
        invoiceId: invoiceId.toUpperCase(),
        method: paymentDetails.method,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Payment verified successfully.",
      data: {
        invoiceId,
        razorpayOrderId,
        razorpayPaymentId,
        method: paymentDetails.method,
        amountPaid: paymentDetails.amount / 100,
        currency: paymentDetails.currency,
        paidAt: new Date().toISOString(),
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Verification failed"
    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: null,
      event: PAYMENT_FAILED,
      properties: { reason: "verification_error" },
    })
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
