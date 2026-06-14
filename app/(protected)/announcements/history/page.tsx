import Link from "next/link";
import { ClockCounterClockwiseIcon, PaperPlaneTiltIcon } from "@phosphor-icons/react/ssr";
import type { Metadata } from "next";

import { EmptyState } from "@/components/empty-state";
import { MetricStrip, PageHeader, PageSection, PageShell } from "@/components/page-layout";
import { buttonVariants } from "@/components/ui/button";
import { formatDateTimeIST } from "@/lib/format";
import { getAnnouncementHistory } from "@/lib/services/announcements";

import { HistoryEntry } from "./components/history-entry";

export const metadata: Metadata = {
  title: "Announcement history",
  description: "Past WhatsApp announcements sent to parents.",
};

export default async function AnnouncementHistoryPage() {
  let logs: Awaited<ReturnType<typeof getAnnouncementHistory>> = [];

  try {
    logs = await getAnnouncementHistory();
  } catch {}

  const totalRecipients = logs.reduce((sum, log) => sum + log.recipientCount, 0);

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Announcement history"
        description="Every message you've sent to parents, in one place."
        actions={
          <Link
            href="/announcements"
            className={buttonVariants({ variant: "outline", className: "ui-press" })}
          >
            <PaperPlaneTiltIcon className="size-4" weight="duotone" />
            New announcement
          </Link>
        }
      />

      {logs.length === 0 ? (
        <EmptyState
          icon={<ClockCounterClockwiseIcon className="size-12" weight="duotone" />}
          title="No announcements yet"
          description="When you send your first message to parents, it will show up here."
          action={
            <Link href="/announcements" className={buttonVariants({ className: "ui-press" })}>
              Send announcement
            </Link>
          }
        />
      ) : (
        <>
          <MetricStrip
            metrics={[
              { value: logs.length, label: "Announcements sent" },
              { value: totalRecipients, label: "Total recipients" },
              {
                value: formatDateTimeIST(logs[0]!.createdAt),
                label: "Most recent send",
              },
            ]}
          />

          <PageSection
            title="Recent sends"
            description={`Showing your last ${logs.length} announcement${logs.length === 1 ? "" : "s"}.`}
          >
            <div className="space-y-3">
              {logs.map((log) => (
                <HistoryEntry
                  key={log.id}
                  title={log.title}
                  message={log.message}
                  type={log.type}
                  recipientCount={log.recipientCount}
                  audienceLabel={log.audienceLabel}
                  createdAt={log.createdAt}
                />
              ))}
            </div>
          </PageSection>
        </>
      )}
    </PageShell>
  );
}
