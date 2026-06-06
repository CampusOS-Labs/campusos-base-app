import crypto from "crypto"

import { razorpay } from "@/lib/razorpay"

type RazorpayOrder = {
  id: string
  amount: number
  currency: string
  receipt: string
  status: string
  notes?: Record<string, string>
}

export async function createOrder({
  amount,
  invoiceId,
  studentName,
  parentName,
}: {
  amount: number
  invoiceId: string
  studentName: string
  parentName: string
}): Promise<RazorpayOrder> {
  const amountInPaise = Math.round(amount * 100)

  const order = (await razorpay.orders.create({
    amount: amountInPaise,
    currency: "INR",
    receipt: invoiceId,
    payment_capture: true,
    notes: {
      invoice_id: invoiceId,
      student_name: studentName,
      parent_name: parentName,
      source: "school-fee-portal",
    },
  })) as unknown as RazorpayOrder

  return order
}

export function verifyPaymentSignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
) {
  const body = `${razorpayOrderId}|${razorpayPaymentId}`
  const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(body)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expectedSignature),
    Buffer.from(razorpaySignature),
  )
}

type RazorpayPayment = {
  id: string
  amount: number
  currency: string
  method: string
  status: string
  created_at: number
}

export async function fetchPaymentDetails(paymentId: string): Promise<RazorpayPayment> {
  return razorpay.payments.fetch(paymentId) as unknown as Promise<RazorpayPayment>
}
