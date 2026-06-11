"use client"

import { useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Send } from "lucide-react"
import "slot-text/style.css"
import { chromatic, type SlotOptions } from "slot-text"
import { SlotText } from "slot-text/react"

type Props = {
  statusSummary: string
  statusIsError: boolean
  sending: boolean
  onSend: () => Promise<void>
}

export function SendStatus({
  statusSummary,
  statusIsError,
  sending,
  onSend,
}: Props) {
  const slotOptions = useMemo<SlotOptions>(
    () => ({
      direction: sending ? "up" : "down",
      skipUnchanged: false,
      color: sending ? chromatic({ saturation: 92, lightness: 58 }) : undefined,
    }),
    [sending],
  )

  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <div className={`text-sm ${statusIsError ? "text-destructive font-medium" : "text-muted-foreground"}`}>
        {statusSummary}
      </div>
      <Button onClick={onSend} disabled={sending}>
        {sending ? <Spinner /> : <Send />}
        <SlotText text={sending ? "Sending..." : "Send Announcement"} options={slotOptions} />
      </Button>
    </div>
  )
}
