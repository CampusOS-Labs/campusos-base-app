"use client";

import { useCallback, useEffect, useState } from "react";
import { ArrowsClockwiseIcon, CalendarCheckIcon, UsersIcon } from "@phosphor-icons/react";
import { toast } from "sonner";

import { trackAuthEvent } from "@/lib/analytics/track-event-client";
import { formatTimeIST } from "@/lib/format";
import {
  ATTENDANCE_REFRESHED,
  PAGE_VIEW,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events";
import {
  DataTable,
  MetricStrip,
  PageHeader,
  PageSection,
  PageShell,
} from "@/components/page-layout";
import { EmptyState } from "@/components/empty-state";
import { StatusBanner } from "@/components/status-banner";
import { WizardStep, WizardStepBadge } from "@/components/wizard-step";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

import { CheckInQrPanel } from "./components/check-in-qr-panel";
import { CheckInStatusBadge } from "./components/check-in-status-badge";

type AttendanceRecord = {
  id: string;
  teacherId: string;
  teacherName: string;
  checkedInAt: string;
  checkedOutAt: string | null;
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

function formatTodayLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());
}

export function AttendanceClient({ initialSummary }: { initialSummary: Summary }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState<Summary>(initialSummary);
  const [url, setUrl] = useState("");

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/attendance/today");
      const json = await res.json();
      if (!json.success) throw new Error(json.error || "Could not load attendance");
      setSummary(json.data);
      trackAuthEvent(ATTENDANCE_REFRESHED);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load attendance");
    } finally {
      setLoading(false);
    }
  }, []);

  const copyLink = useCallback(async () => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Check-in link copied");
    } catch {
      toast.error("Could not copy link");
    }
  }, [url]);

  useEffect(() => {
    setUrl(checkInUrl());
    trackAuthEvent(PAGE_VIEW, { page: PRODUCT_PAGES.attendance });
  }, []);

  const records = summary.records;
  const pending = summary.pending;
  const onSite = records.filter((record) => !record.checkedOutAt);
  const totalTeachers = summary.teachers.length;
  const allCheckedIn = totalTeachers > 0 && pending.length === 0;

  return (
    <PageShell className="space-y-8">
      <PageHeader
        title="Attendance"
        description={`${formatTodayLabel()} · Teachers scan the QR, select their name, and check in on the website.`}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="ui-press"
            onClick={fetchSummary}
            disabled={loading}
          >
            <ArrowsClockwiseIcon
              className={`size-4 ${loading ? "animate-spin" : ""}`}
              weight="duotone"
            />
            Refresh
          </Button>
        }
      />

      <MetricStrip
        metrics={[
          { value: records.length, label: "Checked in today" },
          { value: onSite.length, label: "Still on-site" },
          { value: pending.length, label: "Not yet checked in" },
        ]}
      />

      {error ? <StatusBanner variant="error">{error}</StatusBanner> : null}

      {allCheckedIn ? (
        <StatusBanner variant="success">
          All teachers have checked in for today.
        </StatusBanner>
      ) : null}

      <WizardStep
        step={1}
        title="Check-in QR code"
        description="Display this at the entrance so teachers can start the flow."
      >
        <CheckInQrPanel url={url} onCopy={copyLink} />
      </WizardStep>

      {pending.length > 0 ? (
        <WizardStep
          step={2}
          title="Not checked in yet"
          description="These teachers haven't completed check-in today."
          badge={<WizardStepBadge>{pending.length} waiting</WizardStepBadge>}
        >
          <div className="flex flex-wrap gap-2">
            {pending.map((teacher) => (
              <Badge key={teacher.id} variant="outline" className="font-normal">
                {teacher.name}
              </Badge>
            ))}
          </div>
        </WizardStep>
      ) : null}

      <PageSection
        title="Today's check-ins"
        description={
          records.length > 0
            ? `${records.length} check-in${records.length === 1 ? "" : "s"} recorded today.`
            : "Check-ins will appear here as teachers complete the flow."
        }
      >
        {records.length === 0 ? (
          <EmptyState
            icon={<CalendarCheckIcon className="size-12" weight="duotone" />}
            title="No check-ins yet"
            description="Teachers haven't completed check-in today."
          />
        ) : (
          <DataTable>
            <thead className="border-b border-border text-left text-muted-foreground">
              <tr>
                <th className="py-3 pr-4 font-medium">
                  <span className="inline-flex items-center gap-1.5">
                    <UsersIcon className="size-3.5" weight="duotone" />
                    Teacher
                  </span>
                </th>
                <th className="px-4 py-3 font-medium">Check-in</th>
                <th className="px-4 py-3 font-medium">Check-out</th>
                <th className="px-4 py-3 font-medium">Distance</th>
                <th className="py-3 pl-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.map((record) => (
                <tr
                  key={record.id}
                  className="transition-colors duration-150 ease-out hover:bg-muted/30"
                >
                  <td className="py-3.5 pr-4 font-medium">{record.teacherName}</td>
                  <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                    {formatTimeIST(record.checkedInAt)}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                    {record.checkedOutAt ? formatTimeIST(record.checkedOutAt) : "—"}
                  </td>
                  <td className="px-4 py-3.5 tabular-nums text-muted-foreground">
                    {record.distanceMeters}m
                  </td>
                  <td className="py-3.5 pl-4">
                    <CheckInStatusBadge record={record} />
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
