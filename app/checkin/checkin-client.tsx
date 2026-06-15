"use client";

import { useCallback, useEffect, useState } from "react";

import { trackPublicEvent } from "@/lib/analytics/track-event-client";
import {
  geolocationErrorMessage,
  getPosition,
} from "@/lib/checkin/geolocation-client";
import { ORG_BRANCH_NAME } from "@/lib/constants";
import {
  CHECKIN_FAILED,
  PAGE_VIEW,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events";
import { PublicFlowShell } from "@/components/public-flow-shell";
import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";

type Teacher = { id: string; name: string };

type TeacherActionState = "idle" | "locating" | "submitting";

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
  const [actionState, setActionState] = useState<TeacherActionState>("idle");
  const [pageError, setPageError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [pendingCheckIn, setPendingCheckIn] = useState<{
    teacherId: string;
    lat: number;
    lng: number;
  } | null>(null);
  const [overrideDistance, setOverrideDistance] = useState<number | null>(null);

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

  const submitCheckIn = useCallback(
    async (teacherId: string, latitude: number, longitude: number, manualOverride = false) => {
      setActiveTeacherId(teacherId);
      setActionState("submitting");
      setPageError("");

      try {
        const res = await fetch("/api/attendance/checkin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ teacherId, latitude, longitude, manualOverride }),
        });
        const json = await res.json();

        if (res.status === 422 && json.code === "OUTSIDE_GEOFENCE") {
          setPendingCheckIn({ teacherId, lat: latitude, lng: longitude });
          setOverrideDistance(json.distanceMeters ?? null);
          setOverrideOpen(true);
          setActionState("idle");
          setActiveTeacherId(null);
          return;
        }

        if (!json.success) {
          throw new Error(json.error || "Check-in failed");
        }

        setCheckedInToday((prev) => new Set([...prev, teacherId]));
      } catch (err) {
        trackPublicEvent(CHECKIN_FAILED, { reason: "submit_failed" });
        setPageError(err instanceof Error ? err.message : "Something went wrong");
      } finally {
        setActionState("idle");
        setActiveTeacherId(null);
      }
    },
    [],
  );

  const handleCheckIn = useCallback(
    async (teacherId: string) => {
      setActiveTeacherId(teacherId);
      setActionState("locating");
      setPageError("");

      try {
        const position = await getPosition();
        await submitCheckIn(
          teacherId,
          position.coords.latitude,
          position.coords.longitude,
          false,
        );
      } catch (err) {
        trackPublicEvent(CHECKIN_FAILED, { reason: "geolocation_failed" });
        setPageError(geolocationErrorMessage(err as GeolocationPositionError | Error));
        setActionState("idle");
        setActiveTeacherId(null);
      }
    },
    [submitCheckIn],
  );

  const handleOverrideConfirm = useCallback(async () => {
    if (!pendingCheckIn) return;
    setOverrideOpen(false);
    await submitCheckIn(
      pendingCheckIn.teacherId,
      pendingCheckIn.lat,
      pendingCheckIn.lng,
      true,
    );
    setPendingCheckIn(null);
    setOverrideDistance(null);
  }, [pendingCheckIn, submitCheckIn]);

  if (error) {
    return (
      <PublicFlowShell title="Could not load check-in" description={error}>
        <Button variant="outline" onClick={fetchStatus}>
          Try again
        </Button>
      </PublicFlowShell>
    );
  }

  return (
    <>
      <PublicFlowShell
        title="Teacher check-in"
        description="Select your name to check in for today"
        footer={refreshing ? "Refreshing…" : undefined}
      >
        <div className="flex w-full flex-col gap-3">
          {pageError && <StatusBanner variant="warning">{pageError}</StatusBanner>}

          <Card className="w-full">
            <CardContent className="space-y-2 pt-6">
              {teachers.map((teacher) => {
                const checkedIn = checkedInToday.has(teacher.id);
                const isBusy = activeTeacherId === teacher.id && actionState !== "idle";

                return (
                  <div
                    key={teacher.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-border/70 bg-background/80 px-3 py-3 transition-colors duration-150 ease-out hover:bg-muted/30"
                  >
                    <div className="min-w-0">
                      <p className="font-medium">{teacher.name}</p>
                      {checkedIn && (
                        <p className="text-xs text-success">Checked in today</p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      disabled={checkedIn || (actionState !== "idle" && !isBusy)}
                      onClick={() => handleCheckIn(teacher.id)}
                    >
                      {isBusy ? (
                        <>
                          <Spinner className="mr-1.5" />
                          {actionState === "locating" ? "Getting location..." : "Checking in..."}
                        </>
                      ) : checkedIn ? (
                        "Done"
                      ) : (
                        "Check In"
                      )}
                    </Button>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </PublicFlowShell>

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Are you at the school?</DialogTitle>
            <DialogDescription>
              Your location doesn&apos;t appear to be at {ORG_BRANCH_NAME}
              {overrideDistance != null ? ` (about ${overrideDistance}m away)` : ""}. If you are on
              campus and GPS is wrong, you can still continue.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOverrideOpen(false);
                setPendingCheckIn(null);
                setOverrideDistance(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleOverrideConfirm}>Yes, check me in</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
