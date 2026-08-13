-- Human-readable identifiers move from count()+1 to Postgres sequences.
--
-- count()+1 collides when a row has been deleted (the next id repeats an
-- existing one) and under concurrency (two requests read the same count).
-- Existing values are rewritten to a single format per entity, then each
-- sequence starts above the highest number in use.

CREATE SEQUENCE IF NOT EXISTS invoice_number_seq;
CREATE SEQUENCE IF NOT EXISTS student_id_seq;
CREATE SEQUENCE IF NOT EXISTS employee_id_seq;
CREATE SEQUENCE IF NOT EXISTS enrollment_request_number_seq;

-- Billing.invoiceNumber: INV000001 / BILL-000011 / INV2026000001 -> INV-<year>-<6 digits>
WITH renumbered AS (
  SELECT id,
         'INV-' || to_char("createdAt", 'YYYY') || '-' ||
         lpad((row_number() OVER (ORDER BY "createdAt", id))::text, 6, '0') AS new_number,
         row_number() OVER (ORDER BY "createdAt", id) AS seq
  FROM "Billing"
)
UPDATE "Billing" b
SET "invoiceNumber" = r.new_number
FROM renumbered r
WHERE b.id = r.id;

SELECT setval('invoice_number_seq', COALESCE((SELECT count(*) FROM "Billing"), 0) + 1, false);

-- Student.studentId: EST0001 / STD00001 -> EST<5 digits>
WITH renumbered AS (
  SELECT id,
         'EST' || lpad((row_number() OVER (ORDER BY "createdAt", id))::text, 5, '0') AS new_id
  FROM "Student"
)
UPDATE "Student" s
SET "studentId" = r.new_id
FROM renumbered r
WHERE s.id = r.id;

SELECT setval('student_id_seq', COALESCE((SELECT count(*) FROM "Student"), 0) + 1, false);

-- Employee.employeeId: EMP001 / EMP00001 / PROF001 / STAFF001 -> EMP<5 digits>
WITH renumbered AS (
  SELECT id,
         'EMP' || lpad((row_number() OVER (ORDER BY "createdAt", id))::text, 5, '0') AS new_id
  FROM "Employee"
)
UPDATE "Employee" e
SET "employeeId" = r.new_id
FROM renumbered r
WHERE e.id = r.id;

SELECT setval('employee_id_seq', COALESCE((SELECT count(*) FROM "Employee"), 0) + 1, false);

-- EnrollmentRequest.requestNumber: ENR-2026-0001 / MAT-2026-0001 -> MAT-<year>-<4 digits>
WITH renumbered AS (
  SELECT id,
         'MAT-' || to_char("createdAt", 'YYYY') || '-' ||
         lpad((row_number() OVER (ORDER BY "createdAt", id))::text, 4, '0') AS new_number
  FROM "EnrollmentRequest"
)
UPDATE "EnrollmentRequest" er
SET "requestNumber" = r.new_number
FROM renumbered r
WHERE er.id = r.id;

SELECT setval('enrollment_request_number_seq', COALESCE((SELECT count(*) FROM "EnrollmentRequest"), 0) + 1, false);
