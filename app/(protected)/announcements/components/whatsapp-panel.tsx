"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { QrCodeIcon, SignOutIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type ConnectionState = "open" | "connecting" | "close" | "unknown";

type Props = {
  connectionState: ConnectionState;
  qrCode: string | null;
  pairingPhone: string;
  pairingCode: string | null;
  isOtpSubmitting: boolean;
  isRunning: boolean;
  onLogout: () => Promise<void>;
  onConnect: () => Promise<void>;
  onPairingPhoneChange: (value: string) => void;
  onConnectWithOtp: () => Promise<void>;
};

export function WhatsAppPanel({
  connectionState,
  qrCode,
  pairingPhone,
  pairingCode,
  isOtpSubmitting,
  isRunning,
  onLogout,
  onConnect,
  onPairingPhoneChange,
  onConnectWithOtp,
}: Props) {
  const [connectMethod, setConnectMethod] = useState<"qr" | "otp">("otp");
  const isConnected = connectionState === "open";
  const isConnecting = connectionState === "connecting";
  const formattedPairingCode = pairingCode
    ? pairingCode.length >= 8
      ? `${pairingCode.slice(0, 4)}-${pairingCode.slice(4)}`
      : pairingCode
    : null;

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
      </div>

      <div className="space-y-3 rounded-xl border border-border/70 bg-muted/20 p-3">
        <p className="text-xs font-medium text-foreground">Choose sign-in method</p>
        <div className="grid grid-cols-2 gap-2">
          <Button
            type="button"
            variant={connectMethod === "otp" ? "default" : "outline"}
            size="sm"
            onClick={() => setConnectMethod("otp")}
            disabled={isRunning || isOtpSubmitting}
          >
            OTP code
          </Button>
          <Button
            type="button"
            variant={connectMethod === "qr" ? "default" : "outline"}
            size="sm"
            onClick={() => setConnectMethod("qr")}
            disabled={isRunning || isOtpSubmitting}
          >
            QR code
          </Button>
        </div>

        {connectMethod === "otp" ? (
          <div className="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Step 1:</span> Enter number with
              country code (no spaces)
            </p>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={pairingPhone}
                onChange={(event) => onPairingPhoneChange(event.target.value)}
                inputMode="tel"
                placeholder="Enter number with country code (e.g. 919876543210)"
                disabled={isRunning || isOtpSubmitting}
              />
              <Button
                type="button"
                variant="outline"
                onClick={onConnectWithOtp}
                disabled={isRunning || isOtpSubmitting || isConnecting}
              >
                {isOtpSubmitting ? "Requesting…" : "Get OTP code"}
              </Button>
            </div>
            {formattedPairingCode ? (
              <div className="rounded-md border border-dashed border-border bg-muted/30 px-3 py-2">
                <p className="text-[11px] text-muted-foreground">
                  <span className="font-medium text-foreground">Step 2:</span> Enter this code in
                  WhatsApp
                </p>
                <p className="text-base font-semibold tracking-widest">{formattedPairingCode}</p>
              </div>
            ) : null}
            <p className="text-[11px] text-muted-foreground">
              Open WhatsApp on your phone → Linked devices → Link with phone number.
            </p>
          </div>
        ) : (
          <div className="space-y-2 rounded-lg border border-border/70 bg-background/80 p-3">
            <p className="text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Step 1:</span> Click{" "}
              <span className="font-medium text-foreground">Connect WhatsApp</span>.
            </p>
            <Button onClick={onConnect} disabled={isRunning || isConnecting} size="sm">
              <QrCodeIcon />
              {isConnecting ? "Connecting…" : "Connect WhatsApp"}
            </Button>
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">Step 2:</span> In WhatsApp: Linked
              devices → Link a device → scan the QR.
            </p>
          </div>
        )}
      </div>

      {qrCode && connectMethod === "qr" ? (
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
