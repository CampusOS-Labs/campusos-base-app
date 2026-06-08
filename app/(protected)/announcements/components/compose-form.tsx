"use client"

import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

type Props = {
  title: string
  message: string
  annType: string
  onTitleChange: (title: string) => void
  onMessageChange: (message: string) => void
  onAnnTypeChange: (type: string) => void
}

const TYPES = ["update", "maintenance", "new", "alert", "payment-reminder"] as const

export function ComposeForm({
  title,
  message,
  annType,
  onTitleChange,
  onMessageChange,
  onAnnTypeChange,
}: Props) {
  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-title">Title</label>
          <Input
            id="ann-title"
            placeholder="e.g. New feature rollout"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <div className="flex flex-wrap gap-1">
            {TYPES.map((type) => (
              <Button
                key={type}
                variant={annType === type ? "default" : "outline"}
                size="sm"
                onClick={() => onAnnTypeChange(type)}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-message">Message</label>
          <Textarea
            id="ann-message"
            placeholder="Write your announcement..."
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
    </div>
  )
}
