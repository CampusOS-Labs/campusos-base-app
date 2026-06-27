"use client";

import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type AudienceOption = {
  value: string;
  label: string;
  description?: string;
};

type AudiencePickerProps = {
  options: AudienceOption[];
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
};

export function AudiencePicker({
  options,
  value,
  onValueChange,
  disabled = false,
}: AudiencePickerProps) {
  const selectItems = options.map((option) => ({
    value: option.value,
    label: option.label,
  }));

  const selected = options.find((option) => option.value === value);

  return (
    <div className="space-y-2">
      <Label htmlFor="audience-select">Who receives this?</Label>
      <Select
        value={value || null}
        items={selectItems}
        onValueChange={(next) => {
          if (next) onValueChange(next);
        }}
        disabled={disabled}
      >
        <SelectTrigger id="audience-select" className="w-full">
          <SelectValue placeholder="Choose an audience">
            {selected?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              <span className="block font-medium">{option.label}</span>
              {option.description ? (
                <span className="block text-xs text-muted-foreground">{option.description}</span>
              ) : null}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected?.description ? (
        <p className="text-xs text-muted-foreground">{selected.description}</p>
      ) : null}
    </div>
  );
}
