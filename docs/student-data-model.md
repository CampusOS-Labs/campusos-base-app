# Student Data Model & Group Creation Refactor

## Goal

Replace the manual "add contact" flow with a data-driven approach where contacts are pulled from a central `kidzee_mundhwa_students` table. This makes group creation for announcements (and invoice management) automatic and reliable.

---

## Phase 1: Create `kidzee_mundhwa_students` table

Single source of truth for every student enrolled at Kidzee Mundhwa.

### Columns

```
kidzee_mundhwa_students
├── id                  text PRIMARY KEY         -- e.g. "STU-101"
├── admission_number    text NOT NULL UNIQUE      -- e.g. "ADM-2019-101"
├── first_name          text NOT NULL
├── last_name           text NOT NULL
├── class               text NOT NULL             -- e.g. "Grade 8"
├── section             text NOT NULL             -- e.g. "A"
├── roll_number         text NOT NULL
├── gender              text
├── date_of_birth       text
├── address             text
│
├── parent_name         text NOT NULL
├── parent_phone        text NOT NULL
├── parent_email        text
├── parent2_name        text
├── parent2_phone       text
├── parent2_email       text
│
├── academic_year       text NOT NULL             -- e.g. "2024-25"
├── status              text DEFAULT 'active'     -- active / graduated / transferred
├── created_at          timestamp default now()
└── updated_at          timestamp default now()

Indexes:
  - idx_students_class_section on (class, section)
  - idx_students_phone on parent_phone
  - idx_students_status on status
```

### Drizzle schema

File: `lib/db/kidzee-mundhwa-schema.ts` — add `kidzeeMundhwaStudents` export.

---

## Phase 2: Refactor `kidzee_mundhwa_invoices`

Remove the flattened student/parent columns and replace with an FK to the students table.

### Before (current)

```
kidzee_mundhwa_invoices
├── student_id
├── student_name
├── student_class
├── roll_number
├── admission_number
├── parent_name
├── parent_phone
├── parent_email
└── ... (invoice fields)
```

### After

```
kidzee_mundhwa_invoices
├── student_id    text NOT NULL REFERENCES kidzee_mundhwa_students(id)
└── ... (invoice-only fields: invoice_number, academic_year, due_date, status, total_amount, payment_details)
```

### Migration steps

1. Create `kidzee_mundhwa_students` (Phase 1)
2. Backfill students from existing invoice data — for each unique `student_id` in invoices, insert one row into students
3. Drop the redundant columns from `kidzee_mundhwa_invoices`:
   - `student_name`, `student_class`, `roll_number`, `admission_number`
   - `parent_name`, `parent_phone`, `parent_email`
4. Add FK constraint: `student_id → kidzee_mundhwa_students(id)`

### Invoice service impact (`lib/services/invoices.ts`)

The `rowToInvoice` function will need a JOIN instead of reading flat columns:

```typescript
function rowToInvoice(row: {
  invoice: typeof kidzeeMundhwaInvoices.$inferSelect
  student: typeof kidzeeMundhwaStudents.$inferSelect
}): Invoice {
  return {
    ...row.invoice,
    student: {
      id: row.student.id,
      name: `${row.student.first_name} ${row.student.last_name}`,
      class: `${row.student.class} - Section ${row.student.section}`,
      rollNumber: row.student.roll_number,
      admissionNumber: row.student.admission_number,
    },
    parent: {
      name: row.student.parent_name,
      phone: row.student.parent_phone,
      email: row.student.parent_email,
    },
  }
}
```

---

## Phase 3: Data-driven group creation

### New "Create Group" flow

Instead of:
1. Create empty group
2. Manually add contacts one-by-one

The flow becomes:
1. Pick a class/section (or multiple) from the students table
2. Optionally filter by other criteria (gender, status, etc.)
3. Name the group ("Grade 8 Parents", "Section A")
4. Click create → group is populated automatically

### Backend: `lib/actions/groups.ts`

- New action: `createGroupFromStudents(formData)` — inserts a group + bulk-inserts contacts from the students table in one transaction
- Keep existing `createGroup`/`addContact` for ad-hoc manual groups
- Contacts table (`kidzee_mundhwa_contact`) stays the same — it's just populated differently

### Frontend: New UI in `/groups`

- Toggle between "Manual" and "From Students" modes
- "From Students" shows a class/section picker + preview of how many contacts will be created
- Preview lists parent names and phone numbers before confirming

### Announcement integration

When sending an announcement, the existing audience filter ("unpaid-parents") can now join through the students table to find parents of unpaid invoices — no duplicate parent data needed.

---

## Phase 4: Student management UI (optional / future)

- A `/students` page to view/search all students
- Upload CSV/XLSX to bulk import students
- API routes for CRUD on students
- Mark students as graduated/transferred

---

## Order of work

```
1. Create kidzee_mundhwa_students table + Drizzle schema
2. Generate migration
3. Write backfill script (students from invoices)
4. Drop redundant invoice columns + add FK
5. Update invoice service (JOIN instead of flat columns)
6. Add createGroupFromStudents action
7. Build "From Students" group creation UI
8. Remove manual add/update contact actions (optional)
9. Delete old contact data that was manually entered (optional)
```

---

## Future schools

For Kidzee Wadgaonsheri, the same pattern applies:
- `kidzee_wadgaonsheri_students`
- `kidzee_wadgaonsheri_invoices` (FK to students)
- `kidzee_wadgaonsheri_contact_group` / `kidzee_wadgaonsheri_contact` (populated from students)

The code is identical — just the table prefix changes.
