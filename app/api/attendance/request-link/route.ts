import { NextRequest, NextResponse } from "next/server";

import { SCHOOL_ID } from "@/lib/constants";
import { requestCheckInLinkSchema } from "@/lib/schemas/attendance";
import { requestCheckInLink } from "@/lib/services/attendance";
import {
  CHECKIN_LINK_FAILED,
  CHECKIN_LINK_REQUESTED,
} from "@/lib/services/product-analytics-events";
import { trackProductEvent } from "@/lib/services/product-analytics";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestCheckInLinkSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" },
        { status: 400 },
      );
    }

    const result = await requestCheckInLink(parsed.data.teacherId);

    if (!result.ok) {
      trackProductEvent({
        schoolId: SCHOOL_ID,
        userId: null,
        event: CHECKIN_LINK_FAILED,
        properties: {
          teacherId: parsed.data.teacherId,
          code: result.code,
        },
      });

      if (result.code === "ALREADY_CHECKED_IN") {
        return NextResponse.json(
          { success: false, code: result.code, error: "Already checked in today." },
          { status: 409 },
        );
      }

      if (result.code === "NO_PHONE") {
        return NextResponse.json(
          { success: false, code: result.code, error: result.error },
          { status: 400 },
        );
      }

      if (result.code === "WHATSAPP_FAILED") {
        return NextResponse.json(
          {
            success: false,
            code: result.code,
            error:
              "Could not send check-in link. Ask admin to reconnect WhatsApp, then try again.",
          },
          { status: 502 },
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
      event: CHECKIN_LINK_REQUESTED,
      properties: { teacherId: parsed.data.teacherId },
    });

    return NextResponse.json({
      success: true,
      message: "Check your WhatsApp for a link to complete check-in.",
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send check-in link";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
