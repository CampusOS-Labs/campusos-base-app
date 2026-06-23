-- Seed UKG parent contacts from data-ukg-vadgaonsheri.md
-- Source columns expected: sr no, class, kid name, dob, father name, father contact,
-- mother name, mother contact, address
-- We keep class as UKG and drop address.
-- Safe to re-run: removes and recreates only the UKG seed group.

BEGIN;

ALTER TABLE "kidzee_vadgaonsheri_contact"
ADD COLUMN IF NOT EXISTS "father_name" text,
ADD COLUMN IF NOT EXISTS "father_phone_number" text,
ADD COLUMN IF NOT EXISTS "mother_name" text,
ADD COLUMN IF NOT EXISTS "mother_phone_number" text;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "user" LIMIT 1) THEN
    RAISE EXCEPTION 'No user found. Sign in once before running this migration.';
  END IF;
END $$;

DELETE FROM kidzee_vadgaonsheri_contact
WHERE group_id = 'pg-ukg-parents-001';

DELETE FROM kidzee_vadgaonsheri_contact_group
WHERE id = 'pg-ukg-parents-001';

WITH owner AS (
  SELECT id FROM "user" ORDER BY created_at ASC LIMIT 1
)
INSERT INTO kidzee_vadgaonsheri_contact_group (id, name, description, created_by)
SELECT
  'pg-ukg-parents-001',
  'UKG',
  'Seeded from data-ukg-vadgaonsheri.md (class defaulted to UKG; address omitted)',
  owner.id
FROM owner;

INSERT INTO kidzee_vadgaonsheri_contact (
  id,
  group_id,
  name,
  phone_number,
  father_name,
  father_phone_number,
  mother_name,
  mother_phone_number,
  notes
)
VALUES
  (
    'pc-pg-ukg-parents-001-0001',
    'pg-ukg-parents-001',
    'Aahan Singh',
    '919330002981',
    'Rajeev Kumar',
    '919330002981',
    'Priti Kumari',
    '917004147242',
    'sr_no=1; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0002',
    'pg-ukg-parents-001',
    'Aaradhya Miraje',
    '919923221349',
    'Pradeep Miraje',
    '919923221349',
    'Sonal Miraje',
    '919049431987',
    'sr_no=2; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0003',
    'pg-ukg-parents-001',
    'Aditya Chavan',
    '918208128355',
    'Abhijeet Chavan',
    '918208128355',
    'Aachal',
    '917387673863',
    'sr_no=3; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0004',
    'pg-ukg-parents-001',
    'Advait Yadav',
    '917289087136',
    'Vishal Yadav',
    '917289087136',
    'Priya Yadav',
    '917068700836',
    'sr_no=4; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0005',
    'pg-ukg-parents-001',
    'Mahoday Joshi',
    '919904198261',
    'Nirajbhai Joshi',
    '919904198261',
    'Shilpa Joshi',
    '919998798763',
    'sr_no=5; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0006',
    'pg-ukg-parents-001',
    'Pradnyesh Sakinal',
    '919595776604',
    'Nachiket Sakinal',
    '919595776604',
    'Pooja Nachiket',
    '918956120494',
    'sr_no=6; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0007',
    'pg-ukg-parents-001',
    'Rosario Pillay',
    '918975337923',
    'Richard pillay',
    '918975337923',
    'gracy pillay',
    '918007002210',
    'sr_no=7; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0008',
    'pg-ukg-parents-001',
    'Shivansh Dhadhi',
    '919930918109',
    'Vinod Dhadhi',
    '919930918109',
    'Kanchan Dhadhi',
    '918830678310',
    'sr_no=8; class=UKG'
  ),
  (
    'pc-pg-ukg-parents-001-0009',
    'pg-ukg-parents-001',
    'Shreesha Galande',
    '919595950950',
    'Sagar Galande',
    '919595950950',
    'Priyanka Galande',
    '919552274275',
    'sr_no=9; class=UKG'
  );

COMMIT;

-- Total contacts inserted: 9
