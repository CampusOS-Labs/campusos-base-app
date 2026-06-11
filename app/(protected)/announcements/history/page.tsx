import { History, Megaphone, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">Announcement History</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Recently sent announcements and messages.
          </p>
        </div>

        {logs.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            <History className="mx-auto mb-3 size-12 opacity-50" />
            <p>No announcements sent yet.</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {logs.map((log) => (
              <Card key={log.id}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex size-8 items-center justify-center rounded-lg bg-muted">
                        <Megaphone className="size-4" />
                      </div>
                      <div>
                        <CardTitle className="text-sm">{log.title}</CardTitle>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(log.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">
                        {TYPE_LABELS[log.type] || log.type}
                      </Badge>
                      <Badge variant="default">
                        <Users className="mr-1 size-3" />
                        {log.recipientCount}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                {log.message && (
                  <CardContent>
                    <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                      {log.message.length > 200
                        ? log.message.slice(0, 200) + "..."
                        : log.message}
                    </p>
                    {log.audienceLabel && (
                      <p className="mt-2 flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="size-3" />
                        Sent to: {log.audienceLabel}
                      </p>
                    )}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
