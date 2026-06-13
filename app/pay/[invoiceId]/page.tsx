import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getInvoiceById } from "@/lib/services/invoices";
import { getRazorpayKeyId } from "@/lib/razorpay";
import { PayInvoiceClient } from "./pay-invoice-client";

type PageProps = {
  params: Promise<{ invoiceId: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { invoiceId } = await params;

  try {
    const invoice = await getInvoiceById(invoiceId.toUpperCase());
    return {
      title: `Pay ${invoice.invoiceNumber}`,
      description: `Complete payment for ${invoice.student.name} — invoice ${invoice.invoiceNumber}.`,
    };
  } catch {
    return {
      title: "Invoice not found",
      description: "The requested invoice could not be found.",
    };
  }
}

export default async function PayInvoicePage({ params }: PageProps) {
  const { invoiceId } = await params;
  const normalizedId = invoiceId.toUpperCase();

  try {
    const invoice = await getInvoiceById(normalizedId);

    return (
      <PayInvoiceClient
        invoiceId={normalizedId}
        invoice={{
          invoiceNumber: invoice.invoiceNumber,
          totalAmount: invoice.totalAmount,
          dueDate: invoice.dueDate,
          status: invoice.status,
          razorpayKeyId: getRazorpayKeyId(),
          student: {
            name: invoice.student.name,
            class: invoice.student.class,
          },
          parent: invoice.parent,
        }}
      />
    );
  } catch {
    notFound();
  }
}
