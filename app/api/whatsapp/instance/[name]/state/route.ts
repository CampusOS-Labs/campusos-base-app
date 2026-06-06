import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const result = whatsAppManager.getState(name)
    return NextResponse.json({
      success: true,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get state"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
