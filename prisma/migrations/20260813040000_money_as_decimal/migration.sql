-- Money moves from double precision to numeric(10,2).
-- Safe widening cast in Postgres: existing values are rounded to 2 decimals.

-- AlterTable
ALTER TABLE "Billing" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Discount" ALTER COLUMN "value" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Employee" ALTER COLUMN "salary" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Expense" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "PaymentRenegotiation" ALTER COLUMN "originalAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "renegotiatedAmount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Payroll" ALTER COLUMN "baseSalary" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "bonus" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "deductions" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "totalAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "Tuition" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2),
ALTER COLUMN "discountAmount" SET DATA TYPE DECIMAL(10,2);

-- AlterTable
ALTER TABLE "TuitionPlan" ALTER COLUMN "amount" SET DATA TYPE DECIMAL(10,2);

