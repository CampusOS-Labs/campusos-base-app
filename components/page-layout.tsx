import { cn } from "@/lib/utils";

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-10 pb-12", className)}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold tracking-tight font-heading">{title}</h1>
        {description ? (
          <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  );
}

export function MetricStrip({
  metrics,
}: {
  metrics: Array<{ value: React.ReactNode; label: string }>;
}) {
  const columnClass =
    metrics.length === 1
      ? "grid-cols-1"
      : metrics.length === 2
        ? "grid-cols-2"
        : "sm:grid-cols-3";

  return (
    <div className={cn("grid gap-3", columnClass)}>
      {metrics.map((metric, index) => (
        <div
          key={index}
          className="rounded-xl border border-border/80 bg-card px-4 py-4 shadow-xs ring-1 ring-foreground/[0.04]"
        >
          <p className="text-2xl font-semibold tracking-tight font-heading tabular-nums">
            {metric.value}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{metric.label}</p>
        </div>
      ))}
    </div>
  );
}

export function PageSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || description || action ? (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-medium tracking-tight">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-card shadow-xs ring-1 ring-foreground/[0.04] [&_th]:px-4 [&_td]:px-4 [&_th:first-child]:pl-4 [&_td:first-child]:pl-4">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function ListRow({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 border-t border-border px-1 py-3 transition-colors duration-150 ease-out first:border-t-0 hover:bg-muted/40",
        className,
      )}
    >
      {children}
    </div>
  );
}
