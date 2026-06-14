"use client";

import { useEffect, useState } from "react";
import Script from "next/script";

import { trackPublicEvent } from "@/lib/analytics/track-event-client";
import { formatCurrency, formatDateLong } from "@/lib/format";
import { ORG_PRIMARY_HEX } from "@/lib/constants";
import {
  PAGE_VIEW,
  PAYMENT_FAILED,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events";
import { PublicFlowShell } from "@/components/public-flow-shell";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, handler: (...args: unknown[]) => void): void;
    };
  }
}

export type PayInvoiceData = {
  invoiceNumber: string;
  totalAmount: number;
  dueDate: string;
  status: string;
  razorpayKeyId: string;
  student: { name: string; class: string };
  parent: { name: string; phone: string; email: string };
};

type PaymentState = "idle" | "loading" | "processing" | "success" | "failed";

type VerifyData = {
  invoiceId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  method: string;
  amountPaid: number;
  currency: string;
  paidAt: string;
};

type PayInvoiceClientProps = {
  invoiceId: string;
  invoice: PayInvoiceData;
};

export function PayInvoiceClient({ invoiceId, invoice: initialInvoice }: PayInvoiceClientProps) {
  const [invoice, setInvoice] = useState(initialInvoice);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMsg, setPaymentMsg] = useState("");
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);
  const [isRazorpayReady, setIsRazorpayReady] = useState(false);

  useEffect(() => {
    trackPublicEvent(PAGE_VIEW, {
      page: PRODUCT_PAGES.payInvoice,
      invoiceId,
    });
  }, [invoiceId]);

  const handlePay = async () => {
    setPaymentState("loading");
    setPaymentMsg("");

    try {
      if (!isRazorpayReady || !window.Razorpay) {
        throw new Error("Payment gateway is still loading. Please try again.");
      }

      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const orderJson = await orderRes.json();
      if (!orderJson.success) throw new Error(orderJson.error || "Failed to create order");
      const order = orderJson.data;

      const options = {
        key: invoice.razorpayKeyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: invoice.student.name,
        description: `Invoice ${invoice.invoiceNumber}`,
        order_id: order.orderId,
        prefill: {
          name: invoice.parent.name,
          email: order.prefillEmail,
          contact: order.prefillContact,
        },
        theme: { color: ORG_PRIMARY_HEX },
        handler: async (response: Record<string, string>) => {
          setPaymentState("processing");
          try {
            const verifyRes = await fetch("/api/payments/verify", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
                invoiceId,
              }),
            });
            const verifyJson = await verifyRes.json();
            if (!verifyJson.success) {
              throw new Error(
                verifyJson.error || "Verification failed. Payment may have been received.",
              );
            }
            setVerifyData(verifyJson.data);
            setInvoice((prev) => ({ ...prev, status: "paid" }));
          } catch (err) {
            setPaymentMsg(
              err instanceof Error
                ? err.message
                : "Verification failed. Payment may have been received.",
            );
            setPaymentState("failed");
          }
        },
        modal: {
          ondismiss: () => {
            trackPublicEvent(PAYMENT_FAILED, {
              invoiceId,
              reason: "modal_dismissed",
            });
            setPaymentMsg("Payment was cancelled or failed. You can try again.");
            setPaymentState("failed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        trackPublicEvent(PAYMENT_FAILED, {
          invoiceId,
          reason: "razorpay_failed",
        });
        setPaymentMsg("Payment failed. You can try again.");
        setPaymentState("failed");
      });
      rzp.open();
      setPaymentState("idle");
    } catch (err) {
      trackPublicEvent(PAYMENT_FAILED, {
        invoiceId,
        reason: "order_create_failed",
      });
      setPaymentMsg(err instanceof Error ? err.message : "Something went wrong");
      setPaymentState("failed");
    }
  };

  if (invoice.status === "paid" && !verifyData) {
    return (
      <PublicFlowShell title="Already paid" description="This invoice has already been paid. Thank you!">
        <Card className="w-full">
          <CardContent className="space-y-2 pt-6">
            <Row label="Invoice" value={invoice.invoiceNumber} />
            <Row label="Student" value={invoice.student.name} />
            <Row label="Amount" value={formatCurrency(invoice.totalAmount)} />
          </CardContent>
        </Card>
      </PublicFlowShell>
    );
  }

  if (verifyData) {
    return (
      <PublicFlowShell
        title="Payment successful"
        description={`A receipt has been sent to ${invoice.parent.email}`}
      >
        <Card className="w-full">
          <CardContent className="space-y-2 pt-6">
            <Row label="Invoice" value={verifyData.invoiceId} />
            <Row label="Student" value={invoice.student.name} />
            <Row label="Amount paid" value={formatCurrency(verifyData.amountPaid)} />
            <Row label="Payment ID" value={verifyData.razorpayPaymentId} />
            <Row
              label="Date"
              value={new Date(verifyData.paidAt).toLocaleDateString("en-IN", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            />
          </CardContent>
        </Card>
      </PublicFlowShell>
    );
  }

  return (
    <>
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setIsRazorpayReady(true)}
        onError={() => {
          setPaymentState("failed");
          setPaymentMsg("Failed to load payment gateway. Please refresh and try again.");
        }}
      />
      <PublicFlowShell
        title="Complete your payment"
        footer={
          <>
            Powered by <span className="font-medium">Razorpay</span>
          </>
        }
      >
        <div className="flex w-full flex-col gap-3">
          <Card className="w-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{invoice.student.name}</span>
                <span className="text-xs text-muted-foreground">{invoice.student.class}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="h-px bg-border" />
              <Row label="Invoice" value={invoice.invoiceNumber} />
              <Row label="Due date" value={formatDateLong(invoice.dueDate)} />
              <div className="h-px bg-border" />
              <div className="flex items-baseline justify-between pt-1">
                <span className="text-sm text-muted-foreground">Total amount</span>
                <span className="text-2xl font-bold tracking-tight">
                  {formatCurrency(invoice.totalAmount)}
                </span>
              </div>
            </CardContent>
          </Card>

          {paymentState === "failed" && paymentMsg && (
            <StatusBanner variant="warning">{paymentMsg}</StatusBanner>
          )}

          <Button
            className="h-12 w-full text-base font-semibold"
            onClick={handlePay}
            disabled={paymentState === "loading" || paymentState === "processing" || !isRazorpayReady}
          >
            {paymentState === "loading" || paymentState === "processing" ? (
              <>
                <Spinner className="mr-2" />
                {paymentState === "loading" ? "Preparing payment..." : "Verifying payment..."}
              </>
            ) : !isRazorpayReady ? (
              "Loading payment gateway..."
            ) : (
              `Pay ${formatCurrency(invoice.totalAmount)} with Razorpay`
            )}
          </Button>
        </div>
      </PublicFlowShell>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}
