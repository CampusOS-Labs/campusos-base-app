import crypto from "crypto"

export function verifyWebhookSignature(
  rawBody: string,
  signature: string | null,
): boolean {
  if (!signature) {
    return false
  }

  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) {
    throw new Error("RAZORPAY_WEBHOOK_SECRET not configured")
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex")

  return crypto.timingSafeEqual(
    Buffer.from(expected),
    Buffer.from(signature),
  )
}
