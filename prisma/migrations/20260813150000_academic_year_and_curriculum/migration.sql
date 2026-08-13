-- Academic year becomes a first-class entity, and the grade level moves from
-- Student to Enrollment: a student is in 3º Ano *in a given year*.
--
-- Written by hand rather than generated: every new NOT NULL column is
-- backfilled from existing data before the constraint is applied, so no row is
-- lost and no default lies about history.

-- ---------------------------------------------------------------- enums
CREATE TYPE "AcademicYearStatus" AS ENUM ('PLANNING', 'ACTIVE', 'CLOSED');
CREATE TYPE "EnrollmentStatus" AS ENUM ('ACTIVE', 'COMPLETED', 'RETAINED', 'TRANSFERRED', 'CANCELLED');

-- ---------------------------------------------------------------- AcademicYear
CREATE TABLE "AcademicYear" (
    "id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "startDate" DATE NOT NULL,
    "endDate" DATE NOT NULL,
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "status" "AcademicYearStatus" NOT NULL DEFAULT 'PLANNING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AcademicYear_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AcademicYear_year_key" ON "AcademicYear"("year");
CREATE INDEX "AcademicYear_isCurrent_idx" ON "AcademicYear"("isCurrent");
CREATE INDEX "AcademicYear_status_idx" ON "AcademicYear"("status");

-- Only one year can be current.
CREATE UNIQUE INDEX "AcademicYear_single_current"
    ON "AcademicYear"("isCurrent") WHERE "isCurrent";

-- One row per year already referenced by a class. School year in Brazil runs
-- from February to December.
INSERT INTO "AcademicYear" ("id", "year", "startDate", "endDate", "status", "isCurrent")
SELECT
    'ay-' || y.year,
    y.year::int,
    make_date(y.year::int, 2, 1),
    make_date(y.year::int, 12, 20),
    'ACTIVE',
    false
FROM (SELECT DISTINCT "academicYear" AS year FROM "Class") y;

-- The most recent one is the current year.
UPDATE "AcademicYear" SET "isCurrent" = true
WHERE year = (SELECT max(year) FROM "AcademicYear");

-- Years other than the current one are closed.
UPDATE "AcademicYear" SET "status" = 'CLOSED' WHERE NOT "isCurrent";

-- ---------------------------------------------------------------- Class
ALTER TABLE "Class" ADD COLUMN "academicYearId" TEXT;

UPDATE "Class" c
SET "academicYearId" = ay.id
FROM "AcademicYear" ay
WHERE ay.year::text = c."academicYear";

ALTER TABLE "Class" ALTER COLUMN "academicYearId" SET NOT NULL;

DROP INDEX IF EXISTS "Class_gradeLevel_section_academicYear_key";
ALTER TABLE "Class" DROP COLUMN "academicYear";

CREATE UNIQUE INDEX "Class_gradeLevel_section_academicYearId_key"
    ON "Class"("gradeLevel", "section", "academicYearId");
CREATE INDEX "Class_academicYearId_idx" ON "Class"("academicYearId");

ALTER TABLE "Class" ADD CONSTRAINT "Class_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------- ClassSubjectTeacher
CREATE TABLE "ClassSubjectTeacher" (
    "id" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "teacherId" TEXT,
    "academicYearId" TEXT NOT NULL,
    "weeklyPeriods" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ClassSubjectTeacher_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "ClassSubjectTeacher_classId_subjectId_key"
    ON "ClassSubjectTeacher"("classId", "subjectId");
CREATE INDEX "ClassSubjectTeacher_classId_idx" ON "ClassSubjectTeacher"("classId");
CREATE INDEX "ClassSubjectTeacher_subjectId_idx" ON "ClassSubjectTeacher"("subjectId");
CREATE INDEX "ClassSubjectTeacher_teacherId_idx" ON "ClassSubjectTeacher"("teacherId");
CREATE INDEX "ClassSubjectTeacher_academicYearId_idx" ON "ClassSubjectTeacher"("academicYearId");

ALTER TABLE "ClassSubjectTeacher"
    ADD CONSTRAINT "ClassSubjectTeacher_classId_fkey" FOREIGN KEY ("classId")
        REFERENCES "Class"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ClassSubjectTeacher_subjectId_fkey" FOREIGN KEY ("subjectId")
        REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    ADD CONSTRAINT "ClassSubjectTeacher_teacherId_fkey" FOREIGN KEY ("teacherId")
        REFERENCES "Teacher"("id") ON DELETE SET NULL ON UPDATE CASCADE,
    ADD CONSTRAINT "ClassSubjectTeacher_academicYearId_fkey" FOREIGN KEY ("academicYearId")
        REFERENCES "AcademicYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed the curriculum from what the data already implies: every subject of a
-- class's grade level, staffed with a teacher who is assigned to that subject
-- (the lowest teacher id, deterministically, when there is more than one).
-- Classes whose subjects have no teacher get a row with teacherId NULL, which
-- the admin screen then shows as unstaffed.
INSERT INTO "ClassSubjectTeacher" ("id", "classId", "subjectId", "teacherId", "academicYearId")
SELECT
    'cst-' || c.id || '-' || s.id,
    c.id,
    s.id,
    (SELECT ts."teacherId"
       FROM "TeacherSubject" ts
      WHERE ts."subjectId" = s.id
      ORDER BY ts."teacherId"
      LIMIT 1),
    c."academicYearId"
FROM "Class" c
JOIN "Subject" s ON s."gradeLevel" = c."gradeLevel";

-- ---------------------------------------------------------------- Enrollment
ALTER TABLE "Enrollment"
    ADD COLUMN "academicYearId" TEXT,
    ADD COLUMN "gradeLevel" TEXT,
    ADD COLUMN "section" TEXT,
    ADD COLUMN "status" "EnrollmentStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "endedAt" TIMESTAMP(3),
    ADD COLUMN "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Placement copied from the class the student sits in.
UPDATE "Enrollment" e
SET "academicYearId" = c."academicYearId",
    "gradeLevel" = c."gradeLevel",
    "section" = c."section"
FROM "Class" c
WHERE c.id = e."classId";

ALTER TABLE "Enrollment"
    ALTER COLUMN "academicYearId" SET NOT NULL,
    ALTER COLUMN "gradeLevel" SET NOT NULL,
    ALTER COLUMN "section" SET NOT NULL;

DROP INDEX IF EXISTS "Enrollment_studentId_classId_key";
CREATE UNIQUE INDEX "Enrollment_studentId_academicYearId_key"
    ON "Enrollment"("studentId", "academicYearId");
CREATE INDEX "Enrollment_academicYearId_idx" ON "Enrollment"("academicYearId");
CREATE INDEX "Enrollment_gradeLevel_section_idx" ON "Enrollment"("gradeLevel", "section");
CREATE INDEX "Enrollment_status_idx" ON "Enrollment"("status");

ALTER TABLE "Enrollment" ADD CONSTRAINT "Enrollment_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------- Assessment
ALTER TABLE "Assessment" ADD COLUMN "academicYearId" TEXT;

UPDATE "Assessment" a
SET "academicYearId" = ay.id
FROM "AcademicYear" ay
WHERE ay.year::text = a."academicYear";

-- Anything whose year string matched nothing belongs to the current year.
UPDATE "Assessment"
SET "academicYearId" = (SELECT id FROM "AcademicYear" WHERE "isCurrent")
WHERE "academicYearId" IS NULL;

ALTER TABLE "Assessment" ALTER COLUMN "academicYearId" SET NOT NULL;

DROP INDEX IF EXISTS "Assessment_studentId_subjectId_assessmentTypeId_term_academicYear_key";
DROP INDEX IF EXISTS "Assessment_term_academicYear_idx";
ALTER TABLE "Assessment" DROP COLUMN "academicYear";

CREATE UNIQUE INDEX "Assessment_studentId_subjectId_assessmentTypeId_term_academi_key"
    ON "Assessment"("studentId", "subjectId", "assessmentTypeId", "term", "academicYearId");
CREATE INDEX "Assessment_academicYearId_term_idx" ON "Assessment"("academicYearId", "term");

ALTER TABLE "Assessment" ADD CONSTRAINT "Assessment_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------- AttendanceRecord
ALTER TABLE "AttendanceRecord" ADD COLUMN "academicYearId" TEXT;

UPDATE "AttendanceRecord" ar
SET "academicYearId" = c."academicYearId"
FROM "Class" c
WHERE c.id = ar."classId";

ALTER TABLE "AttendanceRecord" ALTER COLUMN "academicYearId" SET NOT NULL;
ALTER TABLE "AttendanceRecord" ALTER COLUMN "date" TYPE DATE;

CREATE INDEX "AttendanceRecord_academicYearId_idx" ON "AttendanceRecord"("academicYearId");

ALTER TABLE "AttendanceRecord" ADD CONSTRAINT "AttendanceRecord_academicYearId_fkey"
    FOREIGN KEY ("academicYearId") REFERENCES "AcademicYear"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- ---------------------------------------------------------------- Student
-- The grade level now lives on the enrolment, which is where it belongs.
DROP INDEX IF EXISTS "Student_gradeLevel_section_idx";
ALTER TABLE "Student" DROP COLUMN "gradeLevel", DROP COLUMN "section";
