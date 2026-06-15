"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AttendanceRecord = {
  manualOverride: boolean;
  geofencePassed: boolean;
  checkedOutAt: string | null;
  checkoutManualOverride?: boolean;
};

export function CheckInStatusBadge({ record }: { record: AttendanceRecord }) {
  if (record.checkedOutAt) {
    return (
      <Badge variant="outline" className="font-normal text-muted-foreground">
        Checked out
      </Badge>
    );
  }

  if (record.manualOverride) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-warning/30 bg-warning-muted font-normal text-warning-foreground",
        )}
      >
        Manual override
      </Badge>
    );
  }

  if (record.geofencePassed) {
    return (
      <Badge
        variant="secondary"
        className="bg-success-muted font-normal text-success-foreground"
      >
        On-site
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      Unknown
    </Badge>
  );
}
