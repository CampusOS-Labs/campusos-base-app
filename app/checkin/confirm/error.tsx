"use client";

import { Button } from "@/components/ui/button";

export default function ConfirmCheckInError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while confirming check-in.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
