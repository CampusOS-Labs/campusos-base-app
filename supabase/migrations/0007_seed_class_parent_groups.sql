-- Seed class parent contact groups from lib/config/parent contacts.md
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
    ('pg-nursery-parents-001', 'Nursery parents', 'Seeded from parent contacts.md (nursery)'),
    ('pg-playgroup-parents-001', 'Playgroup parents', 'Seeded from parent contacts.md (playgroup)'),
    ('pg-sr-kg-parents-001', 'Senior KG parents', 'Seeded from parent contacts.md (sr kg)'),
    ('pg-jr-kg-parents-001', 'Junior KG parents', 'Seeded from parent contacts.md (junior kg)')
) AS v(id, name, description);

-- Nursery parents: 36 contacts
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-nursery-parents-001-0001', 'pg-nursery-parents-001', 'harjeet singh', '919451135915', 'Parent of japleen kaur'),
  ('pc-pg-nursery-parents-001-0002', 'pg-nursery-parents-001', 'prabhjeet kaur', '917459960024', 'Parent of japleen kaur'),
  ('pc-pg-nursery-parents-001-0003', 'pg-nursery-parents-001', 'Sujit Suresh Jagtap', '918390113693', 'Parent of Anvi sujit jagtap'),
  ('pc-pg-nursery-parents-001-0004', 'pg-nursery-parents-001', 'Pratima Sujit Jagtap', '918177816910', 'Parent of Anvi sujit jagtap'),
  ('pc-pg-nursery-parents-001-0005', 'pg-nursery-parents-001', 'hrishikesh jagptap', '918087055577', 'Parent of vedarsh hrishikesh'),
  ('pc-pg-nursery-parents-001-0006', 'pg-nursery-parents-001', 'dipti jagptap', '919145420102', 'Parent of vedarsh hrishikesh'),
  ('pc-pg-nursery-parents-001-0007', 'pg-nursery-parents-001', 'abhijeet guarv', '919890009501', 'Parent of jayraj gurav'),
  ('pc-pg-nursery-parents-001-0008', 'pg-nursery-parents-001', 'rohini gurav', '918806171091', 'Parent of jayraj gurav'),
  ('pc-pg-nursery-parents-001-0009', 'pg-nursery-parents-001', 'naga', '918678968882', 'Parent of thashwik tadisetti'),
  ('pc-pg-nursery-parents-001-0010', 'pg-nursery-parents-001', 'swathi', '919177659923', 'Parent of thashwik tadisetti'),
  ('pc-pg-nursery-parents-001-0011', 'pg-nursery-parents-001', 'kailas gurav', '917709162182', 'Parent of akshit guarv'),
  ('pc-pg-nursery-parents-001-0012', 'pg-nursery-parents-001', 'vaishali guarv', '917038262925', 'Parent of akshit guarv'),
  ('pc-pg-nursery-parents-001-0013', 'pg-nursery-parents-001', 'girish', '919730003399', 'Parent of jeeshwa gadodia'),
  ('pc-pg-nursery-parents-001-0014', 'pg-nursery-parents-001', 'payal', '917020430802', 'Parent of jeeshwa gadodia'),
  ('pc-pg-nursery-parents-001-0015', 'pg-nursery-parents-001', 'sandeep kamble', '89754494873', 'Parent of shreyansh kamble'),
  ('pc-pg-nursery-parents-001-0016', 'pg-nursery-parents-001', 'sonam kamble', '919604175254', 'Parent of shreyansh kamble'),
  ('pc-pg-nursery-parents-001-0017', 'pg-nursery-parents-001', 'shankar gurav', '919373803341', 'Parent of ojas gurav'),
  ('pc-pg-nursery-parents-001-0018', 'pg-nursery-parents-001', 'rajshree gurav', '917507044557', 'Parent of ojas gurav'),
  ('pc-pg-nursery-parents-001-0019', 'pg-nursery-parents-001', 'suraj pophale', '919082111674', 'Parent of radha pophale'),
  ('pc-pg-nursery-parents-001-0020', 'pg-nursery-parents-001', 'utkarsha pophale', '917709028138', 'Parent of radha pophale'),
  ('pc-pg-nursery-parents-001-0021', 'pg-nursery-parents-001', 'saurabh tiwari', '919434743004', 'Parent of advit tiwari'),
  ('pc-pg-nursery-parents-001-0022', 'pg-nursery-parents-001', 'ruchi tiwari', '917415769665', 'Parent of advit tiwari'),
  ('pc-pg-nursery-parents-001-0023', 'pg-nursery-parents-001', 'akash pawar', '918888077668', 'Parent of shravni pawar'),
  ('pc-pg-nursery-parents-001-0024', 'pg-nursery-parents-001', 'komal pawar', '918390058090', 'Parent of shravni pawar'),
  ('pc-pg-nursery-parents-001-0025', 'pg-nursery-parents-001', 'Tuljaram J. Saddiwal', '918698888370', 'Parent of Nitya Saddiwal'),
  ('pc-pg-nursery-parents-001-0026', 'pg-nursery-parents-001', 'Namrata Saddiwal', '919730361510', 'Parent of Nitya Saddiwal'),
  ('pc-pg-nursery-parents-001-0027', 'pg-nursery-parents-001', 'Avinash Kulkarni', '918999073426', 'Parent of Advait kulkarni'),
  ('pc-pg-nursery-parents-001-0028', 'pg-nursery-parents-001', 'Shraddha Kulkarni', '918888633430', 'Parent of Advait kulkarni'),
  ('pc-pg-nursery-parents-001-0029', 'pg-nursery-parents-001', 'G. Mastan Reddy', '917013661450', 'Parent of Gajjala reddy'),
  ('pc-pg-nursery-parents-001-0030', 'pg-nursery-parents-001', 'V. Kalpana', '917671906639', 'Parent of Gajjala reddy'),
  ('pc-pg-nursery-parents-001-0031', 'pg-nursery-parents-001', 'Sarang Lonkar', '919921241569', 'Parent of Trisha Lonkar'),
  ('pc-pg-nursery-parents-001-0032', 'pg-nursery-parents-001', 'Priyanka Lonkar', '918484838605', 'Parent of Trisha Lonkar'),
  ('pc-pg-nursery-parents-001-0033', 'pg-nursery-parents-001', 'Amol Shende', '918055254051', 'Parent of Aarit Shende'),
  ('pc-pg-nursery-parents-001-0034', 'pg-nursery-parents-001', 'Aparna shende', '918805249219', 'Parent of Aarit Shende'),
  ('pc-pg-nursery-parents-001-0035', 'pg-nursery-parents-001', 'rakesh pandhare', '918208002530', 'Parent of atharva pandhare'),
  ('pc-pg-nursery-parents-001-0036', 'pg-nursery-parents-001', 'Parent of samattva yadav', '918383891890', 'Parent of samattva yadav');

-- Playgroup parents: 4 contacts
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-playgroup-parents-001-0001', 'pg-playgroup-parents-001', 'piyush peshne', '919284386633', 'Parent of aarav peshne'),
  ('pc-pg-playgroup-parents-001-0002', 'pg-playgroup-parents-001', 'd. kshirsoyavr', '918793345044', 'Parent of dhairya kshirsoyavr'),
  ('pc-pg-playgroup-parents-001-0003', 'pg-playgroup-parents-001', 'Parent of nivyanshi chourasia', '916364321654', 'Parent of nivyanshi chourasia'),
  ('pc-pg-playgroup-parents-001-0004', 'pg-playgroup-parents-001', 'a. kulkarni', '918447103112', 'Parent of sharvik kulkarni');

-- Senior KG parents: 8 contacts
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-sr-kg-parents-001-0001', 'pg-sr-kg-parents-001', 'akash kolpe', '917709442562', 'Parent of abhimanyu kolpe'),
  ('pc-pg-sr-kg-parents-001-0002', 'pg-sr-kg-parents-001', 'manish kumar', '918007569922', 'Parent of daksh kumar'),
  ('pc-pg-sr-kg-parents-001-0003', 'pg-sr-kg-parents-001', 'shriniwas rasal', '919763769753', 'Parent of jija rasal'),
  ('pc-pg-sr-kg-parents-001-0004', 'pg-sr-kg-parents-001', 'dipali purkar', '917709110992', 'Parent of kyra purkar'),
  ('pc-pg-sr-kg-parents-001-0005', 'pg-sr-kg-parents-001', 'sagar dange', '919325556928', 'Parent of saransh dange'),
  ('pc-pg-sr-kg-parents-001-0006', 'pg-sr-kg-parents-001', 'sainath bhokare', '917756903907', 'Parent of shaurya bhokare'),
  ('pc-pg-sr-kg-parents-001-0007', 'pg-sr-kg-parents-001', 'rohan javale', '919975252719', 'Parent of vivaan javale'),
  ('pc-pg-sr-kg-parents-001-0008', 'pg-sr-kg-parents-001', 'pankaj jadhav', '919890869772', 'Parent of yogiraj jadhav');

-- Junior KG parents: 29 contacts
INSERT INTO kidzee_mundhwa_contact (id, group_id, name, phone_number, notes)
VALUES
  ('pc-pg-jr-kg-parents-001-0001', 'pg-jr-kg-parents-001', 'rajesh jogadankar', '919975264425', 'Parent of sumedh jogdankar'),
  ('pc-pg-jr-kg-parents-001-0002', 'pg-jr-kg-parents-001', 'minal', '919881081644', 'Parent of sumedh jogdankar'),
  ('pc-pg-jr-kg-parents-001-0003', 'pg-jr-kg-parents-001', 'pratik', '917798433879', 'Parent of mrunmayee shukla'),
  ('pc-pg-jr-kg-parents-001-0004', 'pg-jr-kg-parents-001', 'madhushree', '919930846042', 'Parent of mrunmayee shukla'),
  ('pc-pg-jr-kg-parents-001-0005', 'pg-jr-kg-parents-001', 'shubham', '919881166406', 'Parent of gargi gophane'),
  ('pc-pg-jr-kg-parents-001-0006', 'pg-jr-kg-parents-001', 'aarti', '919607009927', 'Parent of gargi gophane'),
  ('pc-pg-jr-kg-parents-001-0007', 'pg-jr-kg-parents-001', 'pravin', '918888818017', 'Parent of shivanya shitole'),
  ('pc-pg-jr-kg-parents-001-0008', 'pg-jr-kg-parents-001', 'priya', '919764536592', 'Parent of shivanya shitole'),
  ('pc-pg-jr-kg-parents-001-0009', 'pg-jr-kg-parents-001', 'anket', '918412087263', 'Parent of rutvik bhosale'),
  ('pc-pg-jr-kg-parents-001-0010', 'pg-jr-kg-parents-001', 'pooja', '919373564800', 'Parent of rutvik bhosale'),
  ('pc-pg-jr-kg-parents-001-0011', 'pg-jr-kg-parents-001', 'manohar', '919326144101', 'Parent of ravindra singh'),
  ('pc-pg-jr-kg-parents-001-0012', 'pg-jr-kg-parents-001', 'rinku kumar', '916375601689', 'Parent of ravindra singh'),
  ('pc-pg-jr-kg-parents-001-0013', 'pg-jr-kg-parents-001', 'anchal', '919765353519', 'Parent of aadika bagul'),
  ('pc-pg-jr-kg-parents-001-0014', 'pg-jr-kg-parents-001', 'diksha', '917387902880', 'Parent of aadika bagul'),
  ('pc-pg-jr-kg-parents-001-0015', 'pg-jr-kg-parents-001', 'abhijeet', '919890009510', 'Parent of raghvee gurav'),
  ('pc-pg-jr-kg-parents-001-0016', 'pg-jr-kg-parents-001', 'rohini', '918806171091', 'Parent of raghvee gurav'),
  ('pc-pg-jr-kg-parents-001-0017', 'pg-jr-kg-parents-001', 'gulshan', '918446246386', 'Parent of uditi suryavanshi'),
  ('pc-pg-jr-kg-parents-001-0018', 'pg-jr-kg-parents-001', 'bhumika', '919011085946', 'Parent of uditi suryavanshi'),
  ('pc-pg-jr-kg-parents-001-0019', 'pg-jr-kg-parents-001', 'amol pawar', '918983424624', 'Parent of anshika pawar'),
  ('pc-pg-jr-kg-parents-001-0020', 'pg-jr-kg-parents-001', 'anup sinde', '919766118621', 'Parent of arnesh sinde'),
  ('pc-pg-jr-kg-parents-001-0021', 'pg-jr-kg-parents-001', 'gaus shaikh', '919665164018', 'Parent of azan shaikh'),
  ('pc-pg-jr-kg-parents-001-0022', 'pg-jr-kg-parents-001', 'Parent of divit ahluwalia', '919822721510', 'Parent of divit ahluwalia'),
  ('pc-pg-jr-kg-parents-001-0023', 'pg-jr-kg-parents-001', 'tushar patil', '919657979466', 'Parent of mayra patil'),
  ('pc-pg-jr-kg-parents-001-0024', 'pg-jr-kg-parents-001', 'kiran bidkar', '917744885522', 'Parent of reyansh bidkar'),
  ('pc-pg-jr-kg-parents-001-0025', 'pg-jr-kg-parents-001', 'pratik lonkar', '919822352352', 'Parent of shree lonkar'),
  ('pc-pg-jr-kg-parents-001-0026', 'pg-jr-kg-parents-001', 'kundan patil', '919730960433', 'Parent of tirthesh patil'),
  ('pc-pg-jr-kg-parents-001-0027', 'pg-jr-kg-parents-001', 'santosh chavan', '918983034819', 'Parent of yakshit chavan'),
  ('pc-pg-jr-kg-parents-001-0028', 'pg-jr-kg-parents-001', 'umesh', '919637338499', 'Parent of anveet sakhare'),
  ('pc-pg-jr-kg-parents-001-0029', 'pg-jr-kg-parents-001', 'akshalata', '919529787827', 'Parent of anveet sakhare');

COMMIT;

-- Total contacts inserted: 77