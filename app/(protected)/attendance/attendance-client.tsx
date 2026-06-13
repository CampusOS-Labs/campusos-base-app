"use client";

import { useCallback, useEffect, useState } from "react";
import QRCode from "react-qr-code";
import { Copy, RefreshCw } from "lucide-react";
import { toast } from "sonner";

import {
  DataTable,
  MetricStrip,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-layout";
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
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (typeof window !== "undefined" ? window.location.origin : "");
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
    <PageShell>
      <PageHeader
        title="Attendance"
        description="Teachers scan the QR, get a WhatsApp link, then confirm check-in on their phone."
        actions={
          <Button variant="outline" size="sm" onClick={fetchSummary} disabled={loading}>
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        }
      />

      <MetricStrip
        metrics={[
          { value: records.length, label: "checked in today" },
          { value: pending.length, label: "not yet checked in" },
          { value: totalTeachers, label: "total teachers" },
        ]}
      />

      <PageSection
        title="Check-in QR code"
        // description="Print or display at the entrance. Teachers open this on their phone and tap their name."
      >
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          {url ? (
            <div className="bg-white p-3">
              <QRCode value={url} size={160} />
            </div>
          ) : null}
          <div className="flex flex-col gap-2 sm:pt-2">
            {/*<p className="max-w-md break-all text-sm text-muted-foreground">{url || "—"}</p>*/}
            {/*<Button variant="outline" size="sm" className="w-fit" onClick={copyLink} disabled={!url}>
              <Copy />
              Copy link
            </Button>*/}
          </div>
        </div>
      </PageSection>

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {pending.length > 0 ? (
        <PageSection title="Not checked in">
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {pending.map((t) => (
              <span key={t.id} className="text-sm text-muted-foreground">
                {t.name}
              </span>
            ))}
          </div>
        </PageSection>
      ) : null}

      <PageSection title="Today's check-ins">
        {records.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet today.</p>
        ) : (
          <DataTable>
            <thead className="border-b border-border text-left">
              <tr>
                <th className="px-0 py-3 pr-4 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Time</th>
                <th className="px-4 py-3 font-medium">Distance</th>
                <th className="py-3 pl-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-muted/30">
                  <td className="py-3 pr-4 font-medium">{r.teacherName}</td>
                  <td className="px-4 py-3 text-muted-foreground">{formatTime(r.checkedInAt)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{r.distanceMeters}m</td>
                  <td className="py-3 pl-4">
                    {r.manualOverride ? (
                      <span className="text-xs font-medium text-amber-800">Manual override</span>
                    ) : r.geofencePassed ? (
                      <span className="text-xs font-medium text-emerald-800">On-site</span>
                    ) : (
                      <span className="text-xs font-medium text-muted-foreground">Unknown</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </DataTable>
        )}
      </PageSection>
    </PageShell>
  );
}
