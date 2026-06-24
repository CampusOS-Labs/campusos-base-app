"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { NotePencilIcon } from "@phosphor-icons/react";

import { PageHeader, PageShell } from "@/components/page-layout";
import { AudiencePicker } from "./components/audience-picker";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { WizardStep, WizardStepBadge } from "@/components/wizard-step";
import { logAnnouncement } from "@/lib/actions/announcements";
import { trackAuthEvent } from "@/lib/analytics/track-event-client";
import {
  ANNOUNCEMENT_FLOW_STEP,
  ANNOUNCEMENT_SEND_FAILED,
  ANNOUNCEMENT_SENT,
  PAGE_VIEW,
  PRODUCT_PAGES,
  WHATSAPP_STATE,
} from "@/lib/services/product-analytics-events";
import type { Invoice as ServiceInvoice } from "@/lib/services/invoices";
import { ComposeDialog } from "./components/compose-dialog";
import type { SelectedFile } from "./components/compose-form";
import { MessageTypePicker } from "./components/message-type-picker";
import { WhatsAppPanel } from "./components/whatsapp-panel";

type Invoice = ServiceInvoice;

type Recipient = {
  phone: string;
  parentName: string;
  invoices: Array<{
    invoiceNumber: string;
    studentName: string;
    totalAmount: number;
    status: string;
  }>;
};

type AudienceGroup = {
  id: string;
  label: string;
  help: string;
  recipients: Recipient[];
};

type ConnectionState = "open" | "connecting" | "close" | "unknown";

type UserGroup = {
  id: string;
  name: string;
  description: string | null;
  contactCount: number;
};

type AnnouncementsClientProps = {
  initialInvoices: Invoice[];
  initialUserGroups: UserGroup[];
};

const INSTANCE_NAME = "primary";

function trackEvent(
  event: string,
  properties?: Record<string, unknown>,
  durationMs?: number,
) {
  trackAuthEvent(event, properties, durationMs);
}

function normalizePhone(value: string): string {
  return String(value || "").replace(/[^\d]/g, "");
}

function toQrSrc(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("data:image/")) return trimmed;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (/^[A-Za-z0-9+/=\n\r]+$/.test(trimmed) && trimmed.length >= 64) {
    return `data:image/png;base64,${trimmed.replace(/[\n\r]/g, "")}`;
  }
  return null;
}

function parseConnectPayload(data: any): {
  qr: string | null;
  pairingCode: string | null;
  state: string;
} {
  const qr = toQrSrc(data?.qr ?? data?.base64 ?? data?.qrcode?.base64 ?? data?.qrcode);
  const pairingCode = String(
    data?.pairingCode ?? data?.qrcode?.pairingCode ?? data?.qr?.pairingCode ?? "",
  ).trim();
  const state = String(data?.instance?.state || data?.state || "").toLowerCase();
  return { qr, pairingCode: pairingCode || null, state };
}

function paymentLinkForInvoice(invoiceId: string): string {
  const origin = process.env.NEXT_PUBLIC_APP_URL || window.location.origin;
  return `${origin}/pay/${invoiceId}`;
}

function isPaymentReminder(type: string): boolean {
  return type === "payment-reminder";
}

function randomDelay(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function normalizePairingPhoneInput(value: string): {
  normalized: string;
  error?: string;
} {
  const raw = String(value || "").trim();
  if (!raw) {
    return { normalized: "", error: "Enter a valid WhatsApp number with country code." };
  }

  const sanitized = raw.replace(/[^\d+]/g, "");
  if (!sanitized) {
    return { normalized: "", error: "Enter a valid WhatsApp number with country code." };
  }

  let candidate = sanitized;
  if (candidate.startsWith("+")) candidate = candidate.slice(1);
  if (candidate.startsWith("00")) candidate = candidate.slice(2);

  const digits = candidate.replace(/[^\d]/g, "");
  if (!digits) {
    return { normalized: "", error: "Enter a valid WhatsApp number with country code." };
  }

  if (digits.startsWith("0")) {
    return {
      normalized: "",
      error:
        "Number must start with country code. Example: 91XXXXXXXXXX or 1XXXXXXXXXX.",
    };
  }

  if (digits.length < 11 || digits.length > 15) {
    return {
      normalized: "",
      error:
        "Use full international format (country code + number), 11 to 15 digits.",
    };
  }

  return { normalized: digits };
}

async function api(method: string, path: string, body?: unknown, timeoutMs = 15000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(path, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    }
    return res.json();
  } finally {
    clearTimeout(timer);
  }
}

function isInvalidConnectionError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error || "");
  return message.toLowerCase().includes("invalid connection");
}

const TYPE_LABELS: Record<string, string> = {
  announcement: "Announcement",
  activities: "Announcement",
  "payment-reminder": "Payment Reminder",
  media: "Media",
};

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
  );
}

function AnnouncementsLoading() {
  return (
    <PageShell className="space-y-6">
      <PageHeader title="New announcement" description="Send a WhatsApp message to parents." />
      <div className="space-y-4">
        {[1, 2].map((step) => (
          <div
            key={step}
            className="h-28 animate-pulse rounded-xl border border-border/80 bg-muted/30"
          />
        ))}
      </div>
    </PageShell>
  );
}

function AnnouncementsClientInner({
  initialInvoices,
  initialUserGroups,
}: AnnouncementsClientProps) {
  const searchParams = useSearchParams();
  const invoiceParam = searchParams.get("invoice");
  const audienceParam = searchParams.get("audience");

  const [connectionState, setConnectionState] = useState<ConnectionState>("unknown");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingPhone, setPairingPhone] = useState("");
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isOtpSubmitting, setIsOtpSubmitting] = useState(false);
  const [audienceGroups, setAudienceGroups] = useState<AudienceGroup[]>([]);
  const [recipientsByAudience, setRecipientsByAudience] = useState<Map<string, Recipient[]>>(
    new Map(),
  );
  const [selectedAudience, setSelectedAudience] = useState("");
  const [groupRecipients, setGroupRecipients] = useState<Recipient[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [annType, setAnnType] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedFile>(null);
  const [statusSummary, setStatusSummary] = useState("Ready.");
  const [statusIsError, setStatusIsError] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeOpen, setComposeOpen] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);
  const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollAttemptsRef = useRef(0);
  const connectFlowActiveRef = useRef(false);
  const parentsMapRef = useRef<Map<string, Recipient>>(new Map());
  const flowStartTimeRef = useRef(Date.now());
  const whatsappOpenTrackedRef = useRef(false);
  const pendingSendRef = useRef<{ recipients: Recipient[]; title: string } | null>(null);

  function setStatus(msg: string, isError = false) {
    setStatusSummary(msg);
    setStatusIsError(isError);
  }

  function applyConnectionState(state: string) {
    const normalized = String(state || "").toLowerCase();
    if (normalized === "open") {
      setConnectionState("open");
      setQrCode(null);
      setPairingCode(null);
      setStatus("WhatsApp connected.");
      if (!whatsappOpenTrackedRef.current) {
        whatsappOpenTrackedRef.current = true;
        trackEvent(WHATSAPP_STATE, { state: "open" });
      }
    } else if (normalized === "connecting") {
      setConnectionState("connecting");
      setStatus("Connecting to WhatsApp...");
    } else if (normalized === "unknown") {
      setConnectionState("unknown");
      setStatus("Unable to confirm connection. Retrying...");
    } else {
      setConnectionState("close");
      setPairingCode(null);
      setStatus("WhatsApp disconnected.");
    }
  }

  async function checkInitialState() {
    await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {});
    try {
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`);
      const state = String(data?.instance?.state || data?.state || "close").toLowerCase();
      if (state === "open") {
        applyConnectionState("open");
        return;
      }
      setConnectionState("close");
      setQrCode(null);
      setPairingCode(null);
      setStatus("WhatsApp disconnected.");
    } catch {
      setConnectionState("close");
      setQrCode(null);
      setPairingCode(null);
      setStatus("WhatsApp disconnected.");
    }
  }

  function stopPolling() {
    connectFlowActiveRef.current = false;
    if (pollRef.current) {
      clearTimeout(pollRef.current);
      pollRef.current = null;
    }
  }

  function startPolling() {
    connectFlowActiveRef.current = true;
    pollAttemptsRef.current = 0;
    if (pollRef.current) clearTimeout(pollRef.current);
    pollRef.current = setTimeout(() => pollConnectionState(), 3000);
  }

  async function pollConnectionState() {
    if (!connectFlowActiveRef.current) return;

    pollAttemptsRef.current += 1;
    // Keep polling longer because WhatsApp pairing can take >60s after scan.
    if (pollAttemptsRef.current > 60) {
      try {
        const finalData = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`);
        const finalState = String(finalData?.instance?.state || finalData?.state || "unknown")
          .toLowerCase();
        if (finalState === "open") {
          stopPolling();
          applyConnectionState("open");
          return;
        }
      } catch {
        // Fall through to timeout handling.
      }
      stopPolling();
      setQrCode(null);
      setPairingCode(null);
      setConnectionState("close");
      setStatus("Connection expired. Try again.", true);
      return;
    }
    try {
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`);
      const state = String(data?.instance?.state || data?.state || "unknown").toLowerCase();
      if (state === "open") {
        stopPolling();
        applyConnectionState("open");
        return;
      }
      if (state === "close") {
        // "close" can be transient right after scan; don't expire early.
        pollRef.current = setTimeout(pollConnectionState, 3000);
        return;
      }
      pollRef.current = setTimeout(pollConnectionState, state === "unknown" ? 3000 : 2000);
    } catch {
      pollRef.current = setTimeout(pollConnectionState, 3000);
    }
  }

  async function onConnect() {
    try {
      setIsRunning(true);
      stopPolling();
      setPairingCode(null);
      await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {});
      const stateData = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/state`);
      const state = stateData?.instance?.state || stateData?.state || "";
      if (state === "open") {
        applyConnectionState("open");
        return;
      }
      const data = await api("GET", `/api/whatsapp/instance/${INSTANCE_NAME}/connect`);
      const connectPayload = parseConnectPayload(data);
      if (connectPayload.pairingCode) {
        setPairingCode(connectPayload.pairingCode);
      }
      if (connectPayload.qr) {
        setQrCode(connectPayload.qr);
        setConnectionState("connecting");
        setStatus("Scan the QR code with WhatsApp → Linked Devices.");
        startPolling();
        return;
      }
      if (connectPayload.state === "open") {
        applyConnectionState("open");
        return;
      }
      if (connectPayload.state === "connecting" || connectPayload.state === "syncing") {
        setConnectionState("connecting");
        setStatus("Connecting to WhatsApp...");
        startPolling();
        return;
      }
      setStatus("Could not start WhatsApp connection. Try again.", true);
    } catch {
      setStatus("Failed to start WhatsApp connection. Try again.", true);
    } finally {
      setIsRunning(false);
    }
  }

  async function onConnectWithOtp() {
    const { normalized, error } = normalizePairingPhoneInput(pairingPhone);
    if (error) {
      setStatus(error, true);
      return;
    }

    try {
      setIsOtpSubmitting(true);
      stopPolling();
      setQrCode(null);
      setPairingCode(null);
      // Ensure each OTP request starts from a clean Evolution pairing state.
      await api("DELETE", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {});
      await api("POST", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME }).catch(() => {});
      const data = await api("POST", `/api/whatsapp/instance/${INSTANCE_NAME}/connect`, {
        number: normalized,
      });
      const connectPayload = parseConnectPayload(data);

      if (connectPayload.pairingCode) {
        setPairingCode(connectPayload.pairingCode);
        setConnectionState("connecting");
        setStatus("Enter the OTP code in WhatsApp on your phone to finish linking.");
        startPolling();
        return;
      }

      if (connectPayload.state === "open") {
        applyConnectionState("open");
        return;
      }

      if (connectPayload.state === "connecting" || connectPayload.state === "syncing") {
        setConnectionState("connecting");
        setStatus("Waiting for OTP verification on your phone...");
        startPolling();
        return;
      }

      setStatus("Could not generate an OTP code. Try again.", true);
    } catch {
      setStatus("Failed to generate OTP code. Try again.", true);
    } finally {
      setIsOtpSubmitting(false);
    }
  }

  async function onLogout() {
    try {
      setIsRunning(true);
      stopPolling();
      await api("DELETE", "/api/whatsapp/instance", { instanceName: INSTANCE_NAME });
      setConnectionState("close");
      setQrCode(null);
      setPairingCode(null);
      setStatus("WhatsApp disconnected.");
    } catch {
      // silently fail
    } finally {
      setIsRunning(false);
    }
  }

  async function loadAudienceGroups() {
    try {
      const groups: AudienceGroup[] = [];
      const map = new Map<string, Recipient[]>();

      const invoices = initialInvoices;
      const userGroups = initialUserGroups;

      const parentsMap = new Map<string, Recipient>();
      for (const invoice of invoices) {
        const phone = normalizePhone(invoice?.parent?.phone);
        if (!phone) continue;
        if (!parentsMap.has(phone)) {
          parentsMap.set(phone, {
            phone,
            parentName: invoice?.parent?.name || "Parent",
            invoices: [],
          });
        }
        parentsMap.get(phone)!.invoices.push({
          invoiceNumber: invoice.invoiceNumber,
          studentName: invoice?.student?.name || "Student",
          totalAmount: Number(invoice.totalAmount || 0),
          status:
            String(invoice.status || "pending").toLowerCase() === "paid" ? "paid" : "pending",
        });
      }
      parentsMapRef.current = parentsMap;

      const { getGroupWithContacts } = await import("@/lib/actions/groups");
      const groupContactsData = await Promise.all(
        userGroups
          .filter((group) => group.contactCount > 0)
          .map((group) =>
            getGroupWithContacts(group.id).then((data) => ({ group, data })),
          ),
      );

      const allParentsMap = new Map<string, Recipient>();
      for (const { group, data: groupData } of groupContactsData) {
        const recipients: Recipient[] = groupData.contacts.flatMap((contact) => {
          const entries = [
            { name: contact.fatherName, phone: contact.fatherPhoneNumber },
            { name: contact.motherName, phone: contact.motherPhoneNumber },
          ];
          return entries
            .map((entry) => {
              const phone = normalizePhone(entry.phone || "");
              if (!phone) return null;
              const fromInvoice = parentsMap.get(phone);
              return {
                phone,
                parentName: entry.name || contact.name,
                invoices: fromInvoice?.invoices ?? [],
              };
            })
            .filter((recipient): recipient is Recipient => recipient !== null);
        });
        for (const recipient of recipients) {
          const key = normalizePhone(recipient.phone);
          if (!allParentsMap.has(key)) allParentsMap.set(key, recipient);
        }
        const groupId = `group-${group.id}`;
        groups.push({
          id: groupId,
          label: `${group.name} (${recipients.length})`,
          help: group.description || group.name,
          recipients,
        });
        map.set(groupId, recipients);
      }

      const allParents = (
        allParentsMap.size > 0
          ? Array.from(allParentsMap.values())
          : Array.from(parentsMap.values())
      ).sort((a, b) => a.parentName.localeCompare(b.parentName));

      groups.unshift({
        id: "all-parents",
        label: `All Parents (${allParents.length})`,
        help: "Everyone in your contact groups",
        recipients: allParents,
      });
      map.set("all-parents", allParents);

      setAudienceGroups(groups);
      setRecipientsByAudience(map);

      if (groups.length > 0) {
        const firstId = groups.find((group) => group.id === "all-parents")?.id ?? groups[0].id;
        setSelectedAudience(firstId);
        setGroupRecipients(map.get(firstId) || []);
      }
    } catch {
      setStatus("Could not load contact groups.", true);
    }
  }

  function handleAudienceChange(id: string) {
    setSelectedAudience(id);
    setGroupRecipients(recipientsByAudience.get(id) || []);
    trackEvent(ANNOUNCEMENT_FLOW_STEP, {
      step: "recipient_selected",
      audience: id,
    });
  }

  function handleTypeChange(type: string) {
    setAnnType(type);
    if (type !== "media") setSelectedFile(null);
  }

  async function onSend() {
    if (connectionState !== "open") {
      setStatus("WhatsApp is not connected. Connect first.", true);
      return;
    }

    const isMedia = annType === "media";
    const titleTrimmed = title.trim();
    const messageTrimmed = message.trim();
    if (!annType) {
      setStatus("Choose a message type.", true);
      return;
    }
    if (!titleTrimmed || (!messageTrimmed && !isMedia)) {
      setStatus("Title and message are required.", true);
      return;
    }
    if (isMedia && !selectedFile) {
      setStatus("Please select a file to attach.", true);
      return;
    }

    const recipients = groupRecipients;
    if (recipients.length === 0) {
      setStatus("Choose an audience with at least one contact.", true);
      return;
    }

    pendingSendRef.current = { recipients, title: titleTrimmed };
    trackEvent(ANNOUNCEMENT_FLOW_STEP, { step: "send_confirmed" });
    setShowSendConfirm(true);
  }

  async function executeSend() {
    if (!pendingSendRef.current) {
      setShowSendConfirm(false);
      return;
    }

    trackEvent(ANNOUNCEMENT_FLOW_STEP, { step: "send_started" });

    const { recipients: allRecipients, title: titleTrimmed } = pendingSendRef.current;
    setShowSendConfirm(false);
    pendingSendRef.current = null;

    const isMedia = annType === "media";
    const typeLabel = TYPE_LABELS[annType];
    const messageTrimmed = message.trim();
    setSending(true);
    setStatus("Sending announcement...");

    try {
      let validPhoneSet = new Set(allRecipients.map((recipient) => normalizePhone(recipient.phone)));
      try {
        const validation = await api(
          "POST",
          `/api/whatsapp/instance/${INSTANCE_NAME}/validate`,
          {
            numbers: allRecipients.map((recipient) => recipient.phone),
          },
          30000,
        );
        validPhoneSet = new Set(
          validation
            .filter((item: { exists: boolean }) => item.exists)
            .map((item: { number: string }) => normalizePhone(item.number)),
        );
      } catch {
        // keep original set
      }

      const recipientsToSend = allRecipients.filter((recipient) =>
        validPhoneSet.has(normalizePhone(recipient.phone)),
      );
      if (recipientsToSend.length === 0) {
        trackEvent(ANNOUNCEMENT_SEND_FAILED, { reason: "no_valid_numbers" });
        setStatus("No valid WhatsApp numbers found.", true);
        setSending(false);
        return;
      }

      const results: Array<{ phone: string; ok: boolean; error?: string }> = [];
      let invalidConnectionDetected = false;
      for (let index = 0; index < recipientsToSend.length; index++) {
        const recipient = recipientsToSend[index];
        setStatus(`Sending ${index + 1} of ${recipientsToSend.length}...`);

        if (isMedia && selectedFile) {
          const caption = [`${typeLabel}: ${titleTrimmed}`, "", messageTrimmed].join("\n").trim();
          // Video uploads through Evolution can appear "sent" but fail to arrive.
          // Sending video as a document attachment is more reliable for delivery.
          const transportMediaType =
            selectedFile.mediatype === "video" ? "document" : selectedFile.mediatype;
          try {
            await api(
              "POST",
              `/api/whatsapp/instance/${INSTANCE_NAME}/send-media`,
              {
                number: recipient.phone,
                mediatype: transportMediaType,
                media: selectedFile.base64,
                caption,
                fileName: selectedFile.name,
                delay: 1200,
              },
              90000,
            );
            results.push({ phone: recipient.phone, ok: true });
          } catch (error) {
            if (isInvalidConnectionError(error)) {
              invalidConnectionDetected = true;
              setConnectionState("close");
              setQrCode(null);
              setStatus("WhatsApp session is invalid. Reconnect and try again.", true);
              break;
            }
            const reason = error instanceof Error ? error.message : "Failed to send media";
            results.push({ phone: recipient.phone, ok: false, error: reason });
          }
        } else {
          const textLines = [`${typeLabel}: ${titleTrimmed}`, "", messageTrimmed];
          if (isPaymentReminder(annType) && recipient.invoices.length > 0) {
            textLines.push("", "Pending payment link(s):");
            for (const invoice of recipient.invoices) {
              textLines.push(
                `- ${invoice.studentName} (${invoice.invoiceNumber}) ${paymentLinkForInvoice(invoice.invoiceNumber)}`,
              );
            }
          }
          const text = textLines.join("\n");
          try {
            await api(
              "POST",
              `/api/whatsapp/instance/${INSTANCE_NAME}/send`,
              {
                number: recipient.phone,
                text,
                delay: 1200,
              },
              30000,
            );
            results.push({ phone: recipient.phone, ok: true });
          } catch (error) {
            if (isInvalidConnectionError(error)) {
              invalidConnectionDetected = true;
              setConnectionState("close");
              setQrCode(null);
              setStatus("WhatsApp session is invalid. Reconnect and try again.", true);
              break;
            }
            const reason = error instanceof Error ? error.message : "Failed to send message";
            results.push({ phone: recipient.phone, ok: false, error: reason });
          }
        }

        if (invalidConnectionDetected) {
          break;
        }

        if (index < recipientsToSend.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, randomDelay(4000, 9000)));
        }
      }

      if (invalidConnectionDetected) {
        setSending(false);
        return;
      }

      const sentCount = results.filter((result) => result.ok).length;
      const failedCount = results.length - sentCount;
      const durationMs = Date.now() - flowStartTimeRef.current;

      logAnnouncement({
        title: titleTrimmed,
        message: messageTrimmed || null,
        type: annType,
        recipientCount: sentCount,
        groupId: selectedAudience.startsWith("group-") ? selectedAudience.slice(6) : null,
        audienceLabel: audienceGroups.find((group) => group.id === selectedAudience)?.label || null,
      }).catch(() => {});

      if (sentCount > 0) {
        trackEvent(
          ANNOUNCEMENT_SENT,
          {
            recipientCount: sentCount,
            failedCount,
            type: annType,
            audience: selectedAudience,
          },
          durationMs,
        );
      } else {
        trackEvent(ANNOUNCEMENT_SEND_FAILED, {
          reason: "all_recipients_failed",
          recipientCount: allRecipients.length,
        });
      }

      setTitle("");
      setMessage("");
      setAnnType("");
      setSelectedFile(null);
      setComposeOpen(false);

      if (failedCount > 0) {
        const firstFailure = results.find((result) => !result.ok)?.error;
        const details = firstFailure ? ` First error: ${firstFailure}` : "";
        setStatus(`Sent to ${sentCount} contact(s). ${failedCount} failed.${details}`, true);
      } else {
        setStatus(`Sent to ${sentCount} contact(s).`);
      }
    } catch {
      trackEvent(ANNOUNCEMENT_SEND_FAILED, { reason: "unexpected_error" });
      setStatus("Something went wrong while sending.", true);
    } finally {
      setSending(false);
    }
  }

  useEffect(() => {
    flowStartTimeRef.current = Date.now();
    trackEvent(PAGE_VIEW, { page: PRODUCT_PAGES.announcementsCompose });
    checkInitialState();
    loadAudienceGroups();
    return () => {
      stopPolling();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (invoiceParam && !message.trim()) {
      setMessage(
        `Please complete your pending fee payment using your secure link:\n${paymentLinkForInvoice(invoiceParam)}`,
      );
      setAnnType("payment-reminder");
      setComposeOpen(true);
    }
  }, [invoiceParam, message, recipientsByAudience]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (audienceParam && recipientsByAudience.has(audienceParam)) {
      handleAudienceChange(audienceParam);
    }
  }, [audienceParam, recipientsByAudience]); // eslint-disable-line react-hooks/exhaustive-deps

  const isWhatsAppReady = connectionState === "open";
  const isMedia = annType === "media";
  const recipientCount = groupRecipients.length;
  const selectedAudienceGroup = audienceGroups.find((group) => group.id === selectedAudience);

  const canOpenCompose =
    isWhatsAppReady && selectedAudience.length > 0 && recipientCount > 0 && annType.length > 0;

  return (
    <PageShell className="space-y-6">
      <PageHeader
        title="New announcement"
        description="Connect WhatsApp, pick who to reach, then write your message."
      />

      {statusIsError ? (
        <StatusBanner variant="error">{statusSummary}</StatusBanner>
      ) : statusSummary && statusSummary !== "Ready." && !sending ? (
        <p className="text-sm text-muted-foreground">{statusSummary}</p>
      ) : null}

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
            pairingPhone={pairingPhone}
            pairingCode={pairingCode}
            isOtpSubmitting={isOtpSubmitting}
            isRunning={isRunning}
            onLogout={onLogout}
            onConnect={onConnect}
            onPairingPhoneChange={setPairingPhone}
            onConnectWithOtp={onConnectWithOtp}
          />
        </WizardStep>

        <WizardStep
          step={2}
          title="Send announcement"
          description="Two choices, then write your message in the dialog."
          disabled={!isWhatsAppReady}
          badge={
            recipientCount > 0 ? (
              <WizardStepBadge>{recipientCount} recipients</WizardStepBadge>
            ) : null
          }
        >
          <div className="space-y-5">
            <AudiencePicker
              options={audienceGroups.map((group) => ({
                value: group.id,
                label: group.label,
                description: group.help,
              }))}
              value={selectedAudience}
              onValueChange={handleAudienceChange}
              disabled={!isWhatsAppReady || audienceGroups.length === 0}
            />

            <MessageTypePicker
              value={annType}
              onValueChange={handleTypeChange}
              disabled={!isWhatsAppReady}
            />

            <Button
              className="w-full sm:w-auto"
              size="lg"
              disabled={!canOpenCompose}
              onClick={() => setComposeOpen(true)}
            >
              <NotePencilIcon weight="fill" />
              Write message…
            </Button>
          </div>
        </WizardStep>
      </div>

      <ComposeDialog
        open={composeOpen}
        onOpenChange={setComposeOpen}
        title={title}
        message={message}
        isMedia={isMedia}
        selectedFile={selectedFile}
        audienceLabel={selectedAudienceGroup?.label ?? "Selected audience"}
        recipientCount={recipientCount}
        sending={sending}
        onTitleChange={setTitle}
        onMessageChange={setMessage}
        onFileSelect={setSelectedFile}
        onSend={onSend}
      />

      <Dialog open={showSendConfirm} onOpenChange={setShowSendConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm send</DialogTitle>
            <DialogDescription>
              Send &ldquo;{title.trim()}&rdquo; to {groupRecipients.length} contact(s)?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSendConfirm(false)}>
              Cancel
            </Button>
            <Button onClick={executeSend}>Send</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageShell>
  );
}
