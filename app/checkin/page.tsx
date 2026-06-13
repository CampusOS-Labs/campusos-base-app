import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  getTodayCheckedInTeacherIds,
  listTeachers,
} from "@/lib/services/attendance";
import { CheckInClient } from "./checkin-client";

export const metadata: Metadata = {
  title: "Teacher Check-In",
  description: "Request a WhatsApp check-in link for Kidzee Mundhwa teachers.",
};

export default async function CheckInPage() {
  await headers();
  const [teachers, checkedInToday] = await Promise.all([
    Promise.resolve(listTeachers()),
    getTodayCheckedInTeacherIds(),
  ]);

  return (
    <CheckInClient initialTeachers={teachers} initialCheckedInToday={checkedInToday} />
  );
}
