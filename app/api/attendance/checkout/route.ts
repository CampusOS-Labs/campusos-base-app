import { NextRequest, NextResponse } from "next/server";

import { SCHOOL_ID } from "@/lib/constants";
import { checkOutSchema } from "@/lib/schemas/attendance";
import { checkOutTeacher } from "@/lib/services/attendance";
import {
  CHECKOUT_COMPLETED,
  CHECKOUT_FAILED,
} from "@/lib/services/product-analytics-events";
import { trackProductEvent } from "@/lib/services/product-analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkOutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await checkOutTeacher(parsed.data);

    if (!result.ok) {
      trackProductEvent({
        schoolId: SCHOOL_ID,
        userId: null,
        event: CHECKOUT_FAILED,
        properties: { code: result.code, teacherId: parsed.data.teacherId },
      });

      if (result.code === "OUTSIDE_GEOFENCE") {
        return NextResponse.json(
          {
            success: false,
            code: result.code,
            distanceMeters: result.distanceMeters,
            error: "You don't appear to be at the school.",
          },
          { status: 422 },
        );
      }

      if (result.code === "ALREADY_CHECKED_OUT") {
        return NextResponse.json(
          { success: false, code: result.code, error: "Already checked out today." },
          { status: 409 },
        );
      }

      if (result.code === "NOT_CHECKED_IN") {
        return NextResponse.json(
          { success: false, code: result.code, error: "You need to check in first." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { success: false, code: result.code, error: "Unknown teacher." },
        { status: 404 },
      );
    }

    trackProductEvent({
      schoolId: SCHOOL_ID,
      userId: null,
      event: CHECKOUT_COMPLETED,
      properties: {
        teacherId: result.record.teacherId,
        manualOverride: result.record.checkoutManualOverride,
      },
    });

    return NextResponse.json({ success: true, data: result.record }, { status: 200 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check-out failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
