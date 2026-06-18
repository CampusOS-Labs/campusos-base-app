import { TEACHERS, getTeacherById } from "@/lib/config/teachers";

export type AttendanceRecord = {
  id: string;
  teacherId: string;
  teacherName: string;
  checkedInAt: string;
  latitude: number;
  longitude: number;
  distanceMeters: number;
  geofencePassed: boolean;
  manualOverride: boolean;
};

export async function teacherHasAttendanceToday(_teacherId: string): Promise<boolean> {
  return false;
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  return [];
}

export async function getTodayCheckInStatus(): Promise<{ checkedInToday: string[] }> {
  return { checkedInToday: [] };
}

export type CheckInInput = {
  teacherId: string;
  latitude: number;
  longitude: number;
  manualOverride?: boolean;
};

export type CheckInResult =
  | { ok: true; record: AttendanceRecord }
  | { ok: false; code: "UNKNOWN_TEACHER" | "ALREADY_CHECKED_IN" | "OUTSIDE_GEOFENCE"; distanceMeters?: number };

export async function checkInTeacher(input: CheckInInput): Promise<CheckInResult> {
  const teacher = getTeacherById(input.teacherId);
  if (!teacher) {
    return { ok: false, code: "UNKNOWN_TEACHER" };
  }

  return { ok: false, code: "ALREADY_CHECKED_IN" };
}

export function listTeachers() {
  return TEACHERS.map((t) => ({ id: t.id, name: t.name }));
}

export async function getTodayAttendanceSummary() {
  return { records: [], pending: listTeachers(), teachers: listTeachers() };
}
