-- Seed UKG parent contacts from data-ukg-vadgaonsheri.md
-- Source columns expected: sr no, class, kid name, dob, father name, father contact,
-- mother name, mother contact, address
-- We keep class as UKG, drop address, and store parent metadata in notes.
-- Safe to re-run: removes and recreates only the UKG seed group.

BEGIN;

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

INSERT INTO kidzee_vadgaonsheri_contact (id, group_id, name, phone_number, notes)
VALUES
  (
    'pc-pg-ukg-parents-001-0001',
    'pg-ukg-parents-001',
    'Aahan Singh',
    '919330002981',
    'sr_no=1; class=UKG; father=Rajeev Kumar (919330002981); mother=Priti Kumari (917004147242)'
  ),
  (
    'pc-pg-ukg-parents-001-0002',
    'pg-ukg-parents-001',
    'Aaradhya Miraje',
    '919923221349',
    'sr_no=2; class=UKG; father=Pradeep Miraje (919923221349); mother=Sonal Miraje (919049431987)'
  ),
  (
    'pc-pg-ukg-parents-001-0003',
    'pg-ukg-parents-001',
    'Aditya Chavan',
    '918208128355',
    'sr_no=3; class=UKG; father=Abhijeet Chavan (918208128355); mother=Aachal (917387673863)'
  ),
  (
    'pc-pg-ukg-parents-001-0004',
    'pg-ukg-parents-001',
    'Advait Yadav',
    '917289087136',
    'sr_no=4; class=UKG; father=Vishal Yadav (917289087136); mother=Priya Yadav (917068700836)'
  ),
  (
    'pc-pg-ukg-parents-001-0005',
    'pg-ukg-parents-001',
    'Mahoday Joshi',
    '919904198261',
    'sr_no=5; class=UKG; father=Nirajbhai Joshi (919904198261); mother=Shilpa Joshi (919998798763)'
  ),
  (
    'pc-pg-ukg-parents-001-0006',
    'pg-ukg-parents-001',
    'Pradnyesh Sakinal',
    '919595776604',
    'sr_no=6; class=UKG; father=Nachiket Sakinal (919595776604); mother=Pooja Nachiket (918956120494)'
  ),
  (
    'pc-pg-ukg-parents-001-0007',
    'pg-ukg-parents-001',
    'Rosario Pillay',
    '918975337923',
    'sr_no=7; class=UKG; father=Richard pillay (918975337923); mother=gracy pillay (918007002210)'
  ),
  (
    'pc-pg-ukg-parents-001-0008',
    'pg-ukg-parents-001',
    'Shivansh Dhadhi',
    '919930918109',
    'sr_no=8; class=UKG; father=Vinod Dhadhi (919930918109); mother=Kanchan Dhadhi (918830678310)'
  ),
  (
    'pc-pg-ukg-parents-001-0009',
    'pg-ukg-parents-001',
    'Shreesha Galande',
    '919595950950',
    'sr_no=9; class=UKG; father=Sagar Galande (919595950950); mother=Priyanka Galande (919552274275)'
  );

COMMIT;

-- Total contacts inserted: 9
