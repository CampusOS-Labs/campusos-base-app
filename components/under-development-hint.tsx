"use client";

import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export const FEATURE_UNDER_DEVELOPMENT_MESSAGE =
  "This feature is currently under development";

export function UnderDevelopmentHint({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <span
            className={cn("cursor-not-allowed text-muted-foreground", className)}
          />
        }
      >
        {children}
      </TooltipTrigger>
      <TooltipContent>{FEATURE_UNDER_DEVELOPMENT_MESSAGE}</TooltipContent>
    </Tooltip>
  );
}
