"use client"

import { useRef } from "react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

export type SelectedFile = {
  name: string
  base64: string
  mediatype: "image" | "video" | "document"
  preview: string
} | null

type Props = {
  title: string
  message: string
  annType: string
  selectedFile: SelectedFile
  onTitleChange: (title: string) => void
  onMessageChange: (message: string) => void
  onAnnTypeChange: (type: string) => void
  onFileSelect: (file: SelectedFile) => void
}

const TYPES = ["announcement", "activities", "payment-reminder", "media"] as const

export function ComposeForm({
  title,
  message,
  annType,
  selectedFile,
  onTitleChange,
  onMessageChange,
  onAnnTypeChange,
  onFileSelect,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const isMediaType = annType === "media"

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      onFileSelect(null)
      return
    }

    const fileType = file.type
    let mediatype: "image" | "video" | "document"
    if (fileType.startsWith("image/")) {
      mediatype = "image"
    } else if (fileType.startsWith("video/")) {
      mediatype = "video"
    } else {
      mediatype = "document"
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = reader.result as string
      onFileSelect({
        name: file.name,
        base64,
        mediatype,
        preview: mediatype === "image" ? base64 : "",
      })
    }
    reader.readAsDataURL(file)
  }

  function handleRemoveFile() {
    onFileSelect(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-title">Title</label>
          <Input
            id="ann-title"
            placeholder="e.g. Next Weekend is a Holiday"
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
                onClick={() => {
                  onAnnTypeChange(type)
                  if (type !== "media") onFileSelect(null)
                }}
              >
                {type === "media"
                  ? "Media"
                  : type.charAt(0).toUpperCase() + type.slice(1)}
              </Button>
            ))}
          </div>
        </div>

        {isMediaType && (
          <div className="space-y-2 rounded-lg border p-4">
            <label className="text-sm font-medium">Attachment</label>
            {selectedFile ? (
              <div className="space-y-2">
                {selectedFile.mediatype === "image" && selectedFile.preview && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={selectedFile.preview}
                    alt="Preview"
                    className="max-h-48 rounded object-contain border"
                  />
                )}
                {selectedFile.mediatype === "video" && (
                  <video
                    src={selectedFile.base64}
                    controls
                    className="max-h-48 rounded border"
                  />
                )}
                {selectedFile.mediatype === "document" && (
                  <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                )}
                <div className="flex items-center gap-2">
                  <p className="text-sm truncate flex-1">{selectedFile.name}</p>
                  <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                    Remove
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*,.pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Supported: images, videos, documents. The message text will be used as caption.
            </p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-message">
            {isMediaType ? "Caption" : "Message"}
          </label>
          <Textarea
            id="ann-message"
            placeholder={isMediaType ? "Write a caption for your media..." : "Write your announcement..."}
            value={message}
            onChange={(e) => onMessageChange(e.target.value)}
            className="min-h-[120px]"
          />
        </div>
    </div>
  )
}
