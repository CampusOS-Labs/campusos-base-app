import { listInvoices } from "@/lib/services/invoices"
import { PaymentsClient } from "./payments-client"

export default async function PaymentsPage() {
  const invoices = await listInvoices()
  return <PaymentsClient invoices={invoices} />
}
