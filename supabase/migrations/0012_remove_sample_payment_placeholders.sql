-- Remove placeholder/sample invoice rows used for early payments demos.
-- Safe to re-run.

BEGIN;

DELETE FROM kidzee_vadgaonsheri_invoices
WHERE invoice_number IN (
  'INV-2025-0001',
  'INV-2025-0002',
  'INV-2025-0003',
  'INV-2025-0004',
  'INV-2025-0005',
  'INV-2025-0006'
);

COMMIT;
