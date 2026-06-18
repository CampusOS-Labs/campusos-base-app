-- Sample fee invoices for Kidzee Vadgaon Sheri (safe to re-run).
INSERT INTO kidzee_vadgaonsheri_invoices (
  invoice_number, academic_year, due_date, status, total_amount,
  student_id, student_name, student_class, roll_number, admission_number,
  parent_name, parent_phone, parent_email
)
VALUES
  ('INV-2025-0001', '2025-26', '2025-07-31', 'pending', 18000, 'STU-VS-001', 'Japleen Kaur', 'Nursery', 'N-01', 'ADM-2024-001', 'Harjeet Singh', '+91-9451135915', 'harjeet.singh@email.com'),
  ('INV-2025-0002', '2025-26', '2025-07-31', 'pending', 18000, 'STU-VS-002', 'Anvi Sujit Jagtap', 'Nursery', 'N-02', 'ADM-2024-002', 'Sujit Suresh Jagtap', '+91-8390113693', 'sujit.jagtap@email.com'),
  ('INV-2025-0003', '2025-26', '2025-07-31', 'pending', 20000, 'STU-VS-003', 'Aarav Peshne', 'Playgroup', 'PG-01', 'ADM-2023-003', 'Piyush Peshne', '+91-9284386633', 'piyush.peshne@email.com'),
  ('INV-2025-0004', '2025-26', '2025-07-31', 'pending', 24000, 'STU-VS-004', 'Abhimanyu Kolpe', 'Senior KG', 'SKG-01', 'ADM-2022-004', 'Akash Kolpe', '+91-7709442562', 'akash.kolpe@email.com'),
  ('INV-2025-0005', '2025-26', '2025-07-31', 'pending', 22000, 'STU-VS-005', 'Sumedh Jogdankar', 'Junior KG', 'JKG-01', 'ADM-2023-005', 'Rajesh Jogdankar', '+91-9975264425', 'rajesh.jogdankar@email.com'),
  ('INV-2025-0006', '2025-26', '2025-06-30', 'paid', 18000, 'STU-VS-006', 'Jayraj Gurav', 'Nursery', 'N-04', 'ADM-2024-006', 'Abhijeet Gurav', '+91-9890009501', 'abhijeet.gurav@email.com')
ON CONFLICT (invoice_number) DO NOTHING;
