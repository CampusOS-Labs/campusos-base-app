"use client";

import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import { QrCode, LogOut } from "lucide-react";
import { chromatic, type SlotOptions } from "slot-text";
import { SlotText } from "slot-text/react";

type ConnectionState = "open" | "connecting" | "close" | "unknown";

type Props = {
  connectionState: ConnectionState;
  qrCode: string | null;
  isRunning: boolean;
  onLogout: () => Promise<void>;
  onConnect: () => Promise<void>;
};

export function WhatsAppPanel({
  connectionState,
  qrCode,
  isRunning,
  onLogout,
  onConnect,
}: Props) {
  const isConnected = connectionState === "open";
  const isConnecting = connectionState === "connecting";
  const buttonText = isConnecting ? "Connecting..." : "Get QR Code";
  const statusText = isConnecting ? "Connecting..." : "WhatsApp Disconnected";

  const buttonSlotOptions = useMemo<SlotOptions>(
    () => ({
      direction: isConnecting ? "up" : "down",
      skipUnchanged: false,
      color: isConnecting ? chromatic({ from: 24, spread: 140, saturation: 90, lightness: 58 }) : undefined,
    }),
    [isConnecting],
  );

  const statusSlotOptions = useMemo<SlotOptions>(
    () => ({
      direction: isConnecting ? "up" : "down",
      skipUnchanged: false,
      color: isConnecting ? chromatic({ from: 40, spread: 120, saturation: 88, lightness: 60 }) : undefined,
    }),
    [isConnecting],
  );

  if (isConnected) {
    return (
      <div className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-2.5">
      <div className="flex items-center justify-end gap-2">
          <span className="size-2 rounded-full bg-green-500" />
          <span className="text-sm font-medium">WhatsApp Connected</span>
        </div>
        <Button variant="ghost" size="sm" onClick={onLogout} disabled={isRunning}>
          <LogOut />
          <SlotText text="Disconnect" options={{ skipUnchanged: true }} />
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-muted/30 px-4 py-3 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Button onClick={onConnect} disabled={isRunning || isConnecting} size="sm">
          <QrCode />
          <SlotText text={buttonText} options={buttonSlotOptions} />
        </Button>
        <div className="flex items-center gap-2">
          <span
            className={`size-2 rounded-full ${connectionState === "connecting" ? "bg-yellow-500" : "bg-gray-300"}`}
          />
          <span className="text-sm font-medium">
            <SlotText text={statusText} options={statusSlotOptions} />
          </span>
        </div>
      </div>

      {qrCode && (
        <div className="flex flex-col items-center gap-1">
          <Image
            src={qrCode}
            className="w-36 h-36 border rounded-md"
            alt="QR Code"
            width={144}
            height={144}
            unoptimized
          />
          <p className="text-xs text-muted-foreground">Scan with WhatsApp → Linked Devices</p>
        </div>
      )}
    </div>
  );
}
