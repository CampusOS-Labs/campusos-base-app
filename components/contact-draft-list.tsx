"use client";

import { Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type ContactDraft = {
  name: string;
  fatherName: string;
  fatherPhoneNumber: string;
  motherName: string;
  motherPhoneNumber: string;
  notes: string;
};

type ContactDraftListProps = {
  contacts: ContactDraft[];
  onChange: (index: number, field: keyof ContactDraft, value: string) => void;
  onAdd: () => void;
  onRemove: (index: number) => void;
  className?: string;
};

export function ContactDraftList({
  contacts,
  onChange,
  onAdd,
  onRemove,
  className,
}: ContactDraftListProps) {
  const validCount = contacts.filter(
    (contact) =>
      contact.name.trim() &&
      (contact.fatherPhoneNumber.trim() || contact.motherPhoneNumber.trim()),
  ).length;

  return (
    <div className={cn("space-y-3", className)}>
      {contacts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/80 bg-muted/15 px-4 py-5 text-center">
          <p className="text-sm text-muted-foreground">
            No contacts yet. Add parents now, or skip and add them later.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {contacts.map((contact, index) => (
            <div
              key={index}
              className="rounded-xl border border-border/70 bg-background/80 p-3 transition-colors duration-150 ease-out"
            >
              <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-start">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Kid name</label>
                  <Input
                    value={contact.name}
                    onChange={(e) => onChange(index, "name", e.target.value)}
                    placeholder="Student name"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Father name</label>
                  <Input
                    value={contact.fatherName}
                    onChange={(e) => onChange(index, "fatherName", e.target.value)}
                    placeholder="Father full name"
                  />
                </div>
                <div className="flex items-end justify-end sm:pt-6">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemove(index)}
                    aria-label="Remove contact"
                  >
                    <X className="size-4" />
                  </Button>
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Father phone</label>
                  <Input
                    value={contact.fatherPhoneNumber}
                    onChange={(e) => onChange(index, "fatherPhoneNumber", e.target.value)}
                    placeholder="919876543210"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mother name</label>
                  <Input
                    value={contact.motherName}
                    onChange={(e) => onChange(index, "motherName", e.target.value)}
                    placeholder="Mother full name"
                  />
                </div>
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">Mother phone</label>
                  <Input
                    value={contact.motherPhoneNumber}
                    onChange={(e) => onChange(index, "motherPhoneNumber", e.target.value)}
                    placeholder="919876543210"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-muted-foreground">
                    Notes (optional)
                  </label>
                  <Input
                    value={contact.notes}
                    onChange={(e) => onChange(index, "notes", e.target.value)}
                    placeholder="e.g. Nursery A"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <Button type="button" variant="outline" size="sm" onClick={onAdd}>
          <Plus className="size-4" />
          Add contact
        </Button>
        {validCount > 0 ? (
          <p className="text-xs text-muted-foreground">
            {validCount} contact{validCount === 1 ? "" : "s"} ready
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function createEmptyContactDraft(): ContactDraft {
  return {
    name: "",
    fatherName: "",
    fatherPhoneNumber: "",
    motherName: "",
    motherPhoneNumber: "",
    notes: "",
  };
}

export function getValidContactDrafts(contacts: ContactDraft[]) {
  return contacts
    .filter(
      (contact) =>
        contact.name.trim() &&
        (contact.fatherPhoneNumber.trim() || contact.motherPhoneNumber.trim()),
    )
    .map((contact) => ({
      name: contact.name.trim(),
      fatherName: contact.fatherName.trim() || null,
      fatherPhoneNumber: contact.fatherPhoneNumber.trim() || null,
      motherName: contact.motherName.trim() || null,
      motherPhoneNumber: contact.motherPhoneNumber.trim() || null,
      notes: contact.notes.trim() || null,
    }));
}
