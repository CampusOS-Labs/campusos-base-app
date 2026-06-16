-- Seed class contact groups from lib/config/parent contacts.md
-- One contact per student: name = kid, phone = first available number in row.
-- Safe to re-run: removes previously seeded class groups first.
-- Requires at least one row in public."user" (uses earliest created account as owner).

BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM "user" LIMIT 1) THEN
    RAISE EXCEPTION 'No user found. Sign in once before running this migration.';
  END IF;
END $$;

DELETE FROM kidzee_mundhwa_contact
WHERE group_id IN (
  SELECT id FROM kidzee_mundhwa_contact_group
  WHERE id IN (
    'pg-nursery-parents-001',
    'pg-playgroup-parents-001',
    'pg-sr-kg-parents-001',
    'pg-jr-kg-parents-001'
  )
);

DELETE FROM kidzee_mundhwa_contact_group
WHERE id IN (
  'pg-nursery-parents-001',
  'pg-playgroup-parents-001',
  'pg-sr-kg-parents-001',
  'pg-jr-kg-parents-001'
);

WITH owner AS (
  SELECT id FROM "user" ORDER BY created_at ASC LIMIT 1
)
INSERT INTO kidzee_mundhwa_contact_group (id, name, description, created_by)
SELECT v.id, v.name, v.description, owner.id
FROM owner
CROSS JOIN (
  VALUES
    ('pg-nursery-parents-001', 'Nursery', 'Seeded from parent contacts.md (nursery)'),
    ('pg-playgroup-parents-001', 'Playgroup', 'Seeded from parent contacts.md (playgroup)'),
    ('pg-sr-kg-parents-001', 'Senior KG', 'Seeded from parent contacts.md (sr kg)'),
    ('pg-jr-kg-parents-001', 'Junior KG', 'Seeded from parent contacts.md (junior kg)')
) AS v(id, name, description);

-- Nursery: 17 contacts (17 students)
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-nursery-parents-001-0001', 'pg-nursery-parents-001', 'japleen kaur', '919451135915', ''),
  ('pc-pg-nursery-parents-001-0002', 'pg-nursery-parents-001', 'Anvi sujit jagtap', '918390113693', ''),
  ('pc-pg-nursery-parents-001-0003', 'pg-nursery-parents-001', 'vedarsh hrishikesh', '918087055577', ''),
  ('pc-pg-nursery-parents-001-0004', 'pg-nursery-parents-001', 'jayraj gurav', '919890009501', ''),
  ('pc-pg-nursery-parents-001-0005', 'pg-nursery-parents-001', 'thashwik tadisetti', '918678968882', ''),
  ('pc-pg-nursery-parents-001-0006', 'pg-nursery-parents-001', 'akshit guarv', '917709162182', ''),
  ('pc-pg-nursery-parents-001-0007', 'pg-nursery-parents-001', 'jeeshwa gadodia', '919730003399', ''),
  ('pc-pg-nursery-parents-001-0008', 'pg-nursery-parents-001', 'shreyansh kamble', '89754494873', ''),
  ('pc-pg-nursery-parents-001-0009', 'pg-nursery-parents-001', 'ojas gurav', '919373803341', ''),
  ('pc-pg-nursery-parents-001-0010', 'pg-nursery-parents-001', 'radha pophale', '919082111674', ''),
  ('pc-pg-nursery-parents-001-0011', 'pg-nursery-parents-001', 'advit tiwari', '919434743004', ''),
  ('pc-pg-nursery-parents-001-0012', 'pg-nursery-parents-001', 'shravni pawar', '918888077668', ''),
  ('pc-pg-nursery-parents-001-0013', 'pg-nursery-parents-001', 'Nitya Saddiwal', '918698888370', ''),
  ('pc-pg-nursery-parents-001-0014', 'pg-nursery-parents-001', 'Advait kulkarni', '918999073426', ''),
  ('pc-pg-nursery-parents-001-0015', 'pg-nursery-parents-001', 'Gajjala reddy', '917013661450', ''),
  ('pc-pg-nursery-parents-001-0016', 'pg-nursery-parents-001', 'Trisha Lonkar', '919921241569', ''),
  ('pc-pg-nursery-parents-001-0017', 'pg-nursery-parents-001', 'samattva yadav', '918383891890', '');

-- Playgroup: skipped (no phone): prisha
-- Playgroup: 5 contacts (6 students)
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-playgroup-parents-001-0001', 'pg-playgroup-parents-001', 'aarav peshne', '919284386633', ''),
  ('pc-pg-playgroup-parents-001-0002', 'pg-playgroup-parents-001', 'dhairya kshirsoyavr', '918793345044', ''),
  ('pc-pg-playgroup-parents-001-0003', 'pg-playgroup-parents-001', 'nivyanshi chourasia', '916364321654', ''),
  ('pc-pg-playgroup-parents-001-0004', 'pg-playgroup-parents-001', 'sharvik kulkarni', '918447103112', ''),
  ('pc-pg-playgroup-parents-001-0005', 'pg-playgroup-parents-001', 'Aarit Shende', '918055254051', '');

-- Senior KG: skipped (no phone): aditya sinde
-- Senior KG: 9 contacts (10 students)
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-sr-kg-parents-001-0001', 'pg-sr-kg-parents-001', 'abhimanyu kolpe', '917709442562', ''),
  ('pc-pg-sr-kg-parents-001-0002', 'pg-sr-kg-parents-001', 'daksh kumar', '918007569922', ''),
  ('pc-pg-sr-kg-parents-001-0003', 'pg-sr-kg-parents-001', 'jija rasal', '919763769753', ''),
  ('pc-pg-sr-kg-parents-001-0004', 'pg-sr-kg-parents-001', 'kyra purkar', '917709110992', ''),
  ('pc-pg-sr-kg-parents-001-0005', 'pg-sr-kg-parents-001', 'saransh dange', '919325556928', ''),
  ('pc-pg-sr-kg-parents-001-0006', 'pg-sr-kg-parents-001', 'shaurya bhokare', '917756903907', ''),
  ('pc-pg-sr-kg-parents-001-0007', 'pg-sr-kg-parents-001', 'vivaan javale', '919975252719', ''),
  ('pc-pg-sr-kg-parents-001-0008', 'pg-sr-kg-parents-001', 'yogiraj jadhav', '919890869772', ''),
  ('pc-pg-sr-kg-parents-001-0009', 'pg-sr-kg-parents-001', 'Chaithrika joggacheruvukindi', '919676302027', '');

-- Junior KG: 19 contacts (19 students)
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-jr-kg-parents-001-0001', 'pg-jr-kg-parents-001', 'sumedh jogdankar', '919975264425', ''),
  ('pc-pg-jr-kg-parents-001-0002', 'pg-jr-kg-parents-001', 'mrunmayee shukla', '917798433879', ''),
  ('pc-pg-jr-kg-parents-001-0003', 'pg-jr-kg-parents-001', 'gargi gophane', '919881166406', ''),
  ('pc-pg-jr-kg-parents-001-0004', 'pg-jr-kg-parents-001', 'shivanya shitole', '918888818017', ''),
  ('pc-pg-jr-kg-parents-001-0005', 'pg-jr-kg-parents-001', 'rutvik bhosale', '918412087263', ''),
  ('pc-pg-jr-kg-parents-001-0006', 'pg-jr-kg-parents-001', 'ravindra singh', '919326144101', ''),
  ('pc-pg-jr-kg-parents-001-0007', 'pg-jr-kg-parents-001', 'aadika bagul', '919765353519', ''),
  ('pc-pg-jr-kg-parents-001-0008', 'pg-jr-kg-parents-001', 'raghvee gurav', '919890009510', ''),
  ('pc-pg-jr-kg-parents-001-0009', 'pg-jr-kg-parents-001', 'uditi suryavanshi', '918446246386', ''),
  ('pc-pg-jr-kg-parents-001-0010', 'pg-jr-kg-parents-001', 'anshika pawar', '918983424624', ''),
  ('pc-pg-jr-kg-parents-001-0011', 'pg-jr-kg-parents-001', 'arnesh sinde', '919766118621', ''),
  ('pc-pg-jr-kg-parents-001-0012', 'pg-jr-kg-parents-001', 'azan shaikh', '919665164018', ''),
  ('pc-pg-jr-kg-parents-001-0013', 'pg-jr-kg-parents-001', 'divit ahluwalia', '919822721510', ''),
  ('pc-pg-jr-kg-parents-001-0014', 'pg-jr-kg-parents-001', 'mayra patil', '919657979466', ''),
  ('pc-pg-jr-kg-parents-001-0015', 'pg-jr-kg-parents-001', 'reyansh bidkar', '917744885522', ''),
  ('pc-pg-jr-kg-parents-001-0016', 'pg-jr-kg-parents-001', 'shree lonkar', '919822352352', ''),
  ('pc-pg-jr-kg-parents-001-0017', 'pg-jr-kg-parents-001', 'tirthesh patil', '919730960433', ''),
  ('pc-pg-jr-kg-parents-001-0018', 'pg-jr-kg-parents-001', 'yakshit chavan', '918983034819', ''),
  ('pc-pg-jr-kg-parents-001-0019', 'pg-jr-kg-parents-001', 'anveet sakhare', '919637338499', '');

COMMIT;

-- Total contacts inserted: 50