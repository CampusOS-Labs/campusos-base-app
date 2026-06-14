import type { Metadata } from "next";
import { headers } from "next/headers";

import { getTodayCheckInStatus, listTeachers } from "@/lib/services/attendance";
import { CheckInClient } from "./checkin-client";

export const metadata: Metadata = {
  title: "Teacher Check-In",
  description: "Check in at Kidzee Vadgaon Sheri by selecting your name and confirming your location.",
};

export default async function CheckInPage() {
  await headers();
  const [teachers, status] = await Promise.all([
    Promise.resolve(listTeachers()),
    getTodayCheckInStatus(),
  ]);

  return (
    <CheckInClient
      initialTeachers={teachers}
      initialCheckedInToday={status.checkedInToday}
    />
  );
}
