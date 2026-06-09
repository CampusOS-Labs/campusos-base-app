"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, X } from "lucide-react"

type Recipient = {
  phone: string
  parentName: string
  invoices: Array<{
    invoiceNumber: string
    studentName: string
    totalAmount: number
    status: string
  }>
}

type AudienceGroup = {
  id: string
  label: string
  help: string
  recipients: Recipient[]
}

type Props = {
  audienceGroups: AudienceGroup[]
  selectedAudience: string
  groupRecipients: Recipient[]
  manualContacts: string[]
  onAudienceChange: (id: string) => void
  onManualContactChange: (index: number, value: string) => void
  onAddContact: () => void
  onRemoveContact: (index: number) => void
}

export function RecipientSelector({
  audienceGroups,
  selectedAudience,
  groupRecipients,
  manualContacts,
  onAudienceChange,
  onManualContactChange,
  onAddContact,
  onRemoveContact,
}: Props) {
  const currentGroup = audienceGroups.find((g) => g.id === selectedAudience)

  return (
    <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-audience">Audience</label>
          <select
            id="ann-audience"
            className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors"
            value={selectedAudience}
            onChange={(e) => onAudienceChange(e.target.value)}
          >
            {audienceGroups.map((group) => (
              <option key={group.id} value={group.id}>
                {group.label}
              </option>
            ))}
          </select>
          {currentGroup && (
            <p className="text-xs text-muted-foreground">{currentGroup.help}</p>
          )}
        </div>

        {selectedAudience === "manual" && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium">Manual Contacts</label>
              <Button variant="outline" size="xs" onClick={onAddContact}>
                <Plus /> Add
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {manualContacts.map((contact, i) => (
                <div key={i} className="flex gap-1">
                  <Input
                    placeholder={`+15551234567`}
                    value={contact}
                    onChange={(e) => onManualContactChange(i, e.target.value)}
                    className="flex-1"
                  />
                  {manualContacts.length > 1 && (
                    <Button variant="ghost" size="icon" onClick={() => onRemoveContact(i)}>
                      <X />
                    </Button>
                  )}
                </div>
              ))}
            </div>
            {groupRecipients.length > 0 && (
              <p className="text-xs text-muted-foreground">
                {groupRecipients.length} contact(s) from selected audience
                {manualContacts.some((c) => c.trim()) && " + manual entries"}
              </p>
            )}
          </div>
        )}
    </div>
  )
}
