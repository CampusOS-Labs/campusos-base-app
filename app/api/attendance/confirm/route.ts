import { NextRequest, NextResponse } from "next/server";

import { getTokenStatus } from "@/lib/services/attendance";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token")?.trim();

  if (!token) {
    return NextResponse.json({ success: false, error: "Token is required" }, { status: 400 });
  }

  try {
    const status = await getTokenStatus(token);

    if (!status.ok) {
      const messages: Record<typeof status.code, string> = {
        NOT_FOUND: "Invalid check-in link.",
        EXPIRED: "This link has expired. Request a new one from the check-in page.",
        USED: "This link has already been used.",
      };

      return NextResponse.json(
        { success: false, code: status.code, error: messages[status.code] },
        { status: status.code === "NOT_FOUND" ? 404 : 410 },
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        teacherId: status.teacherId,
        teacherName: status.teacherName,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not validate link";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
