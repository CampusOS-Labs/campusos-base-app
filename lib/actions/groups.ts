"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { SCHOOL_ID } from "@/lib/constants";
import {
  kidzeeMundhwaContactGroup,
  kidzeeMundhwaContact,
} from "@/lib/db/schema";
import {
  GROUP_CONTACT_ADDED,
  GROUP_CREATED,
} from "@/lib/services/product-analytics-events";
import { trackProductEvent } from "@/lib/services/product-analytics";
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
  const contactsRaw = formData.get("contacts")?.toString();

  if (!name) throw new Error("Group name is required");

  type ContactInput = { name: string; phoneNumber: string; notes: string | null };
  let contacts: ContactInput[] = [];

  if (contactsRaw) {
    try {
      const parsed = JSON.parse(contactsRaw);
      if (Array.isArray(parsed)) {
        contacts = parsed
          .map((contact) => ({
            name: String(contact?.name ?? "").trim(),
            phoneNumber: String(contact?.phoneNumber ?? "").trim(),
            notes: String(contact?.notes ?? "").trim() || null,
          }))
          .filter((contact) => contact.name && contact.phoneNumber);
      }
    } catch {
      throw new Error("Invalid contacts payload");
    }
  }

  const id = crypto.randomUUID();

  await db.transaction(async (tx) => {
    await tx.insert(kidzeeMundhwaContactGroup).values({
      id,
      name,
      description,
      createdBy: user.id,
    });

    if (contacts.length > 0) {
      await tx.insert(kidzeeMundhwaContact).values(
        contacts.map((contact) => ({
          id: crypto.randomUUID(),
          groupId: id,
          name: contact.name,
          phoneNumber: contact.phoneNumber,
          notes: contact.notes,
        })),
      );
    }
  });

  trackProductEvent({
    schoolId: SCHOOL_ID,
    userId: user.id,
    event: GROUP_CREATED,
    properties: { groupId: id, contactCount: contacts.length },
  });

  for (const _contact of contacts) {
    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: user.id,
      event: GROUP_CONTACT_ADDED,
      properties: { groupId: id, source: "create_group" },
    });
  }

  revalidatePath("/groups");
  revalidatePath("/announcements");
  return { id, contactCount: contacts.length };
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

  trackProductEvent({
    schoolId: SCHOOL_ID,
    userId: user.id,
    event: GROUP_CONTACT_ADDED,
    properties: { groupId },
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
