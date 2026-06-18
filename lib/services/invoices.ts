import { eq } from "drizzle-orm"
import { cacheLife, cacheTag, revalidateTag } from "next/cache"

import { db } from "@/lib/db"
import { kidzeeVadgaonsheriInvoices } from "@/lib/db/schema"

export type Invoice = {
  invoiceNumber: string
  academicYear: string
  dueDate: string
  status: "pending" | "paid"
  totalAmount: number
  student: {
    id: string
    name: string
    class: string
    rollNumber: string
    admissionNumber: string
  }
  parent: {
    name: string
    phone: string
    email: string
  }
}

type PaymentDetails = {
  razorpayOrderId: string
  razorpayPaymentId: string
  method: string
  paidAt: string
  source?: string
}

function rowToInvoice(row: typeof kidzeeVadgaonsheriInvoices.$inferSelect): Invoice {
  return {
    invoiceNumber: row.invoiceNumber,
    academicYear: row.academicYear,
    dueDate: row.dueDate,
    status: row.status as "pending" | "paid",
    totalAmount: row.totalAmount,
    student: {
      id: row.studentId,
      name: row.studentName,
      class: row.studentClass,
      rollNumber: row.rollNumber,
      admissionNumber: row.admissionNumber,
    },
    parent: {
      name: row.parentName,
      phone: row.parentPhone,
      email: row.parentEmail,
    },
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  "use cache"
  cacheLife('minutes')
  cacheTag('invoices')

  try {
    const rows = await db
      .select()
      .from(kidzeeVadgaonsheriInvoices)
      .orderBy(kidzeeVadgaonsheriInvoices.invoiceNumber)

    return rows.map(rowToInvoice)
  } catch {
    return []
  }
}

export async function getInvoiceById(
  invoiceId: string,
): Promise<Invoice> {
  "use cache"
  cacheLife('minutes')
  cacheTag('invoices', `invoice-${invoiceId}`)

  const [row] = await db
    .select()
    .from(kidzeeVadgaonsheriInvoices)
    .where(eq(kidzeeVadgaonsheriInvoices.invoiceNumber, invoiceId))
    .limit(1)

  if (!row) {
    throw new Error(`Invoice not found: ${invoiceId}`)
  }

  return rowToInvoice(row)
}

export async function markInvoicePaid(
  invoiceId: string,
  paymentDetails: PaymentDetails,
): Promise<Invoice> {
  const [row] = await db
    .update(kidzeeVadgaonsheriInvoices)
    .set({
      status: "paid",
      paymentDetails: {
        ...paymentDetails,
        updatedAt: new Date().toISOString(),
      },
    })
    .where(eq(kidzeeVadgaonsheriInvoices.invoiceNumber, invoiceId))
    .returning()

  if (!row) {
    throw new Error(`Invoice not found: ${invoiceId}`)
  }

  revalidateTag('invoices', 'seconds')
  revalidateTag(`invoice-${invoiceId}`, 'seconds')

  return rowToInvoice(row)
}
