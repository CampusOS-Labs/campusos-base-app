"use client";

import { ANNOUNCEMENT_TYPES } from "@/lib/announcement-types";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type MessageTypePickerProps = {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export function MessageTypePicker({
  value,
  onValueChange,
  disabled = false,
}: MessageTypePickerProps) {
  const selectItems = ANNOUNCEMENT_TYPES.map((type) => ({
    value: type.id,
    label: type.label,
  }));

  return (
    <div className="space-y-2">
      <Label htmlFor="message-type-select">What kind of message?</Label>
      <Select
        value={value || null}
        items={selectItems}
        onValueChange={(next) => {
          if (next) onValueChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger id="message-type-select" className="w-full">
          <SelectValue placeholder="Choose message type">
            {ANNOUNCEMENT_TYPES.find((type) => type.id === value)?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {ANNOUNCEMENT_TYPES.map((type) => (
            <SelectItem key={type.id} value={type.id}>
              {type.label} — {type.description}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
