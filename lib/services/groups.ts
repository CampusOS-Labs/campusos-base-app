import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { kidzeeMundhwaContactGroup } from "@/lib/db/schema";

export async function getUserGroups() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const groups = await db.query.kidzeeMundhwaContactGroup.findMany({
    where: eq(kidzeeMundhwaContactGroup.createdBy, session.user.id),
    with: {
      contacts: true,
    },
    orderBy: (g, { desc }) => [desc(g.createdAt)],
  });

  return groups.map((g) => ({
    id: g.id,
    name: g.name,
    description: g.description,
    contactCount: g.contacts.length,
    createdAt: g.createdAt.toISOString(),
  }));
}

export async function getGroupWithContacts(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user?.id) throw new Error("Unauthorized");

  const group = await db.query.kidzeeMundhwaContactGroup.findFirst({
    where: and(eq(kidzeeMundhwaContactGroup.id, groupId), eq(kidzeeMundhwaContactGroup.createdBy, session.user.id)),
    with: {
      contacts: {
        orderBy: (c, { asc }) => [asc(c.name)],
      },
    },
  });

  if (!group) throw new Error("Group not found");

  return {
    id: group.id,
    name: group.name,
    description: group.description,
    contactCount: group.contacts.length,
    createdAt: group.createdAt.toISOString(),
    contacts: group.contacts.map((c) => ({
      id: c.id,
      name: c.name,
      phoneNumber: c.phoneNumber,
      notes: c.notes,
    })),
  };
}
