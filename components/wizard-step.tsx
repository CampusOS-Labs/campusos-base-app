import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type WizardStepProps = {
  step: number;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  disabled?: boolean;
  children: React.ReactNode;
  className?: string;
};

export function WizardStep({
  step,
  title,
  description,
  badge,
  disabled,
  children,
  className,
}: WizardStepProps) {
  return (
    <section
      className={cn(
        "rounded-xl border border-border/80 bg-card shadow-xs ring-1 ring-foreground/[0.04] transition-opacity duration-200 ease-out",
        disabled && "pointer-events-none opacity-50",
        className,
      )}
      aria-disabled={disabled || undefined}
    >
      <div className="flex items-start gap-3 border-b border-border/60 px-5 py-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold tabular-nums text-primary">
          {step}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-medium tracking-tight">{title}</h2>
            {badge}
          </div>
          {description ? (
            <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
      </div>
      <div className="px-5 py-5">{children}</div>
    </section>
  );
}

export function WizardStepBadge({
  children,
  variant = "secondary",
}: {
  children: React.ReactNode;
  variant?: "default" | "secondary" | "outline";
}) {
  return (
    <Badge variant={variant} className="font-normal">
      {children}
    </Badge>
  );
}
