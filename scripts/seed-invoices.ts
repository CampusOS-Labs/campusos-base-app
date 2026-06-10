import "dotenv/config";
import fs from "fs";
import path from "path";
import postgres from "postgres";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const sql = postgres(process.env.DATABASE_URL!);

const DATA_DIR = path.resolve(__dirname, "..", "data", "invoices");
const files = fs.readdirSync(DATA_DIR).filter((f) => f.endsWith(".json"));

for (const fileName of files) {
  const filePath = path.join(DATA_DIR, fileName);
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  await sql`
    INSERT INTO kidzee_mundhwa_invoices (
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

console.log(`Done. Seeded ${files.length} invoices.`);
await sql.end();
