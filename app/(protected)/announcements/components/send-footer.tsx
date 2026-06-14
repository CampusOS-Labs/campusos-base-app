"use client";

import { PaperPlaneTiltIcon } from "@phosphor-icons/react";

import { StatusBanner } from "@/components/status-banner";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type Props = {
  statusSummary: string;
  statusIsError: boolean;
  sending: boolean;
  totalRecipientCount: number;
  canSend: boolean;
  onSend: () => Promise<void>;
};

export function SendFooter({
  statusSummary,
  statusIsError,
  sending,
  totalRecipientCount,
  canSend,
  onSend,
}: Props) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 -mx-4 border-t border-border/80 bg-background/90 px-4 py-4 backdrop-blur-md md:-mx-6",
      )}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3">
        {statusIsError ? (
          <StatusBanner variant="error" className="ui-enter">
            {statusSummary}
          </StatusBanner>
        ) : sending ? (
          <StatusBanner variant="info" className="ui-enter">
            {statusSummary}
          </StatusBanner>
        ) : statusSummary && statusSummary !== "Ready." ? (
          <p className="text-sm text-muted-foreground">{statusSummary}</p>
        ) : null}

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {totalRecipientCount > 0
              ? `${totalRecipientCount} recipient${totalRecipientCount === 1 ? "" : "s"} selected`
              : "Choose an audience to continue"}
          </p>
          <Button
            className="h-11 w-full sm:w-auto sm:min-w-[12rem]"
            onClick={onSend}
            disabled={sending || !canSend}
          >
            {sending ? <Spinner /> : <PaperPlaneTiltIcon weight="fill" />}
            {sending ? "Sending…" : "Send announcement"}
          </Button>
        </div>
      </div>
    </div>
  );
}
