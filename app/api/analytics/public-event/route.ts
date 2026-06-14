import { NextResponse } from "next/server"

import { SCHOOL_ID } from "@/lib/constants"
import { trackProductEvent } from "@/lib/services/product-analytics"
import { PUBLIC_ANALYTICS_EVENTS } from "@/lib/services/product-analytics-events"

type PublicEventBody = {
  event?: string
  properties?: Record<string, unknown>
  durationMs?: number
}

const ALLOWED_PROPERTY_KEYS = new Set([
  "page",
  "step",
  "reason",
  "code",
  "invoiceId",
  "teacherId",
  "method",
  "manualOverride",
])

function sanitizeProperties(
  properties: Record<string, unknown> | undefined
): Record<string, unknown> | undefined {
  if (!properties) return undefined

  const sanitized: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(properties)) {
    if (!ALLOWED_PROPERTY_KEYS.has(key)) continue
    if (
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    ) {
      sanitized[key] = value
    }
  }

  return Object.keys(sanitized).length > 0 ? sanitized : undefined
}

export async function POST(request: Request) {
  let body: PublicEventBody
  try {
    body = (await request.json()) as PublicEventBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.event || typeof body.event !== "string") {
    return NextResponse.json({ error: "event is required" }, { status: 400 })
  }

  if (!PUBLIC_ANALYTICS_EVENTS.has(body.event)) {
    return NextResponse.json({ error: "event not allowed" }, { status: 400 })
  }

  trackProductEvent({
    schoolId: SCHOOL_ID,
    userId: null,
    event: body.event,
    properties: sanitizeProperties(body.properties),
    durationMs: body.durationMs,
  })

  return new NextResponse(null, { status: 204 })
}
