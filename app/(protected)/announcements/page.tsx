"use client"

import { useState, useEffect, useRef } from "react"

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

function normalizePhone(value: string): string {
  return String(value || "").replace(/[^\d]/g, "")
}

function paymentLinkForInvoice(invoiceId: string): string {
  return `${window.location.origin}/pay/${invoiceId}`
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const TYPE_LABELS: Record<string, string> = {
  update: "Update",
  maintenance: "Maintenance",
  new: "New",
  alert: "Alert",
}

export default function AnnouncementsPage() {
  const [baseUrl, setBaseUrl] = useState("http://localhost:8080")
  const [instanceName, setInstanceName] = useState("evolution")
  const [apiKey, setApiKey] = useState("429683C4C977415CAAFCCE10F7D57E11")
  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown")
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [isRunning, setIsRunning] = useState(false)
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroup[]>([])
  const [recipientsByAudience, setRecipientsByAudience] = useState<Map<string, Recipient[]>>(new Map())
  const [selectedAudience, setSelectedAudience] = useState("")
  const [groupRecipients, setGroupRecipients] = useState<Recipient[]>([])
  const [title, setTitle] = useState("")
  const [message, setMessage] = useState("")
  const [annType, setAnnType] = useState("update")
  const [manualContacts, setManualContacts] = useState(["", "", "", ""])
  const [statusSummary, setStatusSummary] = useState("Ready.")
  const [statusIsError, setStatusIsError] = useState(false)
  const [logLines, setLogLines] = useState<string[]>([])
  const [sending, setSending] = useState(false)
  const logRef = useRef<HTMLPreElement>(null)
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pollAttemptsRef = useRef(0)

  function log(msg: string) {
    setLogLines((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`])
  }

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight
  }, [logLines])

  function setStatus(msg: string, isError = false) {
    setStatusSummary(msg)
    setStatusIsError(isError)
  }

  function saveConfig() {
    try {
      localStorage.setItem("wa_connection_config_v1", JSON.stringify({ baseUrl, instanceName, apiKey }))
    } catch {}
  }

  useEffect(() => {
    try {
      const raw = localStorage.getItem("wa_connection_config_v1")
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed.baseUrl) setBaseUrl(parsed.baseUrl)
        if (parsed.instanceName) setInstanceName(parsed.instanceName)
        if (parsed.apiKey) setApiKey(parsed.apiKey)
      }
    } catch {}
  }, [])

  function getConfig() {
    const url = baseUrl.trim().replace(/\/+$/, "")
    const name = instanceName.trim()
    const key = apiKey.trim()
    if (!url || !name || !key) throw new Error("Base URL, Instance Name, and API Key are required.")
    return { baseUrl: url, instanceName: name, apiKey: key }
  }

  async function api(method: string, path: string, body?: unknown) {
    const cfg = getConfig()
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(`${cfg.baseUrl}${path}`, {
        method,
        headers: { "Content-Type": "application/json", apikey: cfg.apiKey },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        throw new Error(`HTTP ${res.status}: ${text.slice(0, 300)}`)
      }
      return res.json()
    } finally {
      clearTimeout(timer)
    }
  }

  function applyConnectionState(state: string, quiet = false) {
    const normalized = String(state || "").toLowerCase()
    if (normalized === "open") {
      setConnectionState("open")
      setQrCode(null)
      setStatus("WhatsApp connected.")
      if (!quiet) log("Connection state: open")
    } else if (normalized === "connecting") {
      setConnectionState("connecting")
      setStatus("Instance is connecting. Scan QR if prompted.")
      if (!quiet) log("Connection state: connecting")
    } else {
      setConnectionState("close")
      setStatus("Instance is disconnected.")
      if (!quiet) log(`Connection state: ${normalized || "unknown"}`)
    }
  }

  async function fetchConnectionState(quiet = false): Promise<string> {
    try {
      const data = await api("GET", `/instance/connectionState/${encodeURIComponent(getConfig().instanceName)}`)
      applyConnectionState(data?.instance?.state, quiet)
      return data?.instance?.state || "unknown"
    } catch (err) {
      if (!quiet) log(`ERROR: ${err instanceof Error ? err.message : "Unknown"}`)
      return "unknown"
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
      log('Polling timed out after ~60s.')
      setQrCode(null)
      setStatus('QR may have expired. Click "Get QR Code" for a fresh one.', true)
      return
    }
    try {
      const data = await api("GET", `/instance/connectionState/${encodeURIComponent(getConfig().instanceName)}`)
      const state: string = data.instance.state
      if (state === "open") {
        applyConnectionState("open")
        log("Successfully connected to WhatsApp.")
        return
      }
      if (state === "close") {
        setQrCode(null)
        setStatus('Connection closed. Click "Get QR Code" again.', true)
        return
      }
      log(`Connecting... (${Math.round(pollAttemptsRef.current * 2)}s elapsed)`)
      pollRef.current = setTimeout(pollConnectionState, 2000)
    } catch (err) {
      log(`State check: ${err instanceof Error ? err.message : "Unknown"}`)
      pollRef.current = setTimeout(pollConnectionState, 3000)
    }
  }

  useEffect(() => {
    return () => {
      if (pollRef.current) clearTimeout(pollRef.current)
    }
  }, [])

  async function onCheckServer() {
    try {
      saveConfig()
      setIsRunning(true)
      setStatus("Checking server...")
      log("Checking server connection...")
      const data = await api("GET", "/")
      log(`Server OK - ${data.message} (v${data.version})`)
      setStatus("Server reachable.")
    } catch (err) {
      log(`ERROR: ${err instanceof Error ? err.message : "Unknown"}`)
      setStatus("Could not reach server.", true)
    } finally {
      setIsRunning(false)
    }
  }

  async function onCreateInstance() {
    try {
      saveConfig()
      setIsRunning(true)
      log("Creating instance...")
      const data = await api("POST", "/instance/create", {
        instanceName: getConfig().instanceName,
        integration: "WHATSAPP-BAILEYS",
      })
      log(`Instance created: ${data.instance.instanceName}`)
      setStatus('Instance created. Click "Get QR Code".')
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown"
      log(`ERROR: ${msg}`)
      if (msg.includes("400") || msg.includes("already")) {
        setStatus('Instance may already exist. Try "Get QR Code".')
      } else {
        setStatus("Instance creation failed.", true)
      }
    } finally {
      setIsRunning(false)
    }
  }

  async function onConnect() {
    try {
      saveConfig()
      setIsRunning(true)
      setStatus("Checking existing connection...")
      const current = await fetchConnectionState(true)
      if (String(current).toLowerCase() === "open") {
        applyConnectionState("open")
        log("Already connected. No QR scan needed.")
        return
      }
      log("Ensuring instance exists...")
      try {
        await api("POST", "/instance/create", {
          instanceName: getConfig().instanceName,
          integration: "WHATSAPP-BAILEYS",
        })
        log("Instance created.")
      } catch (err) {
        const msg = err instanceof Error ? err.message : ""
        if (msg.includes("400") || msg.toLowerCase().includes("already")) {
          log("Instance already exists. Reusing it.")
        } else {
          throw err
        }
      }
      setStatus("Requesting QR / reconnect...")
      log("Requesting QR from existing instance...")
      for (let attempt = 1; attempt <= 5; attempt++) {
        log(`Connect attempt ${attempt}/5...`)
        const data = await api("GET", `/instance/connect/${encodeURIComponent(getConfig().instanceName)}`)
        if (data.base64) {
          setQrCode(data.base64)
          log("QR code received.")
          log("Open WhatsApp on your phone -> Linked Devices -> Link a Device.")
          setStatus("Scan the QR code with WhatsApp -> Linked Devices.")
          startPolling()
          return
        }
        if (String(data?.instance?.state || "").toLowerCase() === "open") {
          applyConnectionState("open")
          return
        }
        log("No QR in response yet. Retrying...")
        await new Promise((r) => setTimeout(r, 3000))
      }
      try {
        const stateData = await api("GET", `/instance/connectionState/${encodeURIComponent(getConfig().instanceName)}`)
        log(`Final state: ${stateData.instance.state}`)
      } catch {}
      setStatus("Could not get QR after 5 attempts. Check server logs.", true)
    } catch (err) {
      log(`ERROR: ${err instanceof Error ? err.message : "Unknown"}`)
      setStatus("Failed to get QR code.", true)
    } finally {
      setIsRunning(false)
    }
  }

  async function onLogout() {
    try {
      saveConfig()
      setIsRunning(true)
      log("Logging out instance...")
      await api("DELETE", `/instance/logout/${encodeURIComponent(getConfig().instanceName)}`)
      log("Instance logged out.")
      setConnectionState("close")
      setQrCode(null)
      setStatus('Instance logged out. Click "Get QR Code" to reconnect.')
    } catch (err) {
      log(`Logout error: ${err instanceof Error ? err.message : "Unknown"}`)
    } finally {
      setIsRunning(false)
    }
  }

  async function onCheckState() {
    saveConfig()
    await fetchConnectionState()
  }

  function fillContacts(recipients: Recipient[]) {
    const phones = recipients.slice(0, 4).map((r) => `+${r.phone}`)
    const next = [...manualContacts]
    for (let i = 0; i < 4; i++) next[i] = phones[i] || ""
    setManualContacts(next)
  }

  function handleAudienceChange(id: string) {
    setSelectedAudience(id)
    const recipients = recipientsByAudience.get(id) || []
    setGroupRecipients(recipients)
    fillContacts(recipients)
  }

  async function loadAudienceGroups() {
    try {
      const res = await fetch("/api/invoices")
      const json = await res.json()
      if (!json.success) throw new Error(json.error || "Failed to fetch invoices")
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
      const unpaidParents = allParents
        .map((r) => ({ ...r, invoices: r.invoices.filter((i) => i.status === "pending") }))
        .filter((r) => r.invoices.length > 0)
      const groups: AudienceGroup[] = [
        { id: "unpaid-parents", label: `Unpaid Parents (${unpaidParents.length})`, help: "Auto-group from pending invoices. Includes unique payment link(s).", recipients: unpaidParents },
        { id: "all-parents", label: `All Parents (${allParents.length})`, help: "All parents found in invoice records.", recipients: allParents },
      ]
      setAudienceGroups(groups)
      const map = new Map(groups.map((g) => [g.id, g.recipients]))
      setRecipientsByAudience(map)
      if (groups.length > 0) {
        setSelectedAudience(groups[0].id)
        fillContacts(groups[0].recipients)
        setGroupRecipients(groups[0].recipients)
      }
      log(`Audience groups loaded: ${groups.map((g) => `${g.id}=${g.recipients.length}`).join(", ")}`)
    } catch (err) {
      setStatus("Could not load invoice groups.", true)
      log(`Audience groups unavailable: ${err instanceof Error ? err.message : "Unknown"}`)
    }
  }

  async function onSend() {
    if (!connectionState || connectionState !== "open") {
      await fetchConnectionState()
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
      .map((c) => ({ phone: normalizePhone(c), parentName: "Parent", invoices: [] }))
    const merged = new Map<string, Recipient>()
    for (const r of groupRecipients) merged.set(r.phone, r)
    for (const r of manualRecipients) {
      if (!merged.has(r.phone)) merged.set(r.phone, r)
    }
    const allRecipients = Array.from(merged.values())
    if (allRecipients.length === 0) {
      setStatus("Select an audience or enter at least one contact.", true)
      return
    }
    if (!window.confirm(`Send "${titleTrimmed}" to ${allRecipients.length} contact(s)?`)) return
    setSending(true)
    setStatus("Sending announcement...")
    try {
      let validPhoneSet = new Set(allRecipients.map((r) => r.phone))
      try {
        log(`Validating ${allRecipients.length} contact(s)...`)
        const validation = await api("POST", `/chat/whatsappNumbers/${encodeURIComponent(getConfig().instanceName)}`, {
          numbers: allRecipients.map((r) => r.phone),
        })
        validPhoneSet = new Set(
          validation
            .filter((item: { exists: boolean }) => item.exists)
            .map((item: { number: string }) => normalizePhone(item.number))
        )
        log(`Valid: ${validPhoneSet.size}, Invalid: ${allRecipients.length - validPhoneSet.size}`)
      } catch (err) {
        log(`Validation skipped: ${err instanceof Error ? err.message : "Unknown"}. Sending to all.`)
      }
      const recipientsToSend = allRecipients.filter((r) => validPhoneSet.has(r.phone))
      if (recipientsToSend.length === 0) {
        setStatus("No valid contacts found.", true)
        setSending(false)
        return
      }
      const results: Array<{ phone: string; ok: boolean; error?: string }> = []
      for (let index = 0; index < recipientsToSend.length; index++) {
        const recipient = recipientsToSend[index]
        log(`Sending (${index + 1}/${recipientsToSend.length}) -> ${recipient.phone}`)
        const textLines = [`[${typeLabel}] ${titleTrimmed}`, "", messageTrimmed]
        if (recipient.invoices.length > 0) {
          textLines.push("", "Pending payment link(s):")
          for (const inv of recipient.invoices) {
            textLines.push(`- ${inv.studentName} (${inv.invoiceNumber}) ${paymentLinkForInvoice(inv.invoiceNumber)}`)
          }
        }
        const text = textLines.join("\n")
        try {
          await api("POST", `/message/sendText/${encodeURIComponent(getConfig().instanceName)}`, {
            number: recipient.phone,
            text,
            delay: 1200,
          })
          results.push({ phone: recipient.phone, ok: true })
          log(`Sent to ${recipient.phone}`)
        } catch (err) {
          results.push({ phone: recipient.phone, ok: false, error: err instanceof Error ? err.message : "Unknown" })
          log(`Failed ${recipient.phone}: ${err instanceof Error ? err.message : "Unknown"}`)
        }
        if (index < recipientsToSend.length - 1) {
          const wait = randomDelay(4000, 9000)
          log(`Waiting ${wait}ms...`)
          await new Promise((r) => setTimeout(r, wait))
        }
      }
      const sentCount = results.filter((r) => r.ok).length
      const failedCount = results.length - sentCount
      setStatus(`Done. Sent: ${sentCount}, Failed: ${failedCount}`)
      if (failedCount > 0) {
        log("Failed:")
        results.filter((r) => !r.ok).forEach((r) => log(`  - ${r.phone}: ${r.error}`))
      }
      log(`Summary: ${sentCount} sent, ${failedCount} failed`)
    } catch (err) {
      setStatus(`Send error: ${err instanceof Error ? err.message : "Unknown"}`, true)
      log(`ERROR: ${err instanceof Error ? err.message : "Unknown"}`)
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    log("Announcements ready.")
    log('Step 1: Fill server config, click "Check Server"')
    log("Step 2: Create Instance")
    log('Step 3: Get QR Code and scan with WhatsApp')
    log("Step 4: Select audience, review contacts, and send")
    loadAudienceGroups()
    const params = new URLSearchParams(window.location.search)
    const invoiceParam = params.get("invoice")
    if (invoiceParam && !message.trim()) {
      setMessage(`Please complete your pending fee payment using your secure link:\n${paymentLinkForInvoice(invoiceParam)}`)
    }
    fetchConnectionState(true)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const audienceParam = params.get("audience")
    if (audienceParam && recipientsByAudience.has(audienceParam)) {
      handleAudienceChange(audienceParam)
    }
  }, [recipientsByAudience]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Announcements</h1>
        <p className="text-sm text-muted-foreground mt-1">Compose a new update or browse what you&apos;ve sent.</p>
      </div>

      <div className="rounded-md border p-4 space-y-3" id="wa-panel">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">WhatsApp Connection</h3>
          <span
            className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
              connectionState === "open"
                ? "bg-green-100 text-green-800"
                : connectionState === "connecting"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-gray-100 text-gray-800"
            }`}
          >
            {connectionState === "open" ? "Connected" : connectionState === "connecting" ? "Connecting..." : "Disconnected"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Server URL"
            value={baseUrl}
            onChange={(e) => { setBaseUrl(e.target.value); saveConfig() }}
          />
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Instance Name"
            value={instanceName}
            onChange={(e) => { setInstanceName(e.target.value); saveConfig() }}
          />
          <input
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            type="password"
            placeholder="API Key"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); saveConfig() }}
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={onCheckServer} disabled={isRunning} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            1. Check Server
          </button>
          <button onClick={onCreateInstance} disabled={isRunning} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            2. Create Instance
          </button>
          <button onClick={onConnect} disabled={isRunning} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            3. Get QR Code
          </button>
          <button onClick={onCheckState} disabled={isRunning} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2">
            State
          </button>
          <button onClick={onLogout} disabled={isRunning} className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground h-9 px-4 py-2 text-orange-600 border-orange-200 hover:bg-orange-50">
            Logout
          </button>
        </div>
        {qrCode && (
          <div className="flex flex-col items-center mt-2">
            <img src={qrCode} className="w-44 h-44 border rounded-md" alt="QR Code" />
            <p className="text-xs text-muted-foreground mt-1">Scan with WhatsApp &rarr; Linked Devices</p>
          </div>
        )}
      </div>

      <div className="rounded-md border p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ann-title">Title</label>
            <input
              id="ann-title"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="e.g. New feature rollout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium" htmlFor="ann-audience">Audience</label>
            <select
              id="ann-audience"
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              value={selectedAudience}
              onChange={(e) => handleAudienceChange(e.target.value)}
            >
              {audienceGroups.map((group) => (
                <option key={group.id} value={group.id}>
                  {group.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              {audienceGroups.find((g) => g.id === selectedAudience)?.help || "Groups are auto-created from invoices."}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Type</label>
          <div className="flex flex-wrap gap-1">
            {["update", "maintenance", "new", "alert"].map((type) => (
              <button
                key={type}
                onClick={() => setAnnType(type)}
                className={`inline-flex items-center justify-center rounded-md text-xs font-medium transition-colors h-8 px-3 border ${
                  annType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-background border-input hover:bg-accent"
                }`}
              >
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="ann-message">Message</label>
          <textarea
            id="ann-message"
            className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            placeholder="Write your announcement..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Recipients (WhatsApp)</label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {manualContacts.map((contact, i) => (
              <input
                key={i}
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={`+15551234567 (contact ${i + 1})`}
                value={contact}
                onChange={(e) => {
                  const next = [...manualContacts]
                  next[i] = e.target.value
                  setManualContacts(next)
                }}
              />
            ))}
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t">
          <button
            onClick={onSend}
            disabled={sending || isRunning}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground shadow hover:bg-primary/90 h-9 px-4 py-2"
          >
            {sending ? "Sending..." : "Send announcement"}
          </button>
        </div>

        <div className="space-y-2 pt-2">
          <div className={`text-sm font-semibold ${statusIsError ? "text-red-600" : ""}`}>{statusSummary}</div>
          <pre
            ref={logRef}
            className="bg-muted/50 text-xs p-3 rounded-md max-h-48 overflow-auto whitespace-pre-wrap font-mono"
          >
            {logLines.join("\n") || " "}
          </pre>
        </div>
      </div>
    </div>
  )
}
