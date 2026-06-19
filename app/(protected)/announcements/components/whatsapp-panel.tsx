"use client";

import { useMemo } from "react";
import Image from "next/image";
import { QrCodeIcon, SignOutIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

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

  const statusLabel = useMemo(() => {
    if (isConnected) return "Connected";
    if (isConnecting) return "Connecting";
    if (connectionState === "unknown") return "Checking…";
    return "Not connected";
  }, [connectionState, isConnected, isConnecting]);

  const statusDotClass = cn(
    "size-2 shrink-0 rounded-full",
    isConnected && "bg-status-connected",
    isConnecting && "bg-status-pending animate-pulse",
    !isConnected && !isConnecting && "bg-muted-foreground/35",
  );

  if (isConnected) {
    return (
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className={statusDotClass} aria-hidden />
          <div>
            <p className="text-sm font-medium">WhatsApp is ready</p>
            <p className="text-xs text-muted-foreground">You can compose and send messages.</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={onLogout} disabled={isRunning}>
          <SignOutIcon />
          Disconnect
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2.5">
          <span className={statusDotClass} aria-hidden />
          <div>
            <p className="text-sm font-medium">{statusLabel}</p>
            <p className="text-xs text-muted-foreground">
              Link WhatsApp before sending to parents.
            </p>
          </div>
        </div>
        <Button onClick={onConnect} disabled={isRunning || isConnecting} size="sm">
          <QrCodeIcon />
          {isConnecting ? "Connecting…" : "Connect WhatsApp"}
        </Button>
      </div>

      {qrCode ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/20 px-4 py-5">
          <Image
            src={qrCode}
            className="size-36 rounded-lg border bg-white p-2 shadow-xs"
            alt="WhatsApp QR code"
            width={144}
            height={144}
            unoptimized
          />
          <p className="max-w-xs text-center text-xs text-muted-foreground">
            Open WhatsApp on your phone → Linked devices → Link a device → scan this code
          </p>
        </div>
      ) : null}
    </div>
  );
}
