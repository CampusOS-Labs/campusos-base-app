import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { kidzeeVadgaonsheriAnnouncementLog } from "@/lib/db/schema";

export async function getAnnouncementHistory() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const logs = await db.query.kidzeeVadgaonsheriAnnouncementLog.findMany({
    where: eq(kidzeeVadgaonsheriAnnouncementLog.userId, session.user.id),
    orderBy: [desc(kidzeeVadgaonsheriAnnouncementLog.createdAt)],
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
