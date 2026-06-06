interface InstanceMeta {
  state: "open" | "connecting" | "close"
}

const globalForWhatsApp = globalThis as typeof globalThis & {
  __whatsAppManager?: WhatsAppManager
}

const config = {
  baseUrl: (process.env.EVOLUTION_API_URL || "http://localhost:8080").replace(/\/+$/, ""),
  apiKey: process.env.EVOLUTION_API_KEY || "",
}

export class WhatsAppManager {
  private instances = new Map<string, InstanceMeta>()

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
        throw new Error(`Evolution API HTTP ${res.status}: ${text.slice(0, 300)}`)
      }
      return res.json()
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
      const msg = err instanceof Error ? err.message : "Unknown"
      if (!msg.includes("400")) throw err
    }

    this.instances.set(name, { state: "close" })
  }

  getState(name: string): { state: string; qr?: string | null } {
    const inst = this.instances.get(name)
    if (!inst) return { state: "close" }

    this.api("GET", `/instance/connectionState/${encodeURIComponent(name)}`)
      .then((data) => {
        const raw = data?.instance?.state as string | undefined
        if (raw === "open") inst.state = "open"
        else if (raw === "connecting" || raw === "syncing") inst.state = "connecting"
        else inst.state = "close"
      })
      .catch(() => {})

    return { state: inst.state, qr: null }
  }

  async connect(name: string): Promise<{ base64?: string; state: string }> {
    await this.getOrCreateInstance(name)

    const inst = this.instances.get(name)
    if (!inst) return { state: "close" }

    for (let i = 0; i < 5; i++) {
      if (i > 0) await new Promise((r) => setTimeout(r, 3000))

      try {
        const data = await this.api(
          "GET",
          `/instance/connect/${encodeURIComponent(name)}`,
        )

        if (data?.base64) {
          inst.state = "connecting"
          return { base64: data.base64, state: "connecting" }
        }

        const rawState = data?.instance?.state as string | undefined
        if (rawState === "open") {
          inst.state = "open"
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
      await this.api("DELETE", `/instance/logout/${encodeURIComponent(name)}`)
    } catch {}
    this.instances.delete(name)
  }

  async sendMessage(name: string, number: string, text: string): Promise<void> {
    await this.api("POST", `/message/sendText/${encodeURIComponent(name)}`, {
      number,
      text,
      delay: 1200,
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
