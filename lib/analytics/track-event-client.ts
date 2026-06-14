export function trackAuthEvent(
  event: string,
  properties?: Record<string, unknown>,
  durationMs?: number
) {
  void fetch("/api/analytics/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties, durationMs }),
  }).catch(() => {})
}

export function trackPublicEvent(
  event: string,
  properties?: Record<string, unknown>,
  durationMs?: number
) {
  void fetch("/api/analytics/public-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, properties, durationMs }),
  }).catch(() => {})
}
