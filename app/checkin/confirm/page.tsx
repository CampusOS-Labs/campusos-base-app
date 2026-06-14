"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

import { trackPublicEvent } from "@/lib/analytics/track-event-client";
import {
  CHECKIN_FAILED,
  PAGE_VIEW,
  PRODUCT_PAGES,
} from "@/lib/services/product-analytics-events";

import {
  formatCheckInTime,
  geolocationErrorMessage,
  getPosition,
} from "@/lib/checkin/geolocation-client";
import { ORG_BRANCH_NAME } from "@/lib/constants";
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

type ConfirmState = "loading" | "ready" | "locating" | "submitting" | "success" | "error";

function ConfirmCheckInInner() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token")?.trim() ?? "";

  const [state, setState] = useState<ConfirmState>("loading");
  const [teacherName, setTeacherName] = useState("");
  const [error, setError] = useState("");
  const [checkedInAt, setCheckedInAt] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [pendingCoords, setPendingCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [overrideDistance, setOverrideDistance] = useState<number | null>(null);

  const loadToken = useCallback(async () => {
    if (!token) {
      setState("error");
      setError("Missing check-in link. Scan the QR code at school and request a new link.");
      return;
    }

    setState("loading");
    setError("");

    try {
      const res = await fetch(`/api/attendance/confirm?token=${encodeURIComponent(token)}`);
      const json = await res.json();

      if (!json.success) {
        setState("error");
        trackPublicEvent(CHECKIN_FAILED, { reason: "invalid_token" });
        setError(json.error || "Invalid check-in link.");
        return;
      }

      setTeacherName(json.data.teacherName);
      setState("ready");
      trackPublicEvent(PAGE_VIEW, { page: PRODUCT_PAGES.checkinConfirm });
    } catch (err) {
      setState("error");
      trackPublicEvent(CHECKIN_FAILED, { reason: "token_load_failed" });
      setError(err instanceof Error ? err.message : "Could not load check-in link.");
    }
  }, [token]);

  useEffect(() => {
    loadToken();
  }, [loadToken]);

  const submitCheckIn = useCallback(
    async (latitude: number, longitude: number, manualOverride = false) => {
      setState("submitting");
      setError("");

      try {
        const res = await fetch("/api/attendance/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, latitude, longitude, manualOverride }),
        });
        const json = await res.json();

        if (res.status === 422 && json.code === "OUTSIDE_GEOFENCE") {
          setPendingCoords({ lat: latitude, lng: longitude });
          setOverrideDistance(json.distanceMeters ?? null);
          setOverrideOpen(true);
          setState("ready");
          return;
        }

      if (!json.success) {
        throw new Error(json.error || "Check-in failed");
      }

      setCheckedInAt(json.data.checkedInAt);
      setState("success");
    } catch (err) {
      setState("error");
      trackPublicEvent(CHECKIN_FAILED, { reason: "checkin_submit_failed" });
      setError(err instanceof Error ? err.message : "Check-in failed");
      }
    },
    [token],
  );

  const handleCheckIn = useCallback(async () => {
    setState("locating");
    setError("");

    try {
      const position = await getPosition();
      await submitCheckIn(position.coords.latitude, position.coords.longitude, false);
    } catch (err) {
      setState("ready");
      trackPublicEvent(CHECKIN_FAILED, { reason: "geolocation_failed" });
      setError(geolocationErrorMessage(err as GeolocationPositionError | Error));
    }
  }, [submitCheckIn]);

  const handleOverrideConfirm = useCallback(async () => {
    if (!pendingCoords) return;
    setOverrideOpen(false);
    await submitCheckIn(pendingCoords.lat, pendingCoords.lng, true);
    setPendingCoords(null);
    setOverrideDistance(null);
  }, [pendingCoords, submitCheckIn]);

  if (state === "loading") {
    return (
      <div className="flex min-h-svh items-center justify-center">
        <Spinner className="size-8" />
      </div>
    );
  }

  if (state === "success") {
    return (
      <PublicFlowShell
        title="Checked in!"
        description={`${teacherName} · ${ORG_BRANCH_NAME}${checkedInAt ? ` · ${formatCheckInTime(checkedInAt)}` : ""}`}
      />
    );
  }

  if (state === "error") {
    return (
      <PublicFlowShell title="Check-in unavailable" description={error}>
        {token ? (
          <Button variant="outline" onClick={loadToken}>
            Try again
          </Button>
        ) : null}
      </PublicFlowShell>
    );
  }

  return (
    <>
      <PublicFlowShell title="Complete check-in" description="Confirm it's you, then tap check in">
        <div className="flex w-full flex-col gap-3">
          {error && state === "ready" && (
            <StatusBanner variant="warning">{error}</StatusBanner>
          )}

          <Card className="w-full">
            <CardContent className="space-y-4 pt-6">
              <p className="text-center text-lg font-medium">{teacherName}</p>
              <Button
                className="h-12 w-full text-base font-semibold"
                onClick={handleCheckIn}
                disabled={state === "locating" || state === "submitting"}
              >
                {state === "locating" || state === "submitting" ? (
                  <>
                    <Spinner className="mr-2" />
                    {state === "locating" ? "Getting location..." : "Checking in..."}
                  </>
                ) : (
                  "Check In"
                )}
              </Button>
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
              campus and GPS is wrong, you can still check in.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setOverrideOpen(false);
                setPendingCoords(null);
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

export default function ConfirmCheckInPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-svh items-center justify-center">
          <Spinner className="size-8" />
        </div>
      }
    >
      <ConfirmCheckInInner />
    </Suspense>
  );
}
