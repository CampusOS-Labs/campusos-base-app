import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const { numbers } = await req.json()

    if (!Array.isArray(numbers) || numbers.length === 0) {
      return NextResponse.json(
        { success: false, error: "numbers array is required" },
        { status: 400 },
      )
    }

    const result = await whatsAppManager.validateNumbers(name, numbers)
    return NextResponse.json(result)
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to validate numbers"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
