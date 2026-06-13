"use client"

import { useState, useEffect, useRef } from "react"
import { PageHeader, PageShell } from "@/components/page-layout"
import { WhatsAppPanel } from "./components/whatsapp-panel"
import { ComposeForm, type SelectedFile } from "./components/compose-form"
import { RecipientSelector } from "./components/recipient-selector"
import { SendStatus } from "./components/send-status"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { getUserGroups, getGroupWithContacts } from "@/lib/actions/groups"
import { logAnnouncement } from "@/lib/actions/announcements"

type Invoice = {
  invoiceNumber: string
  academicYear: string
  dueDate: string
  status: string
  totalAmount: number
  student: { id: string; name: string; class: string }
  parent: { name: string; phone: string; email: string }
}

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

type ConnectionState = "open" | "connecting" | "close" | "unknown"

const INSTANCE_NAME = "primary"

const TYPE_LABELS: Record<string, string> = {
  announcement: "📢 Announcement",
  activities: "🎯 Activities",
  "payment-reminder": "💰 Payment Reminder",
  media: "📸 Media",
}

function normalizePhone(value: string): string {
  return String(value || "").replace(/[^\d]/g, "")
}

function toQrSrc(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (trimmed.startsWith("data:image/")) return trimmed
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed
  if (/^[A-Za-z0-9+/=\n\r]+$/.test(trimmed) && trimmed.length >= 64) {
    return `data:image/png;base64,${trimmed.replace(/[\n\r]/g, "")}`
  }
  return null
}

function parseConnectPayload(data: any): { qr: string | null; state: string } {
  const qr = toQrSrc(data?.qr ?? data?.base64 ?? data?.qrcode?.base64 ?? data?.qrcode)
  const state = String(data?.instance?.state || data?.state || "").toLowerCase()
  return { qr, state }
}

function paymentLinkForInvoice(invoiceId: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin
  return `${origin}/pay/${invoiceId}`
}

function isPaymentReminder(type: string): boolean {
  return type === "payment-reminder"
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

async function api(method: string, path: string, body?: unknown) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 15000)
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    })
    if (!res.ok) {
      const text = await res.text().catch(() => "")
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`)
    }
    return res.json()
  } finally {
    clearTimeout(timer)
  }
}

export default function AnnouncementsPage() {
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroup[]>([])
  const [recipientsByAudience, setRecipientsByAudience] = useState<Map<string, Recipient[]>>(new Map())
  const [selectedAudience, setSelectedAudience] = useState("")
  const [groupRecipients, setGroupRecipients] = useState<Recipient[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [annType, setAnnType] = useState("announcement")
  const [selectedFile, setSelectedFile] = useState<SelectedFile>(null)
  const [manualContacts, setManualContacts] = useState<string[]>([""])
  const [statusSummary, setStatusSummary] = useState("Ready.")
  const [statusIsError, setStatusIsError] = useState(false)
  const [sending, setSending] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAttemptsRef = useRef(0)
  const parentsMapRef = useRef<Map<string, Recipient>>(new Map())
  const sendAnywayRef = useRef(false)
  const pendingSendRef = useRef<{ recipients: Recipient[]; title: string } | null>(null)
  const [showSendConfirm, setShowSendConfirm] = useState(false)
  const [showMissingAlert, setShowMissingAlert] = useState(false)
  const [missingNumbers, setMissingNumbers] = useState<string[]>([])

  function setStatus(msg: string, isError = false) {
    setStatusSummary(msg)
    setStatusIsError(isError)
  }

  function applyConnectionState(state: string) {
    const normalized = String(state || "").toLowerCase()
    if (normalized === "open") {
      setConnectionState("open")
      setQrCode(null)
      setStatus("WhatsApp connected.")
    } else if (normalized === "connecting") {
      setConnectionState("connecting")
      setStatus("Connecting to WhatsApp...")
    } else if (normalized === "unknown") {
      setConnectionState("unknown")
      setStatus("Unable to confirm connection. Retrying...")
    } else {
      setConnectionState("close")
      setStatus("WhatsApp disconnected.")
    }
  }

  async function checkInitialState() {
    await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {})
    try {
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`)
      const state = data?.instance?.state || "close"
      if (state === "open") {
        setConnectionState("open")
        setStatus("WhatsApp connected.")
      } else if (state === "connecting" || state === "syncing") {
        setConnectionState("connecting")
        setStatus("Connecting to WhatsApp...")
        startPolling()
      } else if (state === "unknown") {
        setConnectionState("unknown")
        setStatus("Unable to confirm connection. Retrying...")
        startPolling()
      } else {
        setConnectionState("close")
        setStatus("WhatsApp disconnected.")
      }
    } catch {
      setConnectionState("close")
    }
  }

  function startPolling() {
    pollAttemptsRef.current = 0
    if (pollRef.current) clearTimeout(pollRef.current)
    pollRef.current = setTimeout(() => pollConnectionState(), 3000)
  }

  async function pollConnectionState() {
    pollAttemptsRef.current += 1
    if (pollAttemptsRef.current > 30) {
      setQrCode(null)
      setConnectionState("close")
      setStatus("Connection expired. Try again.", true)
      return
    }
    try {
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`)
      const state: string = data?.instance?.state || data?.state || "unknown"
      if (state === "open") {
        applyConnectionState("open")
        return
      }
      if (state === "close") {
        if (pollAttemptsRef.current < 5) {
          pollRef.current = setTimeout(pollConnectionState, 2500)
          return
        }
        setQrCode(null)
        setConnectionState("close")
        setStatus("Connection expired. Try again.", true)
        return
      }
      if (state === "unknown") {
        pollRef.current = setTimeout(pollConnectionState, 3000)
        return
      }
      pollRef.current = setTimeout(pollConnectionState, 2000)
    } catch {
      pollRef.current = setTimeout(pollConnectionState, 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  async function onConnect() {
    try {
      setIsRunning(true)
      await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {})
      const stateData = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`)
      const state = stateData?.instance?.state || stateData?.state || ""
      if (state === "open") {
        applyConnectionState("open")
        return
      }
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/connect`)
      const connectPayload = parseConnectPayload(data)
      if (connectPayload.qr) {
        setQrCode(connectPayload.qr)
        setConnectionState("connecting")
        setStatus("Scan the QR code with WhatsApp → Linked Devices.")
        startPolling()
        return
      }

      if (connectPayload.state === "open") {
        applyConnectionState("open")
        return
      }

      if (connectPayload.state === "connecting" || connectPayload.state === "syncing") {
        setConnectionState("connecting")
        setStatus("Connecting to WhatsApp...")
        startPolling()
        return
      }

      setStatus("Could not start WhatsApp connection. Try again.", true)
    } catch {
      setStatus("Failed to start WhatsApp connection. Try again.", true)
    } finally {
      setIsRunning(false)
    }
  }

  async function onLogout() {
    try {
      setIsRunning(true)
      await api("DELETE", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME })
      setConnectionState("close")
      setQrCode(null)
      setStatus("WhatsApp disconnected.")
    } catch {
      // silently fail
    } finally {
      setIsRunning(false)
    }
  }

  function handleAudienceChange(id: string) {
    setSelectedAudience(id)
    const recipients = recipientsByAudience.get(id) || []
    setGroupRecipients(recipients)
  }

  function handleManualContactChange(index: number, value: string) {
    setManualContacts((prev) => {
      const next = [...prev]
      next[index] = value
      return next
    })
  }

  function handleAddContact() {
    setManualContacts((prev) => [...prev, ""])
  }

  function handleRemoveContact(index: number) {
    setManualContacts((prev) => {
      if (prev.length <= 1) return prev
      return prev.filter((_, i) => i !== index)
    })
  }

  async function loadAudienceGroups() {
    try {
      const groups: AudienceGroup[] = []
      const map = new Map<string, Recipient[]>()

      try {
        const [res, userGroups] = await Promise.all([
          fetch("/api/invoices").then((r) => r.json()),
          getUserGroups(),
        ])

        if (res.success) {
          const invoices: Invoice[] = res.data
          const parentsMap = new Map<string, Recipient>()
          for (const invoice of invoices) {
            const phone = normalizePhone(invoice?.parent?.phone)
            if (!phone) continue
            if (!parentsMap.has(phone)) {
              parentsMap.set(phone, { phone, parentName: invoice?.parent?.name || "Parent", invoices: [] })
            }
            const recipient = parentsMap.get(phone)!
            recipient.invoices.push({
              invoiceNumber: invoice.invoiceNumber,
              studentName: invoice?.student?.name || "Student",
              totalAmount: Number(invoice.totalAmount || 0),
              status: String(invoice.status || "pending").toLowerCase() === "paid" ? "paid" : "pending",
            })
          }
          const allParents = Array.from(parentsMap.values()).sort((a, b) => a.parentName.localeCompare(b.parentName))
          parentsMapRef.current = parentsMap
          const unpaidParents = allParents
            .map((r) => ({ ...r, invoices: r.invoices.filter((i) => i.status === "pending") }))
            .filter((r) => r.invoices.length > 0)

          groups.push(
            { id: "unpaid-parents", label: `Unpaid Parents (${unpaidParents.length})`, help: "Parents with pending invoices. Includes payment links.", recipients: unpaidParents },
            { id: "all-parents", label: `All Parents (${allParents.length})`, help: "All parents in the system.", recipients: allParents },
          )
          map.set("unpaid-parents", unpaidParents)
          map.set("all-parents", allParents)
        }

        const groupContactsData = await Promise.all(
          userGroups.filter((g: { contactCount: number }) => g.contactCount > 0)
            .map((g: { id: string; name: string; description: string | null }) =>
              getGroupWithContacts(g.id).then((data) => ({ group: g, data }))
            )
        )
        for (const { group: g, data: groupData } of groupContactsData) {
          const recipients: Recipient[] = groupData.contacts.map((c) => ({
            phone: c.phoneNumber,
            parentName: c.name,
            invoices: [],
          }))
          const groupId = `group-${g.id}`
          groups.push({
            id: groupId,
            label: `${g.name} (${recipients.length})`,
            help: `Saved group: ${g.description || g.name}`,
            recipients,
          })
          map.set(groupId, recipients)
        }
      } catch {}

      groups.push({ id: "manual", label: "Manual Only", help: "Only send to manually entered phone numbers.", recipients: [] })
      map.set("manual", [])

      setAudienceGroups(groups)
      setRecipientsByAudience(map)
      if (groups.length > 0) {
        const defaultId = annType === "payment-reminder" ? "unpaid-parents" : "all-parents"
        const firstId = groups.find((g) => g.id === defaultId) ? defaultId : groups[0].id
        setSelectedAudience(firstId)
        setGroupRecipients(map.get(firstId) || [])
      }
    } catch {
      setStatus("Could not load contact groups.", true)
    }
  }

  async function onSend() {
    if (!connectionState || connectionState !== "open") {
      try {
        const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`)
        applyConnectionState(data?.instance?.state)
      } catch {}
    }
    if (connectionState !== "open") {
      setStatus("WhatsApp is not connected. Connect first.", true)
      return
    }
    const isMedia = annType === "media"
    const titleTrimmed = title.trim()
    const messageTrimmed = message.trim()
    if (!titleTrimmed || (!messageTrimmed && !isMedia)) {
      setStatus("Title and message are required.", true)
      return
    }
    if (isMedia && !selectedFile) {
      setStatus("Please select a file to attach.", true)
      return
    }
    const typeLabel = TYPE_LABELS[annType]
    const manualRecipients: Recipient[] = manualContacts
      .filter((c) => normalizePhone(c))
      .map((c) => {
        const phone = normalizePhone(c)
        if (isPaymentReminder(annType)) {
          const matched = parentsMapRef.current.get(phone)
          if (matched) {
            return {
              ...matched,
              invoices: matched.invoices.filter((i) => i.status === "pending"),
            }
          }
        }
        return { phone, parentName: "Parent", invoices: [] }
      })
    const merged = new Map<string, Recipient>()
    if (selectedAudience !== "manual") {
      for (const r of groupRecipients) merged.set(r.phone, r)
    }
    for (const r of manualRecipients) {
      if (!merged.has(r.phone)) merged.set(r.phone, r)
    }
    const allRecipients = Array.from(merged.values())
    if (allRecipients.length === 0) {
      setStatus("Select an audience or enter at least one contact.", true)
      return
    }
    if (isPaymentReminder(annType) && selectedAudience === "manual" && !sendAnywayRef.current) {
      const manualPhones = manualContacts
        .filter((c) => normalizePhone(c))
        .map((c) => normalizePhone(c))
      const unmatched = manualPhones.filter((p) => !parentsMapRef.current.has(p))
      if (unmatched.length > 0) {
        setMissingNumbers(unmatched)
        setShowMissingAlert(true)
        return
      }
    }
    sendAnywayRef.current = false
    pendingSendRef.current = { recipients: allRecipients, title: titleTrimmed }
    setShowSendConfirm(true)
    return
  }

  async function executeSend() {
    if (!pendingSendRef.current) {
      setShowSendConfirm(false)
      return
    }

    const { recipients: allRecipients, title: titleTrimmed } = pendingSendRef.current
    setShowSendConfirm(false)
    pendingSendRef.current = null
    const isMedia = annType === "media"
    const typeLabel = TYPE_LABELS[annType]
    const messageTrimmed = message.trim()
    setSending(true)
    setStatus("Sending announcement...")
    try {
      let validPhoneSet = new Set(allRecipients.map((r) => normalizePhone(r.phone)))
      try {
        const validation = await api("POST", `/api/whatsapp/instance/${INSTANCE_NAME}/validate`, {
          numbers: allRecipients.map((r) => r.phone),
        })
        validPhoneSet = new Set(
          validation
            .filter((item: { exists: boolean }) => item.exists)
            .map((item: { number: string }) => normalizePhone(item.number))
        )
      } catch {}
      const recipientsToSend = allRecipients.filter((r) => validPhoneSet.has(normalizePhone(r.phone)))
      if (recipientsToSend.length === 0) {
        setStatus("No valid WhatsApp numbers found.", true)
        setSending(false)
        return
      }
      const results: Array<{ phone: string; ok: boolean }> = []
      for (let index = 0; index < recipientsToSend.length; index++) {
        const recipient = recipientsToSend[index]
        setStatus(`Sending ${index + 1} of ${recipientsToSend.length}...`)

        if (isMedia && selectedFile) {
          const caption = [`${typeLabel}: ${titleTrimmed}`, "", messageTrimmed].join("\n").trim()
          try {
            await api("POST", `/api/whatsapp/instance/${INSTANCE_NAME}/send-media`, {
              number: recipient.phone,
              mediatype: selectedFile.mediatype,
              media: selectedFile.base64,
              caption,
              fileName: selectedFile.name,
              delay: 1200,
            })
            results.push({ phone: recipient.phone, ok: true })
          } catch {
            results.push({ phone: recipient.phone, ok: false })
          }
        } else {
          const textLines = [`${typeLabel}: ${titleTrimmed}`, "", messageTrimmed]
          if (isPaymentReminder(annType) && recipient.invoices.length > 0) {
            textLines.push("", "Pending payment link(s):")
            for (const inv of recipient.invoices) {
              textLines.push(`- ${inv.studentName} (${inv.invoiceNumber}) ${paymentLinkForInvoice(inv.invoiceNumber)}`)
            }
          }
          const text = textLines.join("\n")
          try {
            await api("POST", `/api/whatsapp/instance/${INSTANCE_NAME}/send`, {
              number: recipient.phone,
              text,
              delay: 1200,
            })
            results.push({ phone: recipient.phone, ok: true })
          } catch {
            results.push({ phone: recipient.phone, ok: false })
          }
        }

        if (index < recipientsToSend.length - 1) {
          await new Promise((r) => setTimeout(r, randomDelay(4000, 9000)))
        }
      }
      const sentCount = results.filter((r) => r.ok).length
      const failedCount = results.length - sentCount

      logAnnouncement({
        title: titleTrimmed,
        message: messageTrimmed || null,
        type: annType,
        recipientCount: sentCount,
        groupId: selectedAudience.startsWith("group-") ? selectedAudience.slice(6) : null,
        audienceLabel: audienceGroups.find((g) => g.id === selectedAudience)?.label || null,
      }).catch(() => {})

      setTitle("")
      setMessage("")
      setAnnType("announcement")
      setSelectedFile(null)
      setManualContacts([""])

      if (failedCount > 0) {
        setStatus(`Sent to ${sentCount} contact(s). ${failedCount} failed.`, true)
      } else {
        setStatus(`Sent to ${sentCount} contact(s).`)
      }
    } catch {
      setStatus("Something went wrong while sending.", true)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    checkInitialState()
    loadAudienceGroups()
    const params = new URLSearchParams(window.location.search)
    const invoiceParam = params.get("invoice")
    if (invoiceParam && !message.trim()) {
      setMessage(`Please complete your pending fee payment using your secure link:\n${paymentLinkForInvoice(invoiceParam)}`)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const audienceParam = params.get("audience")
    if (audienceParam && recipientsByAudience.has(audienceParam)) {
      handleAudienceChange(audienceParam)
      return
    }
    if (recipientsByAudience.size > 0) {
      const targetId = annType === "payment-reminder" ? "unpaid-parents" : "all-parents"
      if (recipientsByAudience.has(targetId)) {
        handleAudienceChange(targetId)
      }
    }
  }, [recipientsByAudience, annType]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="New announcement"
        description="Send a WhatsApp message to parents."
      />

      <WhatsAppPanel
        connectionState={connectionState}
        qrCode={qrCode}
        isRunning={isRunning}
        onLogout={onLogout}
        onConnect={onConnect}
      />

      <div className="flex flex-col gap-5 border-t border-border pt-8">
        <ComposeForm
          title={title}
          message={message}
          annType={annType}
          selectedFile={selectedFile}
          onTitleChange={setTitle}
          onMessageChange={setMessage}
          onAnnTypeChange={setAnnType}
          onFileSelect={setSelectedFile}
        />

        <hr className="border-t border-border" />

        <RecipientSelector
          audienceGroups={audienceGroups}
          selectedAudience={selectedAudience}
          groupRecipients={groupRecipients}
          manualContacts={manualContacts}
          onAudienceChange={handleAudienceChange}
          onManualContactChange={handleManualContactChange}
          onAddContact={handleAddContact}
          onRemoveContact={handleRemoveContact}
        />

        <hr className="border-t border-border" />

        <SendStatus
          statusSummary={statusSummary}
          statusIsError={statusIsError}
          sending={sending}
          onSend={onSend}
        />
      </div>

      <Dialog open={showMissingAlert} onOpenChange={setShowMissingAlert}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Unmatched Phone Numbers</DialogTitle>
            <DialogDescription>
              These phone numbers don{"'"}t match any parent in the system. They won{"'"}t receive payment links.
            </DialogDescription>
          </DialogHeader>
          <ul className="list-disc pl-5 space-y-1">
            {missingNumbers.map((n) => (
              <li key={n} className="text-sm text-muted-foreground">{n}</li>
            ))}
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMissingAlert(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                sendAnywayRef.current = true
                setShowMissingAlert(false)
                onSend()
              }}
            >
              Send Anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Send</DialogTitle>
            <DialogDescription>
              Send "{pendingSendRef.current?.title}" to {pendingSendRef.current?.recipients.length} contact(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={executeSend}>
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
