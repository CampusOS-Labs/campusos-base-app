"use client";

import { Button } from "@/components/ui/button";

export default function LoginError({
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
        An unexpected error occurred while loading the sign-in page.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
