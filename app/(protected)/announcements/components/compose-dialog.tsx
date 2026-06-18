"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImageIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import { Textarea } from "@/components/ui/textarea";
import type { SelectedFile } from "./compose-form";

type ComposeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  message: string;
  isMedia: boolean;
  selectedFile: SelectedFile;
  audienceLabel: string;
  recipientCount: number;
  sending: boolean;
  onTitleChange: (value: string) => void;
  onMessageChange: (value: string) => void;
  onFileSelect: (file: SelectedFile) => void;
  onSend: () => void;
};

export function ComposeDialog({
  open,
  onOpenChange,
  title,
  message,
  isMedia,
  selectedFile,
  audienceLabel,
  recipientCount,
  sending,
  onTitleChange,
  onMessageChange,
  onFileSelect,
  onSend,
}: ComposeDialogProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      onFileSelect(null);
      return;
    }

    const fileType = file.type;
    let mediatype: "image" | "video" | "document";
    if (fileType.startsWith("image/")) {
      mediatype = "image";
    } else if (fileType.startsWith("video/")) {
      mediatype = "video";
    } else {
      mediatype = "document";
    }

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      onFileSelect({
        name: file.name,
        base64,
        mediatype,
        preview: mediatype === "image" ? base64 : "",
      });
    };
    reader.readAsDataURL(file);
  }

  function handleRemoveFile() {
    onFileSelect(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const canSend =
    title.trim().length > 0 &&
    (message.trim().length > 0 || isMedia) &&
    (!isMedia || selectedFile !== null) &&
    recipientCount > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-5 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Write your message</DialogTitle>
          <DialogDescription>
            Sending to {audienceLabel} · {recipientCount} recipient
            {recipientCount === 1 ? "" : "s"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-title">Title</Label>
            <Input
              id="compose-title"
              placeholder="e.g. Holiday on Saturday"
              value={title}
              onChange={(event) => onTitleChange(event.target.value)}
            />
          </div>

          {isMedia ? (
            <div className="space-y-2 rounded-xl border border-dashed border-border/80 bg-muted/15 p-4">
              <Label>Attachment</Label>
              {selectedFile ? (
                <div className="space-y-3">
                  {selectedFile.mediatype === "image" && selectedFile.preview ? (
                    <Image
                      src={selectedFile.preview}
                      alt="Preview"
                      width={320}
                      height={192}
                      unoptimized
                      className="max-h-40 rounded-lg border object-contain"
                    />
                  ) : null}
                  {selectedFile.mediatype === "video" ? (
                    <video
                      src={selectedFile.base64}
                      controls
                      className="max-h-40 rounded-lg border"
                    />
                  ) : null}
                  {selectedFile.mediatype === "document" ? (
                    <p className="text-sm text-muted-foreground">{selectedFile.name}</p>
                  ) : null}
                  <div className="flex items-center gap-2">
                    <p className="min-w-0 flex-1 truncate text-sm">{selectedFile.name}</p>
                    <Button variant="outline" size="sm" onClick={handleRemoveFile}>
                      Remove
                    </Button>
                  </div>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-5 transition-colors hover:bg-muted/20">
                  <ImageIcon className="size-5 text-muted-foreground" />
                  <span className="text-sm font-medium">Choose a file</span>
                  <Input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*,.pdf,.doc,.docx"
                    onChange={handleFileChange}
                    className="sr-only"
                  />
                </label>
              )}
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="compose-message">{isMedia ? "Caption" : "Message"}</Label>
            <Textarea
              id="compose-message"
              placeholder={
                isMedia
                  ? "Write a caption for your media…"
                  : "Write what parents need to know…"
              }
              value={message}
              onChange={(event) => onMessageChange(event.target.value)}
              className="min-h-[140px] resize-y"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Cancel
          </Button>
          <Button onClick={onSend} disabled={sending || !canSend}>
            {sending ? <Spinner /> : <PaperPlaneTiltIcon weight="fill" />}
            {sending ? "Sending…" : "Send"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
