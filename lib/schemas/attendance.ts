import { z } from "zod";

export const requestCheckInLinkSchema = z.object({
  teacherId: z.string().min(1),
});

export const completeCheckInSchema = z.object({
  token: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  manualOverride: z.boolean().optional().default(false),
});

export const tokenQuerySchema = z.object({
  token: z.string().min(1),
});
