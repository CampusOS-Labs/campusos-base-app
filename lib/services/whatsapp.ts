interface InstanceMeta {
  state: "open" | "connecting" | "close"
}

export class EvolutionHttpError extends Error {
  status: number
  payload: unknown

  constructor(status: number, message: string, payload?: unknown) {
    super(message)
    this.name = "EvolutionHttpError"
    this.status = status
    this.payload = payload
  }
}

const globalForWhatsApp = globalThis as typeof globalThis & {
  __whatsAppManager?: WhatsAppManager
}

const config = {
  baseUrl: (process.env.EVOLUTION_API_URL || "").replace(/\/+$/, ""),
  apiKey: process.env.EVOLUTION_API_KEY || "",
}

export class WhatsAppManager {
  private instances = new Map<string, InstanceMeta>()

  private mapState(raw: unknown): "open" | "connecting" | "close" {
    const normalized = String(raw || "").toLowerCase()
    if (normalized === "open") return "open"
    if (normalized === "connecting" || normalized === "syncing") return "connecting"
    return "close"
  }

  private extractQr(data: any): string | null {
    const candidates = [
      data?.base64,
      data?.qrcode?.base64,
      data?.qr?.base64,
      data?.qrcode,
      data?.qr,
    ]

    for (const candidate of candidates) {
      if (typeof candidate !== "string" || !candidate.trim()) continue
      const value = candidate.trim()
      if (value.startsWith("data:image/")) return value
      if (value.startsWith("http://") || value.startsWith("https://")) return value
      if (/^[A-Za-z0-9+/=\n\r]+$/.test(value) && value.length >= 64) {
        const cleaned = value.replace(/[\n\r]/g, "")
        return `data:image/png;base64,${cleaned}`
      }
    }

    return null
  }

  private extractPairingCode(data: any): string | null {
    const candidates = [data?.pairingCode, data?.pairing_code, data?.code]
    for (const candidate of candidates) {
      if (typeof candidate !== "string" || !candidate.trim()) continue
      const value = candidate.trim()
      if (/^[A-Z0-9-]{6,16}$/i.test(value)) return value.toUpperCase()
    }
    return null
  }

  private isAlreadyExistsError(error: unknown): boolean {
    if (!(error instanceof EvolutionHttpError)) return false
    if (![400, 403, 409].includes(error.status)) return false
    const text = JSON.stringify(error.payload || error.message).toLowerCase()
    return (
      text.includes("already") ||
      text.includes("in use") ||
      text.includes("exists") ||
      text.includes("name")
    )
  }

  private async api(method: string, path: string, body?: unknown): Promise<any> {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 15000)
    try {
      const res = await fetch(`${config.baseUrl}${path}`, {
        method,
        headers: {
          "Content-Type": "application/json",
          apikey: config.apiKey,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      })
      if (!res.ok) {
        const text = await res.text().catch(() => "")
        let payload: unknown = text
        try {
          payload = text ? JSON.parse(text) : null
        } catch {
          payload = text
        }
        throw new EvolutionHttpError(
          res.status,
          `Evolution API HTTP ${res.status}: ${text.slice(0, 300)}`,
          payload,
        )
      }
      const text = await res.text().catch(() => "")
      if (!text) return {}
      try {
        return JSON.parse(text)
      } catch {
        return { raw: text }
      }
    } finally {
      clearTimeout(timer)
    }
  }

  async getOrCreateInstance(name: string): Promise<void> {
    if (this.instances.has(name)) return

    try {
      await this.api("POST", "/instance/create", {
        instanceName: name,
        integration: "WHATSAPP-BAILEYS",
      })
    } catch (err) {
      if (!this.isAlreadyExistsError(err)) throw err
    }

    this.instances.set(name, { state: "close" })
  }

  async getState(name: string): Promise<{ state: string; qr?: string | null }> {
    try {
      const data = await this.api("GET", `/instance/connectionState/${encodeURIComponent(name)}`)
      const raw = data?.instance?.state as string | undefined
      const mappedState = this.mapState(raw)
      this.instances.set(name, { state: mappedState })
      return { state: mappedState, qr: null }
    } catch {
      const inst = this.instances.get(name)
      if (inst) return { state: inst.state, qr: null }
      return { state: "unknown" }
    }
  }

  async connect(
    name: string,
    phoneNumber?: string,
  ): Promise<{ base64?: string; code?: string; state: string }> {
    await this.getOrCreateInstance(name)

    const inst = this.instances.get(name)
    if (!inst) return { state: "close" }

    if (phoneNumber) {
      const data = await this.api(
        "GET",
        `/instance/connect/${encodeURIComponent(name)}?number=${encodeURIComponent(phoneNumber)}`,
      )
      const pairingCode = this.extractPairingCode(data)
      if (!pairingCode) {
        throw new Error("Evolution API returned no pairing code")
      }
      inst.state = "connecting"
      return { code: pairingCode, state: "connecting" }
    }

    const delays = [1000, 2000]
    for (let i = 0; i < 3; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, delays[i - 1]))

      try {
        const data = await this.api(
          "GET",
          `/instance/connect/${encodeURIComponent(name)}`,
        )

        const qr = this.extractQr(data)
        if (qr) {
          inst.state = "connecting"
          return { base64: qr, state: "connecting" }
        }

        const pairingCode = this.extractPairingCode(data)
        if (pairingCode) {
          inst.state = "connecting"
          return { code: pairingCode, state: "connecting" }
        }

        const rawState = data?.instance?.state as string | undefined
        const mappedState = this.mapState(rawState)
        inst.state = mappedState
        if (mappedState === "open") {
          return { state: "open" }
        }
      } catch {
        // retry
      }
    }

    return { state: inst.state || "close" }
  }

  async logout(name: string): Promise<void> {
    try {
      await this.api("DELETE", `/instance/delete/${encodeURIComponent(name)}`)
    } catch {}
    this.instances.delete(name)
  }

  async sendMessage(name: string, number: string, text: string, delay?: number): Promise<void> {
    await this.api("POST", `/message/sendText/${encodeURIComponent(name)}`, {
      number,
      text,
      delay: delay ?? 1200,
    })
  }

  async validateNumbers(
    name: string,
    numbers: string[],
  ): Promise<Array<{ number: string; exists: boolean; jid?: string }>> {
    try {
      return await this.api("POST", `/chat/whatsappNumbers/${encodeURIComponent(name)}`, {
        numbers,
      })
    } catch {
      return []
    }
  }
}

function getManager(): WhatsAppManager {
  if (!globalForWhatsApp.__whatsAppManager) {
    globalForWhatsApp.__whatsAppManager = new WhatsAppManager()
  }
  return globalForWhatsApp.__whatsAppManager
}

export const whatsAppManager = getManager()
