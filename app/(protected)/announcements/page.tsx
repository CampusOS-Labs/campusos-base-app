import type { Metadata } from "next";

import { getUserGroups } from "@/lib/actions/groups";
import { listInvoices } from "@/lib/services/invoices";
import { AnnouncementsClient } from "./announcements-client";

export const metadata: Metadata = {
  title: "Compose",
  description: "Send WhatsApp announcements to parents.",
};

export default async function AnnouncementsPage() {
  const [initialInvoices, initialUserGroups] = await Promise.all([
    listInvoices(),
    getUserGroups(),
  ]);

  return (
    <AnnouncementsClient
      initialInvoices={initialInvoices}
      initialUserGroups={initialUserGroups}
    />
  );
}
