import { NextResponse } from "next/server"

import { contactInquirySchema } from "@/lib/schemas/contact-inquiry"
import { createContactInquiry } from "@/lib/services/contact-inquiries"

export async function POST(request: Request) {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const parsed = contactInquirySchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Invalid input" },
      { status: 400 },
    )
  }

  try {
    const inquiry = await createContactInquiry(parsed.data)
    return NextResponse.json({ success: true, id: inquiry.id }, { status: 201 })
  } catch (error) {
    console.error("Failed to save contact inquiry:", error)
    return NextResponse.json(
      { error: "Could not save your message. Please try again." },
      { status: 500 },
    )
  }
}
