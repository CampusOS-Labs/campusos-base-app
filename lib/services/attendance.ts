import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";

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
  checkedOutAt: string | null;
  checkoutLatitude: number | null;
  checkoutLongitude: number | null;
  checkoutDistanceMeters: number | null;
  checkoutGeofencePassed: boolean | null;
  checkoutManualOverride: boolean;
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
    checkedOutAt: row.checkedOutAt?.toISOString() ?? null,
    checkoutLatitude: row.checkoutLatitude,
    checkoutLongitude: row.checkoutLongitude,
    checkoutDistanceMeters: row.checkoutDistanceMeters,
    checkoutGeofencePassed: row.checkoutGeofencePassed,
    checkoutManualOverride: row.checkoutManualOverride,
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

export async function getTodayCheckInStatus(): Promise<{
  checkedInToday: string[];
  checkedOutToday: string[];
}> {
  const records = await getTodayAttendance();
  const checkedInToday: string[] = [];
  const checkedOutToday: string[] = [];

  for (const record of records) {
    if (record.checkedOutAt) {
      checkedOutToday.push(record.teacherId);
    } else {
      checkedInToday.push(record.teacherId);
    }
  }

  return { checkedInToday, checkedOutToday };
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

export type CheckOutInput = {
  teacherId: string;
  latitude: number;
  longitude: number;
  manualOverride?: boolean;
};

export type CheckOutResult =
  | { ok: true; record: AttendanceRecord }
  | {
      ok: false;
      code:
        | "UNKNOWN_TEACHER"
        | "NOT_CHECKED_IN"
        | "ALREADY_CHECKED_OUT"
        | "OUTSIDE_GEOFENCE";
      distanceMeters?: number;
    };

export async function checkOutTeacher(input: CheckOutInput): Promise<CheckOutResult> {
  const teacher = getTeacherById(input.teacherId);
  if (!teacher) {
    return { ok: false, code: "UNKNOWN_TEACHER" };
  }

  const [openRecord] = await db
    .select()
    .from(kidzeeMundhwaTeacherAttendance)
    .where(
      and(
        eq(kidzeeMundhwaTeacherAttendance.teacherId, input.teacherId),
        todayAttendanceFilters(),
        isNull(kidzeeMundhwaTeacherAttendance.checkedOutAt),
      ),
    )
    .limit(1);

  if (!openRecord) {
    const [completedRecord] = await db
      .select({ id: kidzeeMundhwaTeacherAttendance.id })
      .from(kidzeeMundhwaTeacherAttendance)
      .where(
        and(
          eq(kidzeeMundhwaTeacherAttendance.teacherId, input.teacherId),
          todayAttendanceFilters(),
        ),
      )
      .limit(1);

    if (completedRecord) {
      return { ok: false, code: "ALREADY_CHECKED_OUT" };
    }

    return { ok: false, code: "NOT_CHECKED_IN" };
  }

  const geofence = getSchoolGeofence();
  const dist = Math.round(
    distanceMeters(input.latitude, input.longitude, geofence.lat, geofence.lng),
  );
  const geofencePassed = dist <= geofence.radiusM;

  if (!geofencePassed && !input.manualOverride) {
    return { ok: false, code: "OUTSIDE_GEOFENCE", distanceMeters: dist };
  }

  const [row] = await db
    .update(kidzeeMundhwaTeacherAttendance)
    .set({
      checkedOutAt: new Date(),
      checkoutLatitude: input.latitude,
      checkoutLongitude: input.longitude,
      checkoutDistanceMeters: dist,
      checkoutGeofencePassed: geofencePassed,
      checkoutManualOverride: Boolean(input.manualOverride),
    })
    .where(eq(kidzeeMundhwaTeacherAttendance.id, openRecord.id))
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
