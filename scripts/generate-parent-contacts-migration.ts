import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const SOURCE = path.resolve(__dirname, "../lib/config/parent contacts.md");
const OUTPUT = path.resolve(
  __dirname,
  "../supabase/migrations/0007_seed_class_parent_groups.sql",
);

const GROUPS = [
  { heading: "nursery", name: "Nursery", id: "pg-nursery-parents-001" },
  { heading: "playgroup", name: "Playgroup", id: "pg-playgroup-parents-001" },
  { heading: "sr kg", name: "Senior KG", id: "pg-sr-kg-parents-001" },
  { heading: "junior kg", name: "Junior KG", id: "pg-jr-kg-parents-001" },
] as const;

type StudentContact = {
  name: string;
  phone: string;
};

type StudentRow = {
  student: string;
  father: string;
  fatherPhone: string;
  mother: string;
  motherPhone: string;
};

function escapeSql(value: string): string {
  return value.replace(/'/g, "''");
}

function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return null;
  if (digits.length === 10) return `91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return digits;
  if (digits.length === 11 && digits.startsWith("0")) return `91${digits.slice(1)}`;
  return digits;
}

function looksLikePhone(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) return false;
  return normalizePhone(trimmed) !== null && !/[a-zA-Z]/.test(trimmed);
}

function parseLine(line: string): StudentRow | null {
  const match = line.match(/^\s*\d+\.\s*(.+)$/);
  if (!match) return null;

  const parts = match[1].split(",").map((part) => part.trim());
  while (parts.length < 5) parts.push("");

  const student = parts[0] ?? "";
  if (!student) return null;

  // Shorthand: kid, phone
  if (parts.length === 2 && looksLikePhone(parts[1] ?? "")) {
    return {
      student,
      father: "",
      fatherPhone: parts[1] ?? "",
      mother: "",
      motherPhone: "",
    };
  }

  // Malformed row where the second field is actually the phone number.
  if (looksLikePhone(parts[1] ?? "") && !parts[2]) {
    return {
      student,
      father: "",
      fatherPhone: parts[1] ?? "",
      mother: parts[3] ?? "",
      motherPhone: parts[4] ?? "",
    };
  }

  return {
    student,
    father: parts[1] ?? "",
    fatherPhone: parts[2] ?? "",
    mother: parts[3] ?? "",
    motherPhone: parts[4] ?? "",
  };
}

function firstPhoneForRow(row: StudentRow): string | null {
  return (
    normalizePhone(row.fatherPhone) ??
    normalizePhone(row.motherPhone) ??
    (looksLikePhone(row.father) ? normalizePhone(row.father) : null)
  );
}

function studentContactForRow(row: StudentRow): StudentContact | null {
  const phone = firstPhoneForRow(row);
  if (!phone) return null;

  return {
    name: row.student,
    phone,
  };
}

function parseMarkdown(content: string): Map<string, StudentRow[]> {
  const sections = new Map<string, StudentRow[]>();
  let current: string | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("<!--")) continue;

    const heading = line.match(/^##\s+(.+)$/);
    if (heading) {
      current = heading[1].trim().toLowerCase();
      sections.set(current, []);
      continue;
    }

    if (!current) continue;
    const row = parseLine(line);
    if (row?.student) sections.get(current)!.push(row);
  }

  return sections;
}

function contactId(groupId: string, index: number): string {
  return `pc-${groupId}-${String(index).padStart(4, "0")}`;
}

function buildSql(): string {
  const content = fs.readFileSync(SOURCE, "utf-8");
  const sections = parseMarkdown(content);

  const lines: string[] = [
    "-- Seed class contact groups from lib/config/parent contacts.md",
    "-- One contact per student: name = kid, phone = first available number in row.",
    "-- Safe to re-run: removes previously seeded class groups first.",
    "-- Requires at least one row in public.\"user\" (uses earliest created account as owner).",
    "",
    "BEGIN;",
    "",
    "DO $$",
    "BEGIN",
    "  IF NOT EXISTS (SELECT 1 FROM \"user\" LIMIT 1) THEN",
    "    RAISE EXCEPTION 'No user found. Sign in once before running this migration.';",
    "  END IF;",
    "END $$;",
    "",
    "DELETE FROM kidzee_mundhwa_contact",
    "WHERE group_id IN (",
    "  SELECT id FROM kidzee_mundhwa_contact_group",
    "  WHERE id IN (",
    GROUPS.map((group) => `    '${group.id}'`).join(",\n"),
    "  )",
    ");",
    "",
    "DELETE FROM kidzee_mundhwa_contact_group",
    "WHERE id IN (",
    GROUPS.map((group) => `  '${group.id}'`).join(",\n"),
    ");",
    "",
    "WITH owner AS (",
    "  SELECT id FROM \"user\" ORDER BY created_at ASC LIMIT 1",
    ")",
    "INSERT INTO kidzee_mundhwa_contact_group (id, name, description, created_by)",
    "SELECT v.id, v.name, v.description, owner.id",
    "FROM owner",
    "CROSS JOIN (",
    "  VALUES",
    GROUPS.map(
      (group, index) =>
        `    ('${group.id}', '${escapeSql(group.name)}', 'Seeded from parent contacts.md (${escapeSql(group.heading)})')${index === GROUPS.length - 1 ? "" : ","}`,
    ).join("\n"),
    ") AS v(id, name, description);",
    "",
  ];

  let totalContacts = 0;

  for (const group of GROUPS) {
    const rows = sections.get(group.heading) ?? [];
    const contacts: Array<StudentContact & { id: string; groupId: string }> = [];
    const skipped: string[] = [];
    let index = 1;

    for (const row of rows) {
      const contact = studentContactForRow(row);
      if (!contact) {
        skipped.push(row.student);
        continue;
      }

      contacts.push({
        ...contact,
        id: contactId(group.id, index),
        groupId: group.id,
      });
      index += 1;
    }

    totalContacts += contacts.length;

    if (skipped.length > 0) {
      lines.push(`-- ${group.name}: skipped (no phone): ${skipped.join(", ")}`);
    }

    if (contacts.length === 0) {
      lines.push(`-- ${group.name}: no contacts with phone numbers`);
      lines.push("");
      continue;
    }

    lines.push(`-- ${group.name}: ${contacts.length} contacts (${rows.length} students)`);
    lines.push(
      "INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)",
      "VALUES",
    );
    lines.push(
      contacts
        .map(
          (contact) =>
            `  ('${contact.id}', '${contact.groupId}', '${escapeSql(contact.name)}', '${contact.phone}', '')`,
        )
        .join(",\n") + ";",
    );
    lines.push("");
  }

  lines.push("COMMIT;");
  lines.push("");
  lines.push(`-- Total contacts inserted: ${totalContacts}`);

  return lines.join("\n");
}

const sql = buildSql();
fs.writeFileSync(OUTPUT, sql);
console.log(`Wrote ${OUTPUT}`);
