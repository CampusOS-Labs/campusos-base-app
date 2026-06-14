import { NextResponse } from "next/server"
import { headers } from "next/headers"

import { auth } from "@/lib/auth"
import { SCHOOL_ID } from "@/lib/constants"
import { trackProductEvent } from "@/lib/services/product-analytics"

type AnalyticsEventBody = {
  event?: string
  properties?: Record<string, unknown>
  durationMs?: number
}

export async function POST(request: Request) {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  let body: AnalyticsEventBody
  try {
    body = (await request.json()) as AnalyticsEventBody
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  if (!body.event || typeof body.event !== "string") {
    return NextResponse.json({ error: "event is required" }, { status: 400 })
  }

  trackProductEvent({
    schoolId: SCHOOL_ID,
    userId: session.user.id,
    event: body.event,
    properties: body.properties,
    durationMs: body.durationMs,
  })

  return new NextResponse(null, { status: 204 })
}
