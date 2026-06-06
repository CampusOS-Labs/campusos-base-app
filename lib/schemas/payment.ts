import { z } from "zod"

export const createOrderSchema = z.object({
  invoiceId: z.string().min(1, "invoiceId is required"),
})

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1),
  razorpayPaymentId: z.string().min(1),
  razorpaySignature: z.string().min(1),
  invoiceId: z.string().min(1),
})

export type CreateOrderInput = z.infer<typeof createOrderSchema>
export type VerifyPaymentInput = z.infer<typeof verifyPaymentSchema>
