"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2 } from "lucide-react";

import {
  formatCheckInTime,
  geolocationErrorMessage,
  getPosition,
} from "@/lib/checkin/geolocation-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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
        setError(json.error || "Invalid check-in link.");
        return;
      }

      setTeacherName(json.data.teacherName);
      setState("ready");
    } catch (err) {
      setState("error");
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
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <div className="flex size-14 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="size-7 text-emerald-600" />
        </div>
        <h1 className="text-xl font-semibold">Checked in!</h1>
        <p className="max-w-sm text-center text-muted-foreground">
          {teacherName} · Kidzee Mundhwa
          {checkedInAt ? ` · ${formatCheckInTime(checkedInAt)}` : ""}
        </p>
      </div>
    );
  }

  if (state === "error") {
    return (
      <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4">
        <h1 className="text-xl font-semibold">Check-in unavailable</h1>
        <p className="max-w-sm text-center text-muted-foreground">{error}</p>
        {token && (
          <Button variant="outline" onClick={loadToken}>
            Try again
          </Button>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="flex min-h-svh flex-col items-center gap-6 px-4 py-8">
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <CheckCircle2 className="size-5" />
          </div>
          <h1 className="text-lg font-semibold">Complete check-in</h1>
          <p className="text-sm text-muted-foreground">Kidzee Mundhwa</p>
        </div>

        {error && state === "ready" && (
          <div className="w-full max-w-md rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
            {error}
          </div>
        )}

        <Card className="w-full max-w-md">
          <CardHeader>
            <p className="text-sm text-muted-foreground">Confirm it&apos;s you</p>
          </CardHeader>
          <CardContent className="space-y-4">
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

      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Are you at the school?</DialogTitle>
            <DialogDescription>
              Your location doesn&apos;t appear to be at Kidzee Mundhwa
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
