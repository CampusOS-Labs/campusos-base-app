"use client";

import { Button } from "@/components/ui/button";

export default function PayInvoiceError({
  _error,
  reset,
}: {
  _error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-full bg-destructive/10">
        <svg
          className="size-7 text-destructive"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 3.75h.008v.008H12v-.008Z"
          />
        </svg>
      </div>
      <h1 className="text-xl font-semibold">Something went wrong</h1>
      <p className="max-w-sm text-center text-sm text-muted-foreground">
        An error occurred while loading this invoice. Please try again.
      </p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
