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
  { heading: "nursery", name: "Nursery parents", id: "pg-nursery-parents-001" },
  { heading: "playgroup", name: "Playgroup parents", id: "pg-playgroup-parents-001" },
  { heading: "sr kg", name: "Senior KG parents", id: "pg-sr-kg-parents-001" },
  { heading: "junior kg", name: "Junior KG parents", id: "pg-jr-kg-parents-001" },
] as const;

type ParentContact = {
  name: string;
  phone: string;
  notes: string;
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

function parseLine(line: string): StudentRow | null {
  const match = line.match(/^\s*\d+\.\s*(.+)$/);
  if (!match) return null;

  const parts = match[1].split(",").map((part) => part.trim());
  while (parts.length < 5) parts.push("");

  return {
    student: parts[0] ?? "",
    father: parts[1] ?? "",
    fatherPhone: parts[2] ?? "",
    mother: parts[3] ?? "",
    motherPhone: parts[4] ?? "",
  };
}

function contactsForStudent(row: StudentRow): ParentContact[] {
  const notes = `Parent of ${row.student}`;
  const contacts: ParentContact[] = [];

  const fatherPhone = normalizePhone(row.fatherPhone);
  const motherPhone = normalizePhone(row.motherPhone);

  if (row.father && fatherPhone) {
    contacts.push({ name: row.father, phone: fatherPhone, notes });
  }

  if (row.mother && motherPhone) {
    contacts.push({ name: row.mother, phone: motherPhone, notes });
  }

  // Single phone with a named parent but stored in the other slot.
  if (row.father && !fatherPhone && motherPhone && !row.mother) {
    contacts.push({ name: row.father, phone: motherPhone, notes });
  }

  if (row.mother && !motherPhone && fatherPhone && !row.father) {
    contacts.push({ name: row.mother, phone: fatherPhone, notes });
  }

  // Only one phone and no parent name — still import for WhatsApp reach.
  if (contacts.length === 0) {
    const phone = fatherPhone ?? motherPhone;
    if (phone) {
      const name = row.father || row.mother || `Parent of ${row.student}`;
      contacts.push({ name, phone, notes });
    }
  }

  return contacts;
}

function parseMarkdown(content: string): Map<string, StudentRow[]> {
  const sections = new Map<string, StudentRow[]>();
  let current: string | null = null;

  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
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
    "-- Seed class parent contact groups from lib/config/parent contacts.md",
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
    const contacts: Array<ParentContact & { id: string; groupId: string }> = [];
    let index = 1;

    for (const row of rows) {
      for (const contact of contactsForStudent(row)) {
        contacts.push({
          ...contact,
          id: contactId(group.id, index),
          groupId: group.id,
        });
        index += 1;
      }
    }

    totalContacts += contacts.length;

    if (contacts.length === 0) {
      lines.push(`-- ${group.name}: no contacts with phone numbers`);
      lines.push("");
      continue;
    }

    lines.push(`-- ${group.name}: ${contacts.length} contacts`);
    lines.push(
      "INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)",
      "VALUES",
    );
    lines.push(
      contacts
        .map(
          (contact) =>
            `  ('${contact.id}', '${contact.groupId}', '${escapeSql(contact.name)}', '${contact.phone}', '${escapeSql(contact.notes)}')`,
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
