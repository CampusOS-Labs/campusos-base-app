import { NextResponse } from "next/server"

import { EvolutionHttpError, whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const result = await whatsAppManager.connect(name)
    const qr = result.base64 || null
    const pairingCode = result.pairingCode || null

    return NextResponse.json({
      success: true,
      qr,
      base64: qr,
      pairingCode,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect"
    const status = err instanceof EvolutionHttpError ? err.status : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const { number } = await req.json()
    const normalizedNumber = String(number || "").replace(/[^\d]/g, "")

    if (!normalizedNumber) {
      return NextResponse.json(
        { success: false, error: "number is required" },
        { status: 400 },
      )
    }

    const result = await whatsAppManager.connect(name, normalizedNumber)
    const qr = result.base64 || null
    const pairingCode = result.pairingCode || null

    return NextResponse.json({
      success: true,
      qr,
      base64: qr,
      pairingCode,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect"
    const status = err instanceof EvolutionHttpError ? err.status : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
