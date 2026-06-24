ALTER TABLE "kidzee_vadgaonsheri_contact"
ADD COLUMN IF NOT EXISTS "father_name" text,
ADD COLUMN IF NOT EXISTS "father_phone_number" text,
ADD COLUMN IF NOT EXISTS "mother_name" text,
ADD COLUMN IF NOT EXISTS "mother_phone_number" text;

UPDATE "kidzee_vadgaonsheri_contact"
SET
  "father_phone_number" = COALESCE(NULLIF("father_phone_number", ''), "phone_number")
WHERE COALESCE("phone_number", '') <> '';
