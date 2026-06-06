import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const { number, text, delay } = await req.json()

    if (!number || !text) {
      return NextResponse.json(
        { success: false, error: "number and text are required" },
        { status: 400 },
      )
    }

    if (delay && delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    await whatsAppManager.sendMessage(name, number, text)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send message"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
