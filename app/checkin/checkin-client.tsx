"use client";

import { useCallback, useState } from "react";
import { CheckCircle2, MessageCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold">Could not load check-in</h1>
        <p className="max-w-sm text-center text-muted-foreground">{error}</p>
        <Button variant="outline" onClick={fetchStatus}>
          Try again
        </Button>
      </div>
    );
  }

  return (
    <div className="flex min-h-svh flex-col items-center gap-6 px-4 py-8">
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <CheckCircle2 className="size-5" />
        </div>
        <h1 className="text-lg font-semibold">Teacher Check-In</h1>
        <p className="text-sm text-muted-foreground">
          Kidzee Mundhwa · Select your name to get a WhatsApp link
        </p>
        {refreshing && <Spinner className="size-4" />}
      </div>

      {pageError && (
        <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
          {pageError}
        </div>
      )}

      {sentToTeacherId && (
        <div className="flex w-full max-w-md items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
          <MessageCircle className="mt-0.5 size-4 shrink-0" />
          <span>
            We sent a check-in link to your WhatsApp. Open it on your phone to complete check-in.
          </span>
        </div>
      )}

      <Card className="w-full max-w-md">
        <CardHeader>
          <p className="text-sm text-muted-foreground">Select your name</p>
        </CardHeader>
        <CardContent className="space-y-2">
          {teachers.map((teacher) => {
            const checkedIn = checkedInToday.has(teacher.id);
            const isBusy = activeTeacherId === teacher.id && linkState === "sending";
            const linkSent = sentToTeacherId === teacher.id;

            return (
              <div
                key={teacher.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-3"
              >
                <div className="min-w-0">
                  <p className="font-medium">{teacher.name}</p>
                  {checkedIn && <p className="text-xs text-emerald-600">Checked in today</p>}
                  {linkSent && !checkedIn && (
                    <p className="text-xs text-muted-foreground">Link sent — check WhatsApp</p>
                  )}
                </div>
                <Button
                  size="sm"
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
                    "Resend link"
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
  );
}
