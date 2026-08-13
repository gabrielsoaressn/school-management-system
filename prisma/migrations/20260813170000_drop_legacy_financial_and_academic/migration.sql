-- Drops the legacy models after their data was migrated by the scripts in
-- prisma/migrations-data/: Tuition/TuitionPlan/Discount -> Billing (+Payment),
-- Grade -> Assessment and Attendance -> AttendanceRecord.
--
-- Run those scripts before applying this migration on any database that still
-- has rows in these tables. They are idempotent.

-- DropForeignKey
ALTER TABLE "Attendance" DROP CONSTRAINT "Attendance_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Grade" DROP CONSTRAINT "Grade_teacherId_fkey";

-- DropForeignKey
ALTER TABLE "Tuition" DROP CONSTRAINT "Tuition_discountId_fkey";

-- DropForeignKey
ALTER TABLE "Tuition" DROP CONSTRAINT "Tuition_planId_fkey";

-- DropForeignKey
ALTER TABLE "Tuition" DROP CONSTRAINT "Tuition_studentId_fkey";

-- DropTable
DROP TABLE "Attendance";

-- DropTable
DROP TABLE "Discount";

-- DropTable
DROP TABLE "Grade";

-- DropTable
DROP TABLE "Tuition";

-- DropTable
DROP TABLE "TuitionPlan";

