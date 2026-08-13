-- Prisma manages updatedAt in the client; the database default the previous
-- migration created makes the schema and the database disagree.
ALTER TABLE "AcademicYear" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "ClassSubjectTeacher" ALTER COLUMN "updatedAt" DROP DEFAULT;
ALTER TABLE "Enrollment" ALTER COLUMN "updatedAt" DROP DEFAULT;
