"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { contactGroup, contact } from "@/lib/db/schema";

function requireUser(session: Awaited<ReturnType<typeof auth.api.getSession>>) {
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user;
}

export async function createGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;

  if (!name) throw new Error("Group name is required");

  const id = crypto.randomUUID();

  await db.insert(contactGroup).values({
    id,
    name,
    description,
    createdBy: user.id,
  });

  revalidatePath("/groups");
  revalidatePath("/announcements");
  return { id };
}

export async function updateGroup(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const groupId = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;

  if (!groupId || !name) throw new Error("Group ID and name are required");

  const existing = await db.query.contactGroup.findFirst({
    where: and(eq(contactGroup.id, groupId), eq(contactGroup.createdBy, user.id)),
  });

  if (!existing) throw new Error("Group not found");

  await db
    .update(contactGroup)
    .set({ name, description })
    .where(eq(contactGroup.id, groupId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export async function deleteGroup(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const existing = await db.query.contactGroup.findFirst({
    where: and(eq(contactGroup.id, groupId), eq(contactGroup.createdBy, user.id)),
  });

  if (!existing) throw new Error("Group not found");

  await db.delete(contactGroup).where(eq(contactGroup.id, groupId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export async function getUserGroups() {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const groups = await db.query.contactGroup.findMany({
    where: eq(contactGroup.createdBy, user.id),
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
  const user = requireUser(session);

  const group = await db.query.contactGroup.findFirst({
    where: and(eq(contactGroup.id, groupId), eq(contactGroup.createdBy, user.id)),
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

export async function addContact(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const groupId = formData.get("groupId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const phoneNumber = formData.get("phoneNumber")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!groupId || !name || !phoneNumber) throw new Error("Group ID, name, and phone number are required");

  const group = await db.query.contactGroup.findFirst({
    where: and(eq(contactGroup.id, groupId), eq(contactGroup.createdBy, user.id)),
  });

  if (!group) throw new Error("Group not found");

  const id = crypto.randomUUID();

  await db.insert(contact).values({
    id,
    groupId,
    name,
    phoneNumber,
    notes,
  });

  revalidatePath("/groups");
  revalidatePath("/announcements");
  return { id };
}

export async function updateContact(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const contactId = formData.get("id")?.toString();
  const name = formData.get("name")?.toString().trim();
  const phoneNumber = formData.get("phoneNumber")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!contactId || !name || !phoneNumber) throw new Error("Contact ID, name, and phone number are required");

  const existingContact = await db.query.contact.findFirst({
    where: eq(contact.id, contactId),
    with: { group: true },
  });

  if (!existingContact || existingContact.group.createdBy !== user.id) {
    throw new Error("Contact not found");
  }

  await db
    .update(contact)
    .set({ name, phoneNumber, notes })
    .where(eq(contact.id, contactId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export async function deleteContact(contactId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const existingContact = await db.query.contact.findFirst({
    where: eq(contact.id, contactId),
    with: { group: true },
  });

  if (!existingContact || existingContact.group.createdBy !== user.id) {
    throw new Error("Contact not found");
  }

  await db.delete(contact).where(eq(contact.id, contactId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}
