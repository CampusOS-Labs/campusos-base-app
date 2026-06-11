import { and, desc, eq, gte, isNull, lte } from "drizzle-orm";

import { TEACHERS, getTeacherById } from "@/lib/config/teachers";
import { getSchoolGeofence } from "@/lib/config/school";
import { db } from "@/lib/db";
import { kidzeeMundhwaCheckInToken, kidzeeMundhwaTeacherAttendance } from "@/lib/db/schema";
import { whatsAppManager } from "@/lib/services/whatsapp";
import { distanceMeters } from "@/lib/utils/geo";
import { getTodayRangeIST } from "@/lib/utils/ist-date";
import { normalizePhone } from "@/lib/utils/phone";

const TOKEN_TTL_MS = 10 * 60 * 1000;

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

export type TokenStatus =
  | { ok: true; teacherId: string; teacherName: string }
  | { ok: false; code: "NOT_FOUND" | "EXPIRED" | "USED" };

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

function checkInBaseUrl(): string {
  const base = process.env.NEXT_PUBLIC_APP_URL?.trim() || "http://localhost:3000";
  return base.replace(/\/$/, "");
}

function whatsAppInstanceName(): string {
  return process.env.EVOLUTION_INSTANCE_NAME?.trim() || "primary";
}

export async function teacherAlreadyCheckedInToday(teacherId: string): Promise<boolean> {
  const { start, end } = getTodayRangeIST();
  const existing = await db
    .select({ id: kidzeeMundhwaTeacherAttendance.id })
    .from(kidzeeMundhwaTeacherAttendance)
    .where(
      and(
        eq(kidzeeMundhwaTeacherAttendance.teacherId, teacherId),
        gte(kidzeeMundhwaTeacherAttendance.checkedInAt, start),
        lte(kidzeeMundhwaTeacherAttendance.checkedInAt, end),
      ),
    )
    .limit(1);

  return existing.length > 0;
}

export async function getTodayAttendance(): Promise<AttendanceRecord[]> {
  const { start, end } = getTodayRangeIST();

  const rows = await db
    .select()
    .from(kidzeeMundhwaTeacherAttendance)
    .where(
      and(
        gte(kidzeeMundhwaTeacherAttendance.checkedInAt, start),
        lte(kidzeeMundhwaTeacherAttendance.checkedInAt, end),
      ),
    )
    .orderBy(desc(kidzeeMundhwaTeacherAttendance.checkedInAt));

  return rows.map(rowToRecord);
}

export async function getTodayCheckedInTeacherIds(): Promise<string[]> {
  const records = await getTodayAttendance();
  return records.map((r) => r.teacherId);
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

  if (await teacherAlreadyCheckedInToday(input.teacherId)) {
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

export type RequestLinkResult =
  | { ok: true }
  | {
      ok: false;
      code: "UNKNOWN_TEACHER" | "NO_PHONE" | "ALREADY_CHECKED_IN" | "WHATSAPP_FAILED";
      error?: string;
    };

export async function requestCheckInLink(teacherId: string): Promise<RequestLinkResult> {
  const teacher = getTeacherById(teacherId);
  if (!teacher) {
    return { ok: false, code: "UNKNOWN_TEACHER" };
  }

  const phone = normalizePhone(teacher.phone);
  if (!phone) {
    return { ok: false, code: "NO_PHONE", error: "No phone number on file for this teacher." };
  }

  if (await teacherAlreadyCheckedInToday(teacherId)) {
    return { ok: false, code: "ALREADY_CHECKED_IN" };
  }

  const tokenId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.delete(kidzeeMundhwaCheckInToken).where(
    and(eq(kidzeeMundhwaCheckInToken.teacherId, teacherId), isNull(kidzeeMundhwaCheckInToken.usedAt)),
  );

  await db.insert(kidzeeMundhwaCheckInToken).values({
    id: tokenId,
    teacherId: teacher.id,
    expiresAt,
  });

  const url = `${checkInBaseUrl()}/checkin/confirm?token=${tokenId}`;
  const message = `Hi ${teacher.name}, tap to check in at Kidzee Mundhwa:\n${url}\n\nLink expires in 10 minutes.`;

  try {
    await whatsAppManager.sendMessage(whatsAppInstanceName(), phone, message);
  } catch (err) {
    await db.delete(kidzeeMundhwaCheckInToken).where(eq(kidzeeMundhwaCheckInToken.id, tokenId));
    const message = err instanceof Error ? err.message : "Could not send WhatsApp message";
    return { ok: false, code: "WHATSAPP_FAILED", error: message };
  }

  return { ok: true };
}

export async function getTokenStatus(tokenId: string): Promise<TokenStatus> {
  const [row] = await db
    .select()
    .from(kidzeeMundhwaCheckInToken)
    .where(eq(kidzeeMundhwaCheckInToken.id, tokenId))
    .limit(1);

  if (!row) {
    return { ok: false, code: "NOT_FOUND" };
  }

  if (row.usedAt) {
    return { ok: false, code: "USED" };
  }

  if (row.expiresAt.getTime() < Date.now()) {
    return { ok: false, code: "EXPIRED" };
  }

  const teacher = getTeacherById(row.teacherId);
  if (!teacher) {
    return { ok: false, code: "NOT_FOUND" };
  }

  return { ok: true, teacherId: teacher.id, teacherName: teacher.name };
}

export type CompleteCheckInResult =
  | { ok: true; record: AttendanceRecord }
  | {
      ok: false;
      code:
        | "INVALID_TOKEN"
        | "EXPIRED_TOKEN"
        | "USED_TOKEN"
        | "UNKNOWN_TEACHER"
        | "ALREADY_CHECKED_IN"
        | "OUTSIDE_GEOFENCE";
      distanceMeters?: number;
    };

export async function completeCheckInWithToken(
  tokenId: string,
  latitude: number,
  longitude: number,
  manualOverride = false,
): Promise<CompleteCheckInResult> {
  const status = await getTokenStatus(tokenId);
  if (!status.ok) {
    if (status.code === "EXPIRED") return { ok: false, code: "EXPIRED_TOKEN" };
    if (status.code === "USED") return { ok: false, code: "USED_TOKEN" };
    return { ok: false, code: "INVALID_TOKEN" };
  }

  const result = await checkInTeacher({
    teacherId: status.teacherId,
    latitude,
    longitude,
    manualOverride,
  });

  if (!result.ok) {
    if (result.code === "OUTSIDE_GEOFENCE") {
      return { ok: false, code: "OUTSIDE_GEOFENCE", distanceMeters: result.distanceMeters };
    }
    if (result.code === "ALREADY_CHECKED_IN") {
      return { ok: false, code: "ALREADY_CHECKED_IN" };
    }
    return { ok: false, code: "UNKNOWN_TEACHER" };
  }

  await db
    .update(kidzeeMundhwaCheckInToken)
    .set({ usedAt: new Date() })
    .where(eq(kidzeeMundhwaCheckInToken.id, tokenId));

  return { ok: true, record: result.record };
}

export function listTeachers() {
  return TEACHERS.map((t) => ({ id: t.id, name: t.name }));
}

export async function getTodayAttendanceSummary() {
  const records = await getTodayAttendance();
  const checkedInIds = new Set(records.map((r) => r.teacherId));
  const pending = TEACHERS.filter((t) => !checkedInIds.has(t.id)).map((t) => ({
    id: t.id,
    name: t.name,
  }));

  return { records, pending, teachers: listTeachers() };
}
