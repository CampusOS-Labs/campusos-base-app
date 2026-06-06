import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const result = await whatsAppManager.connect(name)
    return NextResponse.json({
      base64: result.base64,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
