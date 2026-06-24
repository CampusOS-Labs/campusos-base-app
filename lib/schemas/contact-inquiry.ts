import { z } from "zod"

export const contactInquirySchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  schoolName: z.string().trim().min(1, "School name is required"),
  email: z.string().trim().email("Invalid email address"),
  message: z.string().trim().min(1, "Message is required"),
})
