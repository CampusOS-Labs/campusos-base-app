import { NextRequest, NextResponse } from "next/server"

import { EvolutionHttpError, whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const number = req.nextUrl.searchParams.get("number") || undefined
    const result = await whatsAppManager.connect(name, number)
    const qr = result.base64 || null
    const pairingCode = result.code || null

    return NextResponse.json({
      success: true,
      qr,
      pairingCode,
      base64: qr,
      code: pairingCode,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect"
    const status = err instanceof EvolutionHttpError ? err.status : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
