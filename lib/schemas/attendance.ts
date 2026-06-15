import { z } from "zod";

const attendanceActionSchema = z.object({
  teacherId: z.string().min(1),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  manualOverride: z.boolean().optional().default(false),
});

export const checkInSchema = attendanceActionSchema;
export const checkOutSchema = attendanceActionSchema;
