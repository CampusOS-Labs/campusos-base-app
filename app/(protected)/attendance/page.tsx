import type { Metadata } from "next";
import { headers } from "next/headers";

import { getTodayAttendanceSummary } from "@/lib/services/attendance";
import { AttendanceClient } from "./attendance-client";

export const metadata: Metadata = {
  title: "Attendance",
  description: "Teacher check-in status and QR code for Schools.",
};

export default async function AttendancePage() {
  await headers();
  const summary = await getTodayAttendanceSummary();
  return <AttendanceClient initialSummary={summary} />;
}
