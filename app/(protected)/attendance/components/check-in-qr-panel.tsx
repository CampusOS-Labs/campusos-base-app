"use client";

import QRCode from "react-qr-code";
import { CopyIcon } from "@phosphor-icons/react";

import { Button } from "@/components/ui/button";

const CHECK_IN_STEPS = [
  "Teacher scans this QR at the entrance.",
  "They select their name on the check-in page.",
  "They tap Check In when arriving and Check Out when leaving.",
] as const;

type Props = {
  url: string;
  onCopy: () => void;
};

export function CheckInQrPanel({ url, onCopy }: Props) {
  return (
    <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
      <div className="mx-auto flex shrink-0 flex-col items-center gap-3 rounded-xl border border-dashed border-border/80 bg-muted/15 px-5 py-5 lg:mx-0">
        {url ? (
          <>
            <div className="rounded-lg bg-white p-3 shadow-xs ring-1 ring-foreground/[0.04]">
              <QRCode value={url} size={168} />
            </div>
            <p className="max-w-[220px] text-center text-xs text-muted-foreground">
              Print or display at the entrance
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">Loading check-in link…</p>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-4">
        <ol className="space-y-3">
          {CHECK_IN_STEPS.map((step, index) => (
            <li key={step} className="flex items-start gap-3 text-sm">
              <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
                {index + 1}
              </span>
              <span className="pt-0.5 leading-relaxed text-muted-foreground">{step}</span>
            </li>
          ))}
        </ol>

        <Button
          variant="outline"
          size="sm"
          className="ui-press w-fit"
          onClick={onCopy}
          disabled={!url}
        >
          <CopyIcon className="size-4" weight="duotone" />
          Copy check-in link
        </Button>
      </div>
    </div>
  );
}
