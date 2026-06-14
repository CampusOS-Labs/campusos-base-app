"use client";

import { useCallback, useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

import { trackPublicEvent } from "@/lib/analytics/track-event-client";
import { PAGE_VIEW, PRODUCT_PAGES } from "@/lib/services/product-analytics-events";
import { PublicFlowShell } from "@/components/public-flow-shell";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";

type Teacher = { id: string; name: string };

type LinkState = "idle" | "sending";

type CheckInClientProps = {
  initialTeachers: Teacher[];
  initialCheckedInToday: string[];
};

export function CheckInClient({
  initialTeachers,
  initialCheckedInToday,
}: CheckInClientProps) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [checkedInToday, setCheckedInToday] = useState<Set<string>>(
    () => new Set(initialCheckedInToday),
  );
  const [activeTeacherId, setActiveTeacherId] = useState<string | null>(null);
  const [linkState, setLinkState] = useState<LinkState>("idle");
  const [pageError, setPageError] = useState("");
  const [sentToTeacherId, setSentToTeacherId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    trackPublicEvent(PAGE_VIEW, { page: PRODUCT_PAGES.checkin });
  }, []);

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    setError("");
    try {
      const res = await fetch("/api/attendance/checkin");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not load teachers");
      setTeachers(json.data.teachers);
      setCheckedInToday(new Set(json.data.checkedInToday));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load check-in page");
    } finally {
      setRefreshing(false);
    }
  }, []);

  const handleRequestLink = useCallback(async (teacherId: string) => {
    setActiveTeacherId(teacherId);
    setLinkState("sending");
    setPageError("");
    setSentToTeacherId(null);

    try {
      const res = await fetch("/api/attendance/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId }),
      });
      const json = await res.json();

      if (!json.success) {
        throw new Error(json.error || "Could not send check-in link");
      }

      setSentToTeacherId(teacherId);
    } catch (err) {
      setPageError(err instanceof Error ? err.message : "Could not send check-in link");
    } finally {
      setLinkState("idle");
      setActiveTeacherId(null);
    }
  }, []);

  if (error) {
    return (
      <PublicFlowShell
        title="Could not load check-in"
        description={error}
      >
        <Button variant="outline" onClick={fetchStatus}>
          Try again
        </Button>
      </PublicFlowShell>
    );
  }

  return (
    <PublicFlowShell
      title="Teacher check-in"
      description="Select your name to get a WhatsApp link"
      footer={refreshing ? "Refreshing…" : undefined}
    >
      <div className="flex w-full flex-col gap-3">
        {pageError && (
          <StatusBanner variant="warning">{pageError}</StatusBanner>
        )}

        {sentToTeacherId && (
          <StatusBanner variant="success" icon={<MessageCircle className="size-4" />}>
            We sent a check-in link to your WhatsApp. Open it on your phone to complete check-in.
          </StatusBanner>
        )}

        <Card className="w-full">
          <CardContent className="space-y-2 pt-6">
            {teachers.map((teacher) => {
              const checkedIn = checkedInToday.has(teacher.id);
              const isBusy = activeTeacherId === teacher.id && linkState === "sending";
              const linkSent = sentToTeacherId === teacher.id;

              return (
                <div
                  key={teacher.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-3 transition-colors duration-150 ease-out hover:bg-muted/30"
                >
                  <div className="min-w-0">
                    <p className="font-medium">{teacher.name}</p>
                    {checkedIn && <p className="text-xs text-success">Checked in today</p>}
                    {linkSent && !checkedIn && (
                      <p className="text-xs text-muted-foreground">Link sent — check WhatsApp</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant={linkSent && !checkedIn ? "outline" : "default"}
                    disabled={checkedIn || (linkState !== "idle" && !isBusy)}
                    onClick={() => handleRequestLink(teacher.id)}
                  >
                    {isBusy ? (
                      <>
                        <Spinner className="mr-1.5" />
                        Sending...
                      </>
                    ) : checkedIn ? (
                      "Done"
                    ) : linkSent ? (
                      "Resend"
                    ) : (
                      "Send link"
                    )}
                  </Button>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </PublicFlowShell>
  );
}
