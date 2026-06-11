import { NextResponse } from "next/server";

import {
  getTodayCheckedInTeacherIds,
  listTeachers,
} from "@/lib/services/attendance";

export async function GET() {
  try {
    const checkedInToday = await getTodayCheckedInTeacherIds();
    return NextResponse.json({
      success: true,
      data: {
        teachers: listTeachers(),
        checkedInToday,
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not load check-in status";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
