import { NextResponse } from "next/server";
import { headers } from "next/headers";

import { auth } from "@/lib/auth";
import { getTodayAttendanceSummary } from "@/lib/services/attendance";

export async function GET() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  try {
    const summary = await getTodayAttendanceSummary();
    return NextResponse.json({ success: true, data: summary });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load attendance";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
