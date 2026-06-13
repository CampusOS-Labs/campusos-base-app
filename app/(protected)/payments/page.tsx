import { listInvoices } from "@/lib/services/invoices"
import { PaymentsClient } from "./payments-client"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Payments",
  description: "View and manage student fee invoices.",
}

export default async function PaymentsPage() {
  const invoices = await listInvoices()
  return <PaymentsClient invoices={invoices} />
}
