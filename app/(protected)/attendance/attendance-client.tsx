"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

type AttendanceRecord = {
  id: string;
  teacherId: string;
  teacherName: string;
  checkedInAt: string;
  distanceMeters: number;
  geofencePassed: boolean;
  manualOverride: boolean;
};

type Teacher = { id: string; name: string };

type Summary = {
  records: AttendanceRecord[];
  pending: Teacher[];
  teachers: Teacher[];
};

function checkInUrl() {
  const base = process.env.NEXT_PUBLIC_APP_URL || (typeof window !== "undefined" ? window.location.origin : "");
  return `${base.replace(/\/$/, "")}/checkin`;
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AttendanceClient() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [url, setUrl] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendance/today");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not load attendance");
      setSummary(json.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setUrl(checkInUrl());
    fetchSummary();
  }, [fetchSummary]);

  const copyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Check-in link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, [url]);

  if (loading && !summary) {
    return (
      <div className="flex justify-center py-12">
        <Spinner className="size-8" />
      </div>
    );
  }

  const records = summary?.records ?? [];
  const pending = summary?.pending ?? [];
  const totalTeachers = summary?.teachers.length ?? 0;

  return (
    <div className="flex justify-center pt-6 pb-12">
      <div className="w-full max-w-[66.666667%] space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-heading">Attendance</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Teachers scan the QR, get a WhatsApp link, then confirm check-in on their phone.
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-1 py-6">
            <span className="text-4xl font-semibold font-heading">{records.length}</span>
            <span className="text-sm text-muted-foreground">Checked in today</span>
          </div>
          <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-1 py-6">
            <span className="text-4xl font-semibold font-heading">{pending.length}</span>
            <span className="text-sm text-muted-foreground">Not yet checked in</span>
          </div>
          <div className="rounded-xl border bg-card flex flex-col items-center justify-center gap-1 py-6">
            <span className="text-4xl font-semibold font-heading">{totalTeachers}</span>
            <span className="text-sm text-muted-foreground">Total teachers</span>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-6">
          <h2 className="text-lg font-medium">Check-in QR code</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Print or display at the entrance. Teachers open this on their phone and tap their name.
          </p>
          <div className="mt-6 flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            {url && (
              <div className="rounded-lg border bg-white p-4">
                <QRCode value={url} size={160} />
              </div>
            )}
            <div className="flex flex-col gap-2 sm:pt-2">
              <p className="max-w-sm break-all text-sm text-muted-foreground">{url || "—"}</p>
              <Button variant="outline" size="sm" className="w-fit" onClick={copyLink} disabled={!url}>
                <Copy />
                Copy link
              </Button>
            </div>
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {pending.length > 0 && (
          <div>
            <h2 className="mb-3 text-lg font-medium">Not checked in</h2>
            <div className="flex flex-wrap gap-2">
              {pending.map((t) => (
                <span key={t.id} className="rounded-full border px-3 py-1 text-sm text-muted-foreground">
                  {t.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-3 text-lg font-medium">Today&apos;s check-ins</h2>
          {records.length === 0 ? (
            <p className="text-sm text-muted-foreground">No check-ins yet today.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-4 py-3 font-medium">Teacher</th>
                    <th className="px-4 py-3 font-medium">Time</th>
                    <th className="px-4 py-3 font-medium">Distance</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {records.map((r) => (
                    <tr key={r.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{r.teacherName}</td>
                      <td className="px-4 py-3 text-muted-foreground">{formatTime(r.checkedInAt)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{r.distanceMeters}m</td>
                      <td className="px-4 py-3">
                        {r.manualOverride ? (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
                            Manual override
                          </span>
                        ) : r.geofencePassed ? (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-800">
                            On-site
                          </span>
                        ) : (
                          <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium">
                            Unknown
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
