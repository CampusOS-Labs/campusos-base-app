"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => {
      open(): void;
      on(event: string, handler: (...args: unknown[]) => void): void;
    };
  }
}

type InvoiceData = {
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

function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + "T00:00:00").toLocaleDateString("en-IN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function loadRazorpayScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Razorpay SDK"));
    document.body.appendChild(script);
  });
}

export default function PayInvoicePage() {
  const params = useParams();
  const invoiceId = params.invoiceId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [paymentState, setPaymentState] = useState<PaymentState>("idle");
  const [paymentMsg, setPaymentMsg] = useState("");
  const [verifyData, setVerifyData] = useState<VerifyData | null>(null);

  const fetchInvoice = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`/api/invoices/${invoiceId}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Invoice not found");
      setInvoice(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invoice not found");
    } finally {
      setLoading(false);
    }
  }, [invoiceId]);

  useEffect(() => {
    fetchInvoice();
  }, [fetchInvoice]);

  const handlePay = async () => {
    setPaymentState("loading");
    setPaymentMsg("");

    try {
      const orderRes = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ invoiceId }),
      });
      const orderJson = await orderRes.json();
      if (!orderJson.success) throw new Error(orderJson.error || "Failed to create order");
      const order = orderJson.data;

      await loadRazorpayScript();

      const options = {
        key: invoice!.razorpayKeyId,
        amount: order.amount,
        currency: order.currency || "INR",
        name: invoice!.student.name,
        description: `Invoice ${invoice!.invoiceNumber}`,
        order_id: order.orderId,
        prefill: {
          name: invoice!.parent.name,
          email: order.prefillEmail,
          contact: order.prefillContact,
        },
        theme: { color: "#2563eb" },
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
                verifyJson.error ||
                  "Verification failed. Payment may have been received.",
              );
            }
            setVerifyData(verifyJson.data);
            setInvoice((prev) =>
              prev ? { ...prev, status: "paid" } : prev,
            );
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
            setPaymentMsg(
              "Payment was cancelled or failed. You can try again.",
            );
            setPaymentState("failed");
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", () => {
        setPaymentMsg("Payment failed. You can try again.");
        setPaymentState("failed");
      });
      rzp.open();
      setPaymentState("idle");
    } catch (err) {
      setPaymentMsg(err instanceof Error ? err.message : "Something went wrong");
      setPaymentState("failed");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
          <svg
            className="size-7 text-destructive"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Invoice not found</h1>
        <p className="max-w-sm text-center text-muted-foreground">
          We couldn&apos;t find invoice <strong>{invoiceId}</strong>. Check the
          link or contact the school for assistance.
        </p>
        <Button variant="outline" onClick={fetchInvoice}>
          Try again
        </Button>
      </div>
    );
  }

  if (invoice.status === "paid" && !verifyData) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="size-7 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Already paid</h1>
        <p className="max-w-sm text-center text-muted-foreground">
          This invoice has already been paid. Thank you!
        </p>
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-2 pt-4">
            <Row label="Invoice" value={invoice.invoiceNumber} />
            <Row label="Student" value={invoice.student.name} />
            <Row label="Amount" value={formatINR(invoice.totalAmount)} />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (verifyData) {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <svg
            className="size-7 text-emerald-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>
        <h1 className="text-xl font-semibold">Payment successful!</h1>
        <Card className="w-full max-w-sm">
          <CardContent className="space-y-2 pt-4">
            <Row label="Invoice" value={verifyData.invoiceId} />
            <Row label="Student" value={invoice.student.name} />
            <Row label="Amount paid" value={formatINR(verifyData.amountPaid)} />
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
        <p className="text-center text-sm text-muted-foreground">
          A receipt has been sent to {invoice.parent.email}
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <svg
            className="size-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2.25 8.25h19.5M2.25 9h19.5m-16.5 5.25h6m-6 2.25h3m-3.75 3h15a2.25 2.25 0 0 0 2.25-2.25V6.75A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25v10.5A2.25 2.25 0 0 0 4.5 19.5Z"
            />
          </svg>
        </div>
        <h1 className="text-lg font-semibold">Complete your payment</h1>
      </div>

      <Card className="w-full max-w-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">
              {invoice.student.name}
            </span>
            <span className="text-xs text-muted-foreground">
              {invoice.student.class}
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="h-px bg-border" />
          <Row label="Invoice" value={invoice.invoiceNumber} />
          <Row label="Due date" value={formatDate(invoice.dueDate)} />
          <div className="h-px bg-border" />

          <div className="flex items-baseline justify-between pt-1">
            <span className="text-sm text-muted-foreground">
              Total amount
            </span>
            <span className="text-2xl font-bold tracking-tight">
              {formatINR(invoice.totalAmount)}
            </span>
          </div>
        </CardContent>
      </Card>

      {paymentState === "failed" && paymentMsg && (
        <div className="flex w-full max-w-sm items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          <svg
            className="mt-0.5 size-4 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z"
            />
          </svg>
          <span>{paymentMsg}</span>
        </div>
      )}

      <Button
        className="h-12 w-full max-w-sm text-base font-semibold"
        onClick={handlePay}
        disabled={paymentState === "loading" || paymentState === "processing"}
      >
        {paymentState === "loading" || paymentState === "processing" ? (
          <>
            <Spinner className="mr-2" />
            {paymentState === "loading"
              ? "Preparing payment..."
              : "Verifying payment..."}
          </>
        ) : (
          `Pay ${formatINR(invoice.totalAmount)} with Razorpay`
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Powered by <span className="font-medium">Razorpay</span>
      </p>
    </div>
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
