import { cn } from "@/lib/utils"

export function PageShell({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={cn("mx-auto w-full max-w-4xl space-y-10 pb-12", className)}>
      {children}
    </div>
  )
}

export function PageHeader({
  title,
  description,
  actions,
  children,
}: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-3xl font-semibold font-heading">{title}</h1>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
        {children}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}

export function MetricStrip({
  metrics,
}: {
  metrics: Array<{ value: React.ReactNode; label: string }>
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-center gap-x-10 gap-y-4 border-b border-border pb-8">
      {metrics.map((metric, index) => (
        <div key={index} className="flex items-baseline gap-2.5">
          <span className="text-2xl font-semibold font-heading tabular-nums">
            {metric.value}
          </span>
          <span className="text-sm text-muted-foreground">{metric.label}</span>
        </div>
      ))}
    </div>
  )
}

export function PageSection({
  title,
  description,
  action,
  children,
  className,
}: {
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactNode
  children: React.ReactNode
  className?: string
}) {
  return (
    <section className={cn("space-y-4", className)}>
      {title || description || action ? (
        <div className="flex items-end justify-between gap-4">
          <div>
            {title ? <h2 className="text-lg font-medium">{title}</h2> : null}
            {description ? (
              <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  )
}

export function DataTable({ children }: { children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">{children}</table>
    </div>
  )
}
