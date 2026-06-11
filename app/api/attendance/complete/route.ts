import { NextRequest, NextResponse } from "next/server";

import { completeCheckInSchema } from "@/lib/schemas/attendance";
import { completeCheckInWithToken } from "@/lib/services/attendance";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = completeCheckInSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await completeCheckInWithToken(
      parsed.data.token,
      parsed.data.latitude,
      parsed.data.longitude,
      parsed.data.manualOverride,
    );

    if (!result.ok) {
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

      if (result.code === "EXPIRED_TOKEN") {
        return NextResponse.json(
          { success: false, code: result.code, error: "This link has expired. Request a new one." },
          { status: 410 },
        );
      }

      if (result.code === "USED_TOKEN") {
        return NextResponse.json(
          { success: false, code: result.code, error: "This link has already been used." },
          { status: 410 },
        );
      }

      return NextResponse.json(
        { success: false, code: result.code, error: "Invalid or expired check-in link." },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result.record }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Check-in failed";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
