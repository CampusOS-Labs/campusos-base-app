import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const number = req.nextUrl.searchParams.get("number") || undefined
    const result = await whatsAppManager.connect(name, number)
    return NextResponse.json({
      base64: result.base64,
      code: result.code,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
