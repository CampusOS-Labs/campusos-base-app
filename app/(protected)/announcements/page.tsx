"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { WhatsAppPanel } from "./components/whatsapp-panel"
import { ComposeForm } from "./components/compose-form"
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
  update: "Update",
  maintenance: "Maintenance",
  new: "New",
  alert: "Alert",
  "payment-reminder": "Payment Reminder",
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

function extractPairingCode(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^[A-Z0-9-]{6,16}$/i.test(trimmed)) return null
  return trimmed.toUpperCase()
}

function parseConnectPayload(data: any): { qr: string | null; pairingCode: string | null; state: string } {
  const qr = toQrSrc(data?.qr ?? data?.base64 ?? data?.qrcode?.base64 ?? data?.qrcode)
  const pairingCode = extractPairingCode(data?.pairingCode ?? data?.code)
  const state = String(data?.instance?.state || data?.state || "").toLowerCase()
  return { qr, pairingCode, state }
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
  const [pairingCode, setPairingCode] = useState<string | null>(null)
  const [pairingPhone, setPairingPhone] = useState("")
  const [connectMode, setConnectMode] = useState<"qr" | "code">("qr")
  const [isRunning, setIsRunning] = useState(false)
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroup[]>([])
  const [recipientsByAudience, setRecipientsByAudience] = useState<Map<string, Recipient[]>>(new Map())
  const [selectedAudience, setSelectedAudience] = useState("")
  const [groupRecipients, setGroupRecipients] = useState<Recipient[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [annType, setAnnType] = useState("announcement")
  const [manualContacts, setManualContacts] = useState<string[]>([""])
  const [statusSummary, setStatusSummary] = useState("Ready.")
  const [statusIsError, setStatusIsError] = useState(false)
  const [sending, setSending] = useState(false)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAttemptsRef = useRef(0)
  const parentsMapRef = useRef<Map<string, Recipient>>(new Map())
  const sendAnywayRef = useRef(false)
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
      setPairingCode(null)
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
      setPairingCode(null)
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
        setPairingCode(null)
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
        setPairingCode(null)
        setConnectionState("connecting")
        setStatus("Scan the QR code with WhatsApp → Linked Devices.")
        startPolling()
        return
      }

      if (connectPayload.pairingCode) {
        setPairingCode(connectPayload.pairingCode)
        setQrCode(null)
        setConnectionState("connecting")
        setStatus('Enter the code in WhatsApp → Linked Devices → "Pair with code instead"')
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

  async function onGetPairingCode() {
    const phone = normalizePhone(pairingPhone)
    setPairingPhone(phone)
    if (!phone) {
      setStatus("Enter a phone number with country code.", true)
      return
    }
    if (phone.length < 10 || phone.length > 15) {
      setStatus("Phone must include country code (10-15 digits).", true)
      return
    }
    try {
      setIsRunning(true)
      await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {})
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/connect?number=${encodeURIComponent(phone)}`)
      const connectPayload = parseConnectPayload(data)
      if (connectPayload.pairingCode) {
        setPairingCode(connectPayload.pairingCode)
        setQrCode(null)
        setConnectionState("connecting")
        setStatus('Enter the code in WhatsApp → Linked Devices → "Pair with code instead"')
        startPolling()
      } else if (connectPayload.qr) {
        setQrCode(connectPayload.qr)
        setPairingCode(null)
        setConnectionState("connecting")
        setStatus("Scan the QR code with WhatsApp → Linked Devices.")
        startPolling()
      } else if (connectPayload.state === "open") {
        applyConnectionState("open")
      } else {
        setStatus("Failed to get pairing code.", true)
      }
    } catch {
      setStatus("Failed to get pairing code. Try again.", true)
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
      setPairingCode(null)
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
      const res = await fetch("/api/invoices")
      const json = await res.json()
      if (!json.success) throw new Error()
      const invoices: Invoice[] = json.data
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
      const groups: AudienceGroup[] = [
        { id: "unpaid-parents", label: `Unpaid Parents (${unpaidParents.length})`, help: "Parents with pending invoices. Includes payment links.", recipients: unpaidParents },
        { id: "all-parents", label: `All Parents (${allParents.length})`, help: "All parents in the system.", recipients: allParents },
        { id: "manual", label: "Manual Only", help: "Only send to manually entered phone numbers.", recipients: [] },
      ]
      setAudienceGroups(groups)
      const map = new Map(groups.map((g) => [g.id, g.recipients]))
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
    const titleTrimmed = title.trim()
    const messageTrimmed = message.trim()
    if (!titleTrimmed || !messageTrimmed) {
      setStatus("Title and message are required.", true)
      return
    }
    const typeLabel = TYPE_LABELS[annType] || "Update"
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
    if (!window.confirm(`Send "${titleTrimmed}" to ${allRecipients.length} contact(s)?`)) return
    setSending(true)
    setStatus("Sending announcement...")
    try {
      let validPhoneSet = new Set(allRecipients.map((r) => r.phone))
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
      const recipientsToSend = allRecipients.filter((r) => validPhoneSet.has(r.phone))
      if (recipientsToSend.length === 0) {
        setStatus("No valid WhatsApp numbers found.", true)
        setSending(false)
        return
      }
      const results: Array<{ phone: string; ok: boolean }> = []
      for (let index = 0; index < recipientsToSend.length; index++) {
        const recipient = recipientsToSend[index]
        setStatus(`Sending ${index + 1} of ${recipientsToSend.length}...`)
        const textLines = [`[${typeLabel}] ${titleTrimmed}`, "", messageTrimmed]
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
        if (index < recipientsToSend.length - 1) {
          await new Promise((r) => setTimeout(r, randomDelay(4000, 9000)))
        }
      }
      const sentCount = results.filter((r) => r.ok).length
      const failedCount = results.length - sentCount
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
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">New Announcement</h1>
          <p className="text-sm text-muted-foreground mt-1">Send a WhatsApp message to parents.</p>
        </div>

        <WhatsAppPanel
          connectionState={connectionState}
          qrCode={qrCode}
          pairingCode={pairingCode}
          pairingPhone={pairingPhone}
          connectMode={connectMode}
          isRunning={isRunning}
          onLogout={onLogout}
          onConnect={onConnect}
          onGetPairingCode={onGetPairingCode}
          onPairingPhoneChange={setPairingPhone}
          onConnectModeChange={setConnectMode}
        />

        <Card>
          <CardContent className="space-y-5 pt-6">
            <ComposeForm
              title={title}
              message={message}
              annType={annType}
              onTitleChange={setTitle}
              onMessageChange={setMessage}
              onAnnTypeChange={setAnnType}
            />

            <hr className="border-t" />

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

            <hr className="border-t" />

            <SendStatus
              statusSummary={statusSummary}
              statusIsError={statusIsError}
              sending={sending}
              onSend={onSend}
            />
          </CardContent>
        </Card>
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
    </div>
  )
}
