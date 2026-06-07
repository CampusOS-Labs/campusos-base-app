"use client"

import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Send } from "lucide-react"

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
  return (
    <div className="flex items-center justify-between gap-4 pt-2">
      <div className={`text-sm ${statusIsError ? "text-destructive font-medium" : "text-muted-foreground"}`}>
        {statusSummary}
      </div>
      <Button onClick={onSend} disabled={sending}>
        {sending ? <Spinner /> : <Send />}
        {sending ? "Sending..." : "Send Announcement"}
      </Button>
    </div>
  )
}
