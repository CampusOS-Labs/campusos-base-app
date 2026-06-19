import "dotenv/config";
import postgres from "postgres";

import { SAMPLE_INVOICES } from "../lib/config/sample-invoices";

const sql = postgres(process.env.DATABASE_URL!);

for (const data of SAMPLE_INVOICES) {
  await sql`
    INSERT INTO kidzee_vadgaonsheri_invoices (
      invoice_number, academic_year, due_date, status, total_amount,
      student_id, student_name, student_class, roll_number, admission_number,
      parent_name, parent_phone, parent_email
    ) VALUES (
      ${data.invoiceNumber}, ${data.academicYear}, ${data.dueDate}, ${data.status}, ${data.totalAmount},
      ${data.student.id}, ${data.student.name}, ${data.student.class}, ${data.student.rollNumber}, ${data.student.admissionNumber},
      ${data.parent.name}, ${data.parent.phone}, ${data.parent.email}
    )
    ON CONFLICT (invoice_number) DO NOTHING
  `;

  console.log(`Seeded: ${data.invoiceNumber}`);
}

console.log(`Done. Seeded ${SAMPLE_INVOICES.length} invoices.`);
await sql.end();
