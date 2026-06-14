"use client";

import { PlusIcon, XIcon } from "@phosphor-icons/react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Recipient = {
  phone: string;
  parentName: string;
  invoices: Array<{
    invoiceNumber: string;
    studentName: string;
    totalAmount: number;
    status: string;
  }>;
};

type AudienceGroup = {
  id: string;
  label: string;
  help: string;
  recipients: Recipient[];
};

type Props = {
  audienceGroups: AudienceGroup[];
  selectedAudience: string;
  groupRecipients: Recipient[];
  manualContacts: string[];
  totalRecipientCount: number;
  onAudienceChange: (id: string) => void;
  onManualContactChange: (index: number, value: string) => void;
  onAddContact: () => void;
  onRemoveContact: (index: number) => void;
};

export function RecipientSelector({
  audienceGroups,
  selectedAudience,
  groupRecipients,
  manualContacts,
  totalRecipientCount,
  onAudienceChange,
  onManualContactChange,
  onAddContact,
  onRemoveContact,
}: Props) {
  const currentGroup = audienceGroups.find((g) => g.id === selectedAudience);
  const audienceSelectItems = audienceGroups.map((group) => ({
    value: group.id,
    label: group.label,
  }));
  const manualCount = manualContacts.filter((c) => c.trim()).length;
  const previewRecipients = groupRecipients.slice(0, 4);
  const remainingCount = Math.max(0, groupRecipients.length - previewRecipients.length);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <label className="text-sm font-medium">Audience</label>
        <Select
          value={selectedAudience}
          items={audienceSelectItems}
          onValueChange={(value) => {
            if (value) onAudienceChange(value);
          }}
        >
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Choose who receives this">
              {currentGroup?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {audienceGroups.map((group) => (
              <SelectItem key={group.id} value={group.id}>
                {group.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {currentGroup ? (
          <p className="text-xs text-muted-foreground">{currentGroup.help}</p>
        ) : null}
      </div>

      {selectedAudience !== "manual" && groupRecipients.length > 0 ? (
        <div className="rounded-xl border border-border/70 bg-muted/15 px-4 py-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium">From this audience</p>
            <Badge variant="secondary">{groupRecipients.length} contacts</Badge>
          </div>
          <ul className="mt-2 space-y-1">
            {previewRecipients.map((recipient) => (
              <li key={recipient.phone} className="truncate text-sm text-muted-foreground">
                {recipient.parentName}
                <span className="text-muted-foreground/70"> · {recipient.phone}</span>
              </li>
            ))}
            {remainingCount > 0 ? (
              <li className="text-xs text-muted-foreground">+ {remainingCount} more</li>
            ) : null}
          </ul>
        </div>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium">Additional numbers</p>
            <p className="text-xs text-muted-foreground">Optional — added on top of the audience</p>
          </div>
          <Button variant="outline" size="xs" onClick={onAddContact}>
            <PlusIcon />
            Add
          </Button>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {manualContacts.map((contact, i) => (
            <div key={i} className="flex gap-1">
              <Input
                placeholder="919876543210"
                value={contact}
                onChange={(e) => onManualContactChange(i, e.target.value)}
                className="flex-1"
              />
              {manualContacts.length > 1 ? (
                <Button variant="ghost" size="icon-sm" onClick={() => onRemoveContact(i)}>
                  <XIcon />
                </Button>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-primary/15 bg-primary/[0.03] px-4 py-3">
        <p className="text-sm font-medium">Ready to send</p>
        <Badge>
          {totalRecipientCount} recipient{totalRecipientCount === 1 ? "" : "s"}
          {manualCount > 0 && selectedAudience !== "manual" ? ` (+${manualCount} extra)` : ""}
        </Badge>
      </div>
    </div>
  );
}
