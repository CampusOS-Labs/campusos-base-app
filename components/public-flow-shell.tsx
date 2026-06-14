import { cn } from "@/lib/utils";
import { OrgBrand } from "@/components/org-brand";

export function PublicFlowShell({
  title,
  description,
  children,
  footer,
  className,
}: {
  title?: React.ReactNode;
  description?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "relative flex min-h-svh flex-col items-center justify-center gap-6 overflow-hidden px-4 py-10",
        "bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,var(--brand-glow),transparent)] bg-muted/40",
        className,
      )}
    >
      <div className="flex w-full max-w-md flex-col items-center gap-6">
        <OrgBrand variant="public" />
        {(title || description) && (
          <div className="space-y-1 text-center">
            {title ? <h1 className="text-xl font-semibold tracking-tight">{title}</h1> : null}
            {description ? (
              <p className="text-sm text-muted-foreground">{description}</p>
            ) : null}
          </div>
        )}
        {children}
        {footer ? (
          <p className="text-center text-xs text-muted-foreground">{footer}</p>
        ) : null}
      </div>
    </div>
  );
}
