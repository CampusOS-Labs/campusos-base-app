import {
  ORG_BRANCH_NAME,
  ORG_DISPLAY_NAME,
  ORG_LOGO_PATH,
  ORG_PRODUCT_NAME,
} from "@/lib/constants";
import { cn } from "@/lib/utils";

const logoSizeClass = {
  sidebar: "h-8 w-auto max-w-[6.5rem]",
  compact: "h-7 w-auto max-w-[1.75rem]",
  public: "h-14 w-auto max-w-[11rem]",
  login: "h-10 w-auto max-w-[8rem]",
} as const;

function OrgLogo({
  variant,
  className,
}: {
  variant: keyof typeof logoSizeClass;
  className?: string;
}) {
  return (
    // Static public asset — plain img avoids prod-only next/image optimizer failures.
    <img
      src={ORG_LOGO_PATH}
      alt={`${ORG_DISPLAY_NAME} logo`}
      className={cn("shrink-0 object-contain", logoSizeClass[variant], className)}
      fetchPriority="high"
      decoding="async"
    />
  );
}

type OrgBrandProps = {
  variant?: keyof typeof logoSizeClass;
  showProductName?: boolean;
  className?: string;
};

export function OrgBrand({
  variant = "sidebar",
  showProductName = true,
  className,
}: OrgBrandProps) {
  const logo = (
    <OrgLogo
      variant={variant}
      className={
        variant === "sidebar"
          ? "group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:max-w-[1.75rem]"
          : undefined
      }
    />
  );

  if (variant === "compact") {
    return <div className={cn("flex items-center justify-center", className)}>{logo}</div>;
  }

  if (variant === "public") {
    return (
      <div className={cn("flex flex-col items-center gap-1.5 text-center", className)}>
        {logo}
        <p className="text-sm font-medium text-muted-foreground">{ORG_BRANCH_NAME}</p>
        {showProductName ? (
          <p className="text-xs text-muted-foreground/80">{ORG_PRODUCT_NAME}</p>
        ) : null}
      </div>
    );
  }

  if (variant === "login") {
    return (
      <div className={cn("flex flex-col items-center gap-3 self-center text-center", className)}>
        {logo}
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-muted-foreground">{ORG_BRANCH_NAME}</p>
          {showProductName ? (
            <p className="text-xs text-muted-foreground/80">{ORG_PRODUCT_NAME}</p>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2.5 group-data-[collapsible=icon]:justify-center",
        className,
      )}
    >
      {logo}
      <div className="min-w-0 group-data-[collapsible=icon]:hidden">
        <p className="truncate text-sm font-medium leading-tight">{ORG_BRANCH_NAME}</p>
        {showProductName ? (
          <p className="truncate text-xs text-muted-foreground">{ORG_PRODUCT_NAME}</p>
        ) : null}
      </div>
    </div>
  );
}
