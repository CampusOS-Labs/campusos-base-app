import { NextRequest, NextResponse } from "next/server"

import { markInvoicePaid } from "@/lib/services/invoices"
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
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
