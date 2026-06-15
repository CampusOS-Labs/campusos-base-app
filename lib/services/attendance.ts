import { and, desc, eq, gte, lte } from "drizzle-orm";

import { TEACHERS, getTeacherById } from "@/lib/config/teachers";
import { getSchoolGeofence } from "@/lib/config/school";
import { db } from "@/lib/db";
import { kidzeeMundhwaTeacherAttendance } from "@/lib/db/schema";
import { distanceMeters } from "@/lib/utils/geo";
import { getTodayRangeIST } from "@/lib/utils/ist-date";

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

function rowToRecord(row: typeof kidzeeMundhwaTeacherAttendance.$inferSelect): AttendanceRecord {
  return {
    id: row.id,
    teacherId: row.teacherId,
    teacherName: row.teacherName,
    checkedInAt: row.checkedInAt.toISOString(),
    latitude: row.latitude,
    longitude: row.longitude,
    distanceMeters: row.distanceMeters,
    geofencePassed: row.geofencePassed,
    manualOverride: row.manualOverride,
  };
}

function todayAttendanceFilters() {
  const { start, end } = getTodayRangeIST();
  return and(
    gte(kidzeeMundhwaTeacherAttendance.checkedInAt, start),
    lte(kidzeeMundhwaTeacherAttendance.checkedInAt, end),
  );
}

export async function teacherHasAttendanceToday(teacherId: string): Promise<boolean> {
  const existing = await db
    .select({ id: kidzeeMundhwaTeacherAttendance.id })
    .from(kidzeeMundhwaTeacherAttendance)
    .where(and(eq(kidzeeMundhwaTeacherAttendance.teacherId, teacherId), todayAttendanceFilters()))
    .limit(1);

  return existing.length > 0;
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const rows = await db
    .select()
    .from(kidzeeMundhwaTeacherAttendance)
    .where(todayAttendanceFilters())
    .orderBy(desc(kidzeeMundhwaTeacherAttendance.checkedInAt));

  return rows.map(rowToRecord);
}

export async function getTodayCheckInStatus(): Promise<{ checkedInToday: string[] }> {
  const records = await getTodayAttendance();
  return { checkedInToday: records.map((record) => record.teacherId) };
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

  if (await teacherHasAttendanceToday(input.teacherId)) {
    return { ok: false, code: "ALREADY_CHECKED_IN" };
  }

  const geofence = getSchoolGeofence();
  const dist = Math.round(
    distanceMeters(input.latitude, input.longitude, geofence.lat, geofence.lng),
  );
  const geofencePassed = dist <= geofence.radiusM;

  if (!geofencePassed && !input.manualOverride) {
    return { ok: false, code: "OUTSIDE_GEOFENCE", distanceMeters: dist };
  }

  const id = crypto.randomUUID();
  const [row] = await db
    .insert(kidzeeMundhwaTeacherAttendance)
    .values({
      id,
      teacherId: teacher.id,
      teacherName: teacher.name,
      latitude: input.latitude,
      longitude: input.longitude,
      distanceMeters: dist,
      geofencePassed,
      manualOverride: Boolean(input.manualOverride),
    })
    .returning();

  return { ok: true, record: rowToRecord(row) };
}

export function listTeachers() {
  return TEACHERS.map((t) => ({ id: t.id, name: t.name }));
}

export async function getTodayAttendanceSummary() {
  const records = await getTodayAttendance();
  const attendedIds = new Set(records.map((r) => r.teacherId));
  const pending = TEACHERS.filter((t) => !attendedIds.has(t.id)).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return { records, pending, teachers: listTeachers() };
}
