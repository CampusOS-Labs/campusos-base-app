import { NextRequest, NextResponse } from "next/server"

import { EvolutionHttpError, whatsAppManager } from "@/lib/services/whatsapp"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const result = await whatsAppManager.getState(name)
    return NextResponse.json({
      success: true,
      state: result.state,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get state"
    const status = err instanceof EvolutionHttpError ? err.status : 500
    return NextResponse.json({ success: false, error: message }, { status })
  }
}
