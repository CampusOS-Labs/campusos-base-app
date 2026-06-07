"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { QrCode, Key, LogOut } from "lucide-react"

type ConnectionState = "open" | "connecting" | "close" | "unknown"

type Props = {
  connectionState: ConnectionState
  qrCode: string | null
  pairingCode: string | null
  pairingPhone: string
  connectMode: "qr" | "code"
  isRunning: boolean
  onLogout: () => Promise<void>
  onConnect: () => Promise<void>
  onGetPairingCode: () => Promise<void>
  onPairingPhoneChange: (phone: string) => void
  onConnectModeChange: (mode: "qr" | "code") => void
}

export function WhatsAppPanel({
  connectionState,
  qrCode,
  pairingCode,
  pairingPhone,
  connectMode,
  isRunning,
  onLogout,
  onConnect,
  onGetPairingCode,
  onPairingPhoneChange,
  onConnectModeChange,
}: Props) {
  const isConnected = connectionState === "open"

  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">WhatsApp Connected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} disabled={isRunning}>
          <LogOut /> Disconnect
        </Button>
      </div>
    )
  }

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-3">
      <div className="flex items-center gap-2">
        <span className={`size-2 rounded-full ${connectionState === "connecting" ? "bg-yellow-500" : "bg-gray-300"}`} />
        <span className="text-sm font-medium">
          {connectionState === "connecting" ? "Connecting..." : "WhatsApp Disconnected"}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          variant={connectMode === "qr" ? "default" : "outline"}
          size="sm"
          onClick={() => onConnectModeChange("qr")}
        >
          <QrCode /> QR Code
        </Button>
        <Button
          variant={connectMode === "code" ? "default" : "outline"}
          size="sm"
          onClick={() => onConnectModeChange("code")}
        >
          <Key /> Pairing Code
        </Button>
      </div>

      {connectMode === "qr" ? (
        <Button onClick={onConnect} disabled={isRunning} size="sm">
          <QrCode /> Get QR Code
        </Button>
      ) : (
        <div className="flex gap-2">
          <Input
            placeholder="Phone (e.g. 919876543210)"
            value={pairingPhone}
            onChange={(e) => onPairingPhoneChange(e.target.value)}
            className="max-w-xs h-8"
          />
          <Button onClick={onGetPairingCode} disabled={isRunning} size="sm">
            <Key /> Get Code
          </Button>
        </div>
      )}

      {qrCode && (
        <div className="flex flex-col items-center gap-1">
          <img src={qrCode} className="w-36 h-36 border rounded-md" alt="QR Code" />
          <p className="text-xs text-muted-foreground">Scan with WhatsApp → Linked Devices</p>
        </div>
      )}

      {pairingCode && (
        <div className="flex flex-col items-center gap-1">
          <span className="text-xl font-mono font-bold tracking-widest bg-background px-5 py-2 rounded-md select-all">
            {pairingCode}
          </span>
          <p className="text-xs text-muted-foreground">
            Open WhatsApp → Linked Devices → &ldquo;Pair with code instead&rdquo;
          </p>
        </div>
      )}
    </div>
  )
}
