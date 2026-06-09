import { NextRequest, NextResponse } from "next/server"

import { whatsAppManager } from "@/lib/services/whatsapp"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> },
) {
  try {
    const { name } = await params
    const { number, mediatype, media, caption, fileName, delay } = await req.json()

    if (!number || !mediatype || !media) {
      return NextResponse.json(
        { success: false, error: "number, mediatype, and media are required" },
        { status: 400 },
      )
    }

    if (!["image", "document", "video", "audio"].includes(mediatype)) {
      return NextResponse.json(
        { success: false, error: "mediatype must be image, document, video, or audio" },
        { status: 400 },
      )
    }

    if (delay && delay > 0) {
      await new Promise((r) => setTimeout(r, delay))
    }

    await whatsAppManager.sendMedia(name, number, mediatype, media, caption, fileName)
    return NextResponse.json({ success: true })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send media message"
    return NextResponse.json({ success: false, error: message }, { status: 500 })
  }
}
