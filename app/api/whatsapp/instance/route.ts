import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function POST(req: NextRequest) {
  try {
    const { instanceName } = await req.json()
    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "instanceName is required" },
        { status: 400 },
      )
    }
    await whatsAppManager.getOrCreateInstance(instanceName)
    return NextResponse.json({ success: true, instanceName })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create instance"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function GET(req: NextRequest) {
  try {
    const name = req.nextUrl.searchParams.get("name")
    if (!name) {
      return NextResponse.json(
        { success: false, error: "name query parameter is required" },
        { status: 400 },
      )
    }
    const result = whatsAppManager.getState(name)
    return NextResponse.json({
      success: true,
      state: result.state,
      qr: result.qr || null,
      instance: { state: result.state },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get state"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { instanceName } = await req.json()
    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "instanceName is required" },
        { status: 400 },
      )
    }
    await whatsAppManager.logout(instanceName)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to logout"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
