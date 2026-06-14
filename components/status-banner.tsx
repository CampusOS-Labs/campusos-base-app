import { cn } from "@/lib/utils";

type StatusBannerVariant = "success" | "warning" | "error" | "info";

const variantStyles: Record<StatusBannerVariant, string> = {
  success: "border-success/30 bg-success-muted text-success-foreground",
  warning: "border-warning/30 bg-warning-muted text-warning-foreground",
  error: "border-destructive/30 bg-destructive/10 text-destructive",
  info: "border-border bg-muted/50 text-foreground",
};

export function StatusBanner({
  variant = "info",
  children,
  className,
  icon,
}: {
  variant?: StatusBannerVariant;
  children: React.ReactNode;
  className?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div
      role={variant === "error" || variant === "warning" ? "alert" : "status"}
      className={cn(
        "flex w-full items-start gap-3 rounded-xl border p-3.5 text-sm ui-enter",
        variantStyles[variant],
        className,
      )}
    >
      {icon ? <span className="mt-0.5 shrink-0">{icon}</span> : null}
      <span className="min-w-0">{children}</span>
    </div>
  );
}
