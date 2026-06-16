"use client"

import { Suspense, useState, useEffect, useRef, useMemo } from "react"
import { useSearchParams } from "next/navigation"
import { PageHeader, PageShell } from "@/components/page-layout"
import { WhatsAppPanel } from "./components/whatsapp-panel"
import { ComposeForm, type SelectedFile } from "./components/compose-form"
import { RecipientSelector } from "./components/recipient-selector"
import { SendFooter } from "./components/send-footer"
import { WizardStep, WizardStepBadge } from "@/components/wizard-step"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { logAnnouncement } from "@/lib/actions/announcements"
import { trackAuthEvent } from "@/lib/analytics/track-event-client"
import {
  ANNOUNCEMENT_FLOW_STEP,
  ANNOUNCEMENT_SEND_FAILED,
  ANNOUNCEMENT_SENT,
  PAGE_VIEW,
  PRODUCT_PAGES,
  WHATSAPP_STATE,
} from "@/lib/services/product-analytics-events"
import type { Invoice as ServiceInvoice } from "@/lib/services/invoices"

type Invoice = ServiceInvoice

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

function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
  durationMs?: number
) {
  trackAuthEvent(event, properties, durationMs)
}

const TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  activities: "Activities",
  "payment-reminder": "Payment Reminder",
  media: "Media",
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

type UserGroup = {
  id: string
  name: string
  description: string | null
  contactCount: number
}

type AnnouncementsClientProps = {
  initialInvoices: Invoice[]
  initialUserGroups: UserGroup[]
}

export function AnnouncementsClient({
  initialInvoices,
  initialUserGroups,
}: AnnouncementsClientProps) {
  return (
    <Suspense fallback={<AnnouncementsLoading />}>
      <AnnouncementsClientInner
        initialInvoices={initialInvoices}
        initialUserGroups={initialUserGroups}
      />
    </Suspense>
  )
}

function AnnouncementsLoading() {
  return (
    <PageShell className="space-y-6 pb-24">
      <PageHeader title="New announcement" description="Send a WhatsApp message to parents." />
      <div className="space-y-4">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className="h-32 animate-pulse rounded-xl border border-border/80 bg-muted/30"
          />
        ))}
      </div>
    </PageShell>
  )
}

function AnnouncementsClientInner({
  initialInvoices,
  initialUserGroups,
}: AnnouncementsClientProps) {
  const searchParams = useSearchParams()
  const invoiceParam = searchParams.get("invoice")
  const audienceParam = searchParams.get("audience")
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
  const flowStartTimeRef = useRef(Date.now())
  const whatsappOpenTrackedRef = useRef(false)
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
      if (!whatsappOpenTrackedRef.current) {
        whatsappOpenTrackedRef.current = true
        trackEvent(WHATSAPP_STATE, { state: "open" })
      }
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
        applyConnectionState("open")
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
    trackEvent(ANNOUNCEMENT_FLOW_STEP, {
      step: "recipient_selected",
      audience: id,
    })
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
        const invoices = initialInvoices
        const userGroups = initialUserGroups

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
        parentsMapRef.current = parentsMap
        const unpaidParents = Array.from(parentsMap.values())
          .map((r) => ({ ...r, invoices: r.invoices.filter((i) => i.status === "pending") }))
          .filter((r) => r.invoices.length > 0)
          .sort((a, b) => a.parentName.localeCompare(b.parentName))

        const { getGroupWithContacts } = await import("@/lib/actions/groups")
        const groupContactsData = await Promise.all(
          userGroups.filter((g) => g.contactCount > 0)
            .map((g) =>
              getGroupWithContacts(g.id).then((data) => ({ group: g, data }))
            )
        )

        const allParentsMap = new Map<string, Recipient>()
        for (const { group: g, data: groupData } of groupContactsData) {
          const recipients: Recipient[] = groupData.contacts.map((c) => {
            const phone = c.phoneNumber
            const fromInvoice = parentsMap.get(normalizePhone(phone))
            return {
              phone,
              parentName: c.name,
              invoices: fromInvoice?.invoices ?? [],
            }
          })
          for (const recipient of recipients) {
            const key = normalizePhone(recipient.phone)
            if (!allParentsMap.has(key)) allParentsMap.set(key, recipient)
          }
          const groupId = `group-${g.id}`
          groups.push({
            id: groupId,
            label: `${g.name} (${recipients.length})`,
            help: `Saved group: ${g.description || g.name}`,
            recipients,
          })
          map.set(groupId, recipients)
        }

        const allParents = (
          allParentsMap.size > 0
            ? Array.from(allParentsMap.values())
            : Array.from(parentsMap.values())
        ).sort((a, b) => a.parentName.localeCompare(b.parentName))

        groups.unshift(
          { id: "unpaid-parents", label: `Unpaid Parents (${unpaidParents.length})`, help: "Parents with pending invoices. Includes payment links.", recipients: unpaidParents },
          { id: "all-parents", label: `All Parents (${allParents.length})`, help: "All contacts from your saved groups (deduplicated by phone).", recipients: allParents },
        )
        map.set("unpaid-parents", unpaidParents)
        map.set("all-parents", allParents)
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
    trackEvent(ANNOUNCEMENT_FLOW_STEP, { step: "send_confirmed" })
    setShowSendConfirm(true)
    return
  }

  async function executeSend() {
    if (!pendingSendRef.current) {
      setShowSendConfirm(false)
      return
    }

    trackEvent(ANNOUNCEMENT_FLOW_STEP, { step: "send_started" })

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
        trackEvent(ANNOUNCEMENT_SEND_FAILED, { reason: "no_valid_numbers" })
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
      const durationMs = Date.now() - flowStartTimeRef.current

      logAnnouncement({
        title: titleTrimmed,
        message: messageTrimmed || null,
        type: annType,
        recipientCount: sentCount,
        groupId: selectedAudience.startsWith("group-") ? selectedAudience.slice(6) : null,
        audienceLabel: audienceGroups.find((g) => g.id === selectedAudience)?.label || null,
      }).catch(() => {})

      if (sentCount > 0) {
        trackEvent(
          ANNOUNCEMENT_SENT,
          {
            recipientCount: sentCount,
            failedCount,
            type: annType,
            audience: selectedAudience,
          },
          durationMs
        )
      } else {
        trackEvent(ANNOUNCEMENT_SEND_FAILED, {
          reason: "all_recipients_failed",
          recipientCount: allRecipients.length,
        })
      }

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
      trackEvent(ANNOUNCEMENT_SEND_FAILED, { reason: "unexpected_error" })
      setStatus("Something went wrong while sending.", true)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    flowStartTimeRef.current = Date.now()
    trackEvent(PAGE_VIEW, { page: PRODUCT_PAGES.announcementsCompose })
    checkInitialState()
    loadAudienceGroups()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (invoiceParam && !message.trim()) {
      setMessage(`Please complete your pending fee payment using your secure link:\n${paymentLinkForInvoice(invoiceParam)}`)
    }
  }, [invoiceParam, message])

  useEffect(() => {
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
  }, [recipientsByAudience, annType, audienceParam]) // eslint-disable-line react-hooks/exhaustive-deps

  const isWhatsAppReady = connectionState === "open"
  const isMedia = annType === "media"

  const totalRecipientCount = useMemo(() => {
    const merged = new Map<string, Recipient>()
    if (selectedAudience !== "manual") {
      for (const recipient of groupRecipients) merged.set(recipient.phone, recipient)
    }
    for (const contact of manualContacts) {
      const phone = normalizePhone(contact)
      if (phone && !merged.has(phone)) {
        merged.set(phone, { phone, parentName: "Parent", invoices: [] })
      }
    }
    return merged.size
  }, [selectedAudience, groupRecipients, manualContacts])

  const canSend =
    isWhatsAppReady &&
    totalRecipientCount > 0 &&
    title.trim().length > 0 &&
    (message.trim().length > 0 || isMedia) &&
    (!isMedia || selectedFile !== null)

  return (
    <PageShell className="space-y-6 pb-24">
      <PageHeader
        title="New announcement"
        description="Connect WhatsApp, write your message, choose parents, and send."
      />

      <div className="space-y-4">
        <WizardStep
          step={1}
          title="WhatsApp"
          description="Link the school WhatsApp account used for parent messages."
          badge={
            isWhatsAppReady ? (
              <WizardStepBadge variant="secondary">Ready</WizardStepBadge>
            ) : (
              <WizardStepBadge variant="outline">Required</WizardStepBadge>
            )
          }
        >
          <WhatsAppPanel
            connectionState={connectionState}
            qrCode={qrCode}
            isRunning={isRunning}
            onLogout={onLogout}
            onConnect={onConnect}
          />
        </WizardStep>

        <WizardStep
          step={2}
          title="Compose"
          description="What parents will receive on WhatsApp."
          disabled={!isWhatsAppReady}
        >
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
        </WizardStep>

        <WizardStep
          step={3}
          title="Recipients"
          description="Choose a group or add individual numbers."
          disabled={!isWhatsAppReady}
          badge={
            totalRecipientCount > 0 ? (
              <WizardStepBadge>{totalRecipientCount} selected</WizardStepBadge>
            ) : null
          }
        >
          <RecipientSelector
            audienceGroups={audienceGroups}
            selectedAudience={selectedAudience}
            groupRecipients={groupRecipients}
            manualContacts={manualContacts}
            totalRecipientCount={totalRecipientCount}
            onAudienceChange={handleAudienceChange}
            onManualContactChange={handleManualContactChange}
            onAddContact={handleAddContact}
            onRemoveContact={handleRemoveContact}
          />
        </WizardStep>
      </div>

      <SendFooter
        statusSummary={statusSummary}
        statusIsError={statusIsError}
        sending={sending}
        totalRecipientCount={totalRecipientCount}
        canSend={canSend}
        onSend={onSend}
      />

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
