import { NextRequest, NextResponse } from "next/server";

import { SCHOOL_ID } from "@/lib/constants";
import { checkInSchema } from "@/lib/schemas/attendance";
import { checkInTeacher, getTodayCheckInStatus, listTeachers } from "@/lib/services/attendance";
import {
  CHECKIN_COMPLETED,
  CHECKIN_FAILED,
} from "@/lib/services/product-analytics-events";
import { trackProductEvent } from "@/lib/services/product-analytics";

export async function GET() {
  try {
    const { checkedInToday, checkedOutToday } = await getTodayCheckInStatus();
    return NextResponse.json({
      success: true,
      data: {
        teachers: listTeachers(),
        checkedInToday,
        checkedOutToday,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load check-in status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = checkInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await checkInTeacher(parsed.data);

    if (!result.ok) {
      trackProductEvent({
        schoolId: SCHOOL_ID,
        userId: null,
        event: CHECKIN_FAILED,
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

      if (result.code === "ALREADY_CHECKED_IN") {
        return NextResponse.json(
          { success: false, code: result.code, error: "Already checked in today." },
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
      event: CHECKIN_COMPLETED,
      properties: {
        teacherId: result.record.teacherId,
        manualOverride: result.record.manualOverride,
      },
    });

    return NextResponse.json({ success: true, data: result.record }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check-in failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
