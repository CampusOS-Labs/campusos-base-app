import { db } from "@/lib/db"
import { productEvent } from "@/lib/db/schema"

export * from "@/lib/services/product-analytics-events"

type TrackProductEventInput = {
  schoolId: string
  userId?: string | null
  event: string
  properties?: Record<string, unknown>
  durationMs?: number
}

export function trackProductEvent(input: TrackProductEventInput): void {
  void db
    .insert(productEvent)
    .values({
      id: crypto.randomUUID(),
      schoolId: input.schoolId,
      userId: input.userId ?? null,
      event: input.event,
      properties: input.properties ?? null,
      durationMs: input.durationMs ?? null,
    })
    .catch((error) => {
      console.error("Failed to track product event:", error)
    })
}
