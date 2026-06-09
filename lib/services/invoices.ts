import fs from "fs"
import path from "path"

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

const DATA_DIR = path.join(process.cwd(), "data", "invoices")

function normalizeInvoice(data: Record<string, unknown>): Invoice {
  return {
    ...(data as unknown as Invoice),
    status:
      String(data.status || "pending").toLowerCase() === "paid"
        ? "paid"
        : "pending",
  }
}

export async function listInvoices(): Promise<Invoice[]> {
  const files = fs.readdirSync(DATA_DIR)
  const jsonFiles = files.filter((f) => f.endsWith(".json"))

  const invoices = jsonFiles.map((fileName) => {
    const filePath = path.join(DATA_DIR, fileName)
    const content = fs.readFileSync(filePath, "utf-8")
    return normalizeInvoice(JSON.parse(content))
  })

  return invoices.sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber))
}

export async function getInvoiceById(
  invoiceId: string,
): Promise<Invoice> {
  const filePath = path.join(DATA_DIR, `${invoiceId}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Invoice not found: ${invoiceId}`)
  }

  const content = fs.readFileSync(filePath, "utf-8")
  return normalizeInvoice(JSON.parse(content))
}

export async function markInvoicePaid(
  invoiceId: string,
  paymentDetails: PaymentDetails,
): Promise<Invoice> {
  const filePath = path.join(DATA_DIR, `${invoiceId}.json`)

  if (!fs.existsSync(filePath)) {
    throw new Error(`Invoice not found: ${invoiceId}`)
  }

  const content = fs.readFileSync(filePath, "utf-8")
  const data = JSON.parse(content)

  data.status = "paid"
  data.paymentDetails = {
    ...paymentDetails,
    updatedAt: new Date().toISOString(),
  }

  fs.writeFileSync(filePath, JSON.stringify(data, null, 2))

  return normalizeInvoice(data)
}
