import { History, Megaphone, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PageHeader, PageSection, PageShell } from "@/components/page-layout";
import { getAnnouncementHistory } from "@/lib/services/announcements";

type LogEntry = {
  id: string;
  title: string;
  message: string | null;
  type: string;
  recipientCount: number;
  audienceLabel: string | null;
  createdAt: string;
};

const TYPE_LABELS: Record<string, string> = {
  announcement: "📢 Announcement",
  activities: "🎯 Activities",
  "payment-reminder": "💰 Payment Reminder",
  media: "📸 Media",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleString();
}

export default async function AnnouncementHistoryPage() {
  let logs: LogEntry[] = [];

  try {
    logs = await getAnnouncementHistory();
  } catch {}

  return (
    <PageShell>
      <PageHeader
        title="Announcement history"
        description="Recently sent announcements and messages."
      />

      {logs.length === 0 ? (
        <div className="py-12 text-center text-muted-foreground">
          <History className="mx-auto mb-3 size-12 opacity-50" />
          <p>No announcements sent yet.</p>
        </div>
      ) : (
        <PageSection>
          <div className="divide-y border-t border-border">
            {logs.map((log) => (
              <article key={log.id} className="space-y-2 py-5 first:pt-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <Megaphone className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                    <div className="min-w-0">
                      <h3 className="font-medium">{log.title}</h3>
                      <p className="text-xs text-muted-foreground">{formatDate(log.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="secondary">{TYPE_LABELS[log.type] || log.type}</Badge>
                    <Badge variant="default">
                      <Users className="mr-1 size-3" />
                      {log.recipientCount}
                    </Badge>
                  </div>
                </div>
                {log.message ? (
                  <p className="whitespace-pre-wrap pl-7 text-sm text-muted-foreground">
                    {log.message.length > 200
                      ? `${log.message.slice(0, 200)}...`
                      : log.message}
                  </p>
                ) : null}
                {log.audienceLabel ? (
                  <p className="flex items-center gap-1 pl-7 text-xs text-muted-foreground">
                    <Users className="size-3" />
                    Sent to: {log.audienceLabel}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </PageSection>
      )}
    </PageShell>
  );
}
