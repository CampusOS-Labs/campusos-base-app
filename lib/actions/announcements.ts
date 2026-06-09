"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { eq, desc } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { announcementLog } from "@/lib/db/schema";

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

  await db.insert(announcementLog).values({
    id,
    userId: user.id,
    title: data.title,
    message: data.message,
    type: data.type,
    recipientCount: data.recipientCount,
    groupId: data.groupId ?? null,
    audienceLabel: data.audienceLabel ?? null,
  });

  revalidatePath("/announcements/history");
  return { id };
}

export async function getAnnouncementHistory() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const logs = await db.query.announcementLog.findMany({
    where: eq(announcementLog.userId, user.id),
    orderBy: [desc(announcementLog.createdAt)],
    limit: 50,
  });

  return logs.map((log) => ({
    id: log.id,
    title: log.title,
    message: log.message,
    type: log.type,
    recipientCount: log.recipientCount,
    audienceLabel: log.audienceLabel,
    createdAt: log.createdAt.toISOString(),
  }));
}
