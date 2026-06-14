import { UsersIcon } from "@phosphor-icons/react/ssr";

import { Badge } from "@/components/ui/badge";
import { getAnnouncementTypeMeta } from "@/lib/announcement-types";
import { formatDateTimeIST } from "@/lib/format";
import { cn } from "@/lib/utils";

type HistoryEntryProps = {
  title: string;
  message: string | null;
  type: string;
  recipientCount: number;
  audienceLabel: string | null;
  createdAt: string;
};

const MESSAGE_PREVIEW_LIMIT = 180;

function MessageBody({ message }: { message: string }) {
  if (message.length <= MESSAGE_PREVIEW_LIMIT) {
    return (
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
    );
  }

  const preview = message.slice(0, MESSAGE_PREVIEW_LIMIT).trimEnd();

  return (
    <details className="group rounded-lg border border-border/60 bg-muted/15">
      <summary className="cursor-pointer list-none px-3.5 py-3 marker:content-none [&::-webkit-details-marker]:hidden">
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground group-open:hidden">
          {preview}…
        </p>
        <span className="mt-1.5 block text-xs font-medium text-primary group-open:hidden">
          Show full message
        </span>
        <span className="hidden text-xs font-medium text-primary group-open:block">
          Show less
        </span>
      </summary>
      <p className="whitespace-pre-wrap border-t border-border/60 px-3.5 py-3 text-sm leading-relaxed text-muted-foreground">
        {message}
      </p>
    </details>
  );
}

export function HistoryEntry({
  title,
  message,
  type,
  recipientCount,
  audienceLabel,
  createdAt,
}: HistoryEntryProps) {
  const meta = getAnnouncementTypeMeta(type);
  const Icon = meta.icon;

  return (
    <article className="rounded-xl border border-border/80 bg-card shadow-xs ring-1 ring-foreground/[0.04]">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border/60 px-5 py-4">
        <div className="flex min-w-0 items-start gap-3">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              meta.iconClass,
            )}
          >
            <Icon className="size-4" weight="duotone" />
          </span>
          <div className="min-w-0">
            <h3 className="font-medium tracking-tight">{title}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {formatDateTimeIST(createdAt)}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="font-normal">
            {meta.label}
          </Badge>
          <Badge variant="outline" className="gap-1.5 font-normal tabular-nums">
            <UsersIcon className="size-3" weight="duotone" />
            {recipientCount}
          </Badge>
        </div>
      </div>

      {(message || audienceLabel) && (
        <div className="space-y-3 px-5 py-4">
          {message ? <MessageBody message={message} /> : null}
          {audienceLabel ? (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <UsersIcon className="size-3.5 shrink-0" weight="duotone" />
              <span>
                Sent to <span className="font-medium text-foreground">{audienceLabel}</span>
              </span>
            </p>
          ) : null}
        </div>
      )}
    </article>
  );
}
