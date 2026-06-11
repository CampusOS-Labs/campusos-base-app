"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import {
  kidzeeMundhwaContactGroup,
  kidzeeMundhwaContact,
} from "@/lib/db/schema";
import {
  getUserGroups as _getUserGroups,
  getGroupWithContacts as _getGroupWithContacts,
} from "@/lib/services/groups";

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

  await db.insert(kidzeeMundhwaContactGroup).values({
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

  const existing = await db.query.kidzeeMundhwaContactGroup.findFirst({
    where: and(eq(kidzeeMundhwaContactGroup.id, groupId), eq(kidzeeMundhwaContactGroup.createdBy, user.id)),
  });

  if (!existing) throw new Error("Group not found");

  await db
    .update(kidzeeMundhwaContactGroup)
    .set({ name, description })
    .where(eq(kidzeeMundhwaContactGroup.id, groupId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export async function deleteGroup(groupId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const existing = await db.query.kidzeeMundhwaContactGroup.findFirst({
    where: and(eq(kidzeeMundhwaContactGroup.id, groupId), eq(kidzeeMundhwaContactGroup.createdBy, user.id)),
  });

  if (!existing) throw new Error("Group not found");

  await db.delete(kidzeeMundhwaContactGroup).where(eq(kidzeeMundhwaContactGroup.id, groupId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export const getUserGroups = _getUserGroups;
export const getGroupWithContacts = _getGroupWithContacts;

export async function addContact(formData: FormData) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const groupId = formData.get("groupId")?.toString();
  const name = formData.get("name")?.toString().trim();
  const phoneNumber = formData.get("phoneNumber")?.toString().trim();
  const notes = formData.get("notes")?.toString().trim() || null;

  if (!groupId || !name || !phoneNumber) throw new Error("Group ID, name, and phone number are required");

  const group = await db.query.kidzeeMundhwaContactGroup.findFirst({
    where: and(eq(kidzeeMundhwaContactGroup.id, groupId), eq(kidzeeMundhwaContactGroup.createdBy, user.id)),
  });

  if (!group) throw new Error("Group not found");

  const id = crypto.randomUUID();

  await db.insert(kidzeeMundhwaContact).values({
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

  const existingContact = await db.query.kidzeeMundhwaContact.findFirst({
    where: eq(kidzeeMundhwaContact.id, contactId),
    with: { group: true },
  });

  if (!existingContact || existingContact.group.createdBy !== user.id) {
    throw new Error("Contact not found");
  }

  await db
    .update(kidzeeMundhwaContact)
    .set({ name, phoneNumber, notes })
    .where(eq(kidzeeMundhwaContact.id, contactId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}

export async function deleteContact(contactId: string) {
  const session = await auth.api.getSession({ headers: await headers() });
  const user = requireUser(session);

  const existingContact = await db.query.kidzeeMundhwaContact.findFirst({
    where: eq(kidzeeMundhwaContact.id, contactId),
    with: { group: true },
  });

  if (!existingContact || existingContact.group.createdBy !== user.id) {
    throw new Error("Contact not found");
  }

  await db.delete(kidzeeMundhwaContact).where(eq(kidzeeMundhwaContact.id, contactId));

  revalidatePath("/groups");
  revalidatePath("/announcements");
}
