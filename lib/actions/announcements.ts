"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SCHOOL_ID } from "@/lib/constants";
import { kidzeeMundhwaAnnouncementLog } from "@/lib/db/schema";
import {
  ANNOUNCEMENT_SENT,
  trackProductEvent,
} from "@/lib/services/product-analytics";

function requireUser(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function logAnnouncement(data: {
  title: string;
  message: string | null;
  type: string;
  recipientCount: number;
  groupId?: string | null;
  audienceLabel?: string | null;
}) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const id = crypto.randomUUID();

  await db.insert(kidzeeMundhwaAnnouncementLog).values({
    id,
    userId: user.id,
    title: data.title,
    message: data.message,
    type: data.type,
    recipientCount: data.recipientCount,
    groupId: data.groupId ?? null,
    audienceLabel: data.audienceLabel ?? null,
  });

  if (data.recipientCount > 0) {
    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: user.id,
      event: ANNOUNCEMENT_SENT,
      properties: {
        recipientCount: data.recipientCount,
        type: data.type,
        audienceLabel: data.audienceLabel ?? null,
        source: "server",
      },
    })
  };

  revalidatePath("/announcements/history");
  return { id };
}


