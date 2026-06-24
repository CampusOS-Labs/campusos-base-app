import { desc } from "drizzle-orm"
import type { z } from "zod"

import { db } from "@/lib/db"
import { contactInquiry } from "@/lib/db/schema"
import { contactInquirySchema } from "@/lib/schemas/contact-inquiry"

type ContactInquiryInput = z.infer<typeof contactInquirySchema>

export async function createContactInquiry(input: ContactInquiryInput) {
  const id = crypto.randomUUID()

  await db.insert(contactInquiry).values({
    id,
    name: input.name,
    schoolName: input.schoolName,
    email: input.email,
    message: input.message,
  })

  return { id }
}

export async function listContactInquiries(limit = 100) {
  return db
    .select()
    .from(contactInquiry)
    .orderBy(desc(contactInquiry.createdAt))
    .limit(limit)
}
