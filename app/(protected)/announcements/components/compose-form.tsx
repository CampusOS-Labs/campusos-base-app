"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImageIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ANNOUNCEMENT_TYPES } from "@/lib/announcement-types";
import { cn } from "@/lib/utils";

export type SelectedFile = {
  name: string;
  base64: string;
  mediatype: "image" | "video" | "document";
  preview: string;
} | null;

type Props = {
  title: string;
  message: string;
  annType: string;
  selectedFile: SelectedFile;
  onTitleChange: (title: string) => void;
  onMessageChange: (message: string) => void;
  onAnnTypeChange: (type: string) => void;
  onFileSelect: (file: SelectedFile) => void;
};

const TYPE_OPTIONS = ANNOUNCEMENT_TYPES;

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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const isMediaType = annType === "media";

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
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

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="ann-title">
          Title
        </label>
        <Input
          id="ann-title"
          placeholder="e.g. Holiday on Saturday"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Type</p>
        <div className="grid gap-2 sm:grid-cols-2">
          {TYPE_OPTIONS.map((type) => {
            const selected = annType === type.id;
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => {
                  onAnnTypeChange(type.id);
                  if (type.id !== "media") onFileSelect(null);
                }}
                className={cn(
                  "ui-press flex items-start gap-3 rounded-xl border px-3.5 py-3 text-left transition-[border-color,background-color,box-shadow] duration-150 ease-out",
                  selected
                    ? "border-primary/40 bg-primary/[0.04] ring-1 ring-primary/20"
                    : "border-border/80 bg-background hover:border-border hover:bg-muted/30",
                )}
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-lg transition-colors duration-150 ease-out",
                    selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4" weight={selected ? "fill" : "regular"} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{type.label}</span>
                  <span className="block text-xs text-muted-foreground">{type.description}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {isMediaType ? (
        <div className="space-y-3 rounded-xl border border-dashed border-border/80 bg-muted/15 p-4">
          <p className="text-sm font-medium">Attachment</p>
          {selectedFile ? (
            <div className="space-y-3">
              {selectedFile.mediatype === "image" && selectedFile.preview ? (
                <Image
                  src={selectedFile.preview}
                  alt="Preview"
                  width={320}
                  height={192}
                  unoptimized
                  className="max-h-48 rounded-lg border object-contain"
                />
              ) : null}
              {selectedFile.mediatype === "video" ? (
                <video src={selectedFile.base64} controls className="max-h-48 rounded-lg border" />
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
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-border/70 bg-background px-4 py-6 transition-colors duration-150 ease-out hover:bg-muted/20">
              <ImageIcon className="size-5 text-muted-foreground" />
              <span className="text-sm font-medium">Choose a file</span>
              <span className="text-xs text-muted-foreground">Image, video, or document</span>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*,.pdf,.doc,.docx"
                onChange={handleFileChange}
                className="sr-only"
              />
            </label>
          )}
          <p className="text-xs text-muted-foreground">
            Your message below will be sent as the caption.
          </p>
        </div>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium" htmlFor="ann-message">
          {isMediaType ? "Caption" : "Message"}
        </label>
        <Textarea
          id="ann-message"
          placeholder={
            isMediaType
              ? "Write a caption for your media…"
              : "Write what parents need to know…"
          }
          value={message}
          onChange={(e) => onMessageChange(e.target.value)}
          className="min-h-[140px] resize-y"
        />
      </div>
    </div>
  );
}
