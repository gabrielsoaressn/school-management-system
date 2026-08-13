# Class Structure Redesign - Design Document

**Date:** 2026-02-23
**Status:** Approved
**Author:** Claude Code

## Problem Statement

The current system creates one Class record for each subject-section combination, resulting in hundreds of redundant records. For example, "6º Ano A" has 10+ subjects, creating 10+ separate Class records ("6º Ano A - Matemática", "6º Ano A - Português", etc.).

This creates confusion:

- Student enrollment UI shows dozens of duplicate-looking classes
- Database has ~270 Class records instead of ~27
- Model doesn't match real-world school structure

## Requirements

Based on user input, the system should work as follows:

1. **Class Definition:** A class is defined by grade level + section (e.g., "6º Ano A")
2. **Subjects:** All subjects are grade-specific and all students in a grade take the same subjects
3. **Teacher Assignment:** Each subject has ONE teacher for ALL sections of that grade (e.g., Professor João teaches Matemática to both 6º A and 6º B)
4. **Student Enrollment:** When a student enrolls in "6º Ano A", they automatically get all subjects for 6º Ano
5. **Room/Schedule:** Each class has a main classroom and schedule

## Solution: Approach 1 - Remove subjectId from Class

### Schema Changes

**Class Model - BEFORE:**

```prisma
model Class {
  id              String        @id @default(cuid())
  name            String
  gradeLevel      String
  section         String
  academicYear    String
  roomNumber      String?

  subjectId       String        // REMOVE
  subject         Subject       // REMOVE
  teacherId       String?       // REMOVE
  teacher         Teacher?      // REMOVE

  enrollments     Enrollment[]

  @@unique([gradeLevel, section, subjectId, academicYear])
}
```

**Class Model - AFTER:**

```prisma
model Class {
  id              String        @id @default(cuid())
  name            String        // Ex: "6º Ano A"
  gradeLevel      String        // Ex: "6º Ano"
  section         String        // Ex: "A"
  academicYear    String        // Ex: "2026"
  roomNumber      String?       // Ex: "101"
  schedule        String?       // NEW - Ex: "Segunda a Sexta, 7h-12h"
  capacity        Int?          // NEW - Ex: 30

  enrollments     Enrollment[]
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([gradeLevel, section, academicYear])
  @@index([gradeLevel, section])
}
```

**Models that DON'T change:**

- ✅ Subject (continues with gradeLevel)
- ✅ TeacherSubject (already correct - teachers assigned to subjects)
- ✅ Enrollment (continues linking students to classes)
- ✅ Student (already has gradeLevel and section)
- ✅ Grade (continues linking student + subject + professor)

### Data Migration Strategy

Since the system is in development, we'll use a **complete reset**:

1. Update Prisma schema
2. Update seed script to create consolidated classes
3. Run `prisma migrate reset` to drop all data and reseed
4. No need for complex migration scripts

### API Changes

**Class Creation API (`/api/admin/classes`):**

- Remove references to `subjectId` and `teacherId`
- Create ONE class per grade+section+year combination
- Already receives correct fields: name, grade, section, academicYear, capacity, schedule, room

**Class Listing API:**

- Return simple classes (without subject/teacher in Class object)
- To show class subjects: query all Subject where `gradeLevel` = class.gradeLevel
- To show teachers: query via TeacherSubject

**Example query to get class subjects and teachers:**

```typescript
// Get class
const turma = await prisma.class.findUnique({
  where: { id: turmaId },
  include: { enrollments: { include: { student: true } } },
});

// Get subjects for this grade
const materias = await prisma.subject.findMany({
  where: { gradeLevel: turma.gradeLevel },
  include: {
    teachers: { include: { teacher: { include: { employee: true } } } },
  },
});
```

### Seed Script Changes

**BEFORE:** Create 270 classes (9 grades × 3 sections × 10 subjects)
**AFTER:** Create 27 classes (9 grades × 3 sections)

**Class creation example:**

```typescript
await prisma.class.create({
  data: {
    name: "6º Ano - Turma A",
    gradeLevel: "6º Ano",
    section: "A",
    academicYear: "2026",
    roomNumber: "101",
    schedule: "Segunda a Sexta, 7h-12h",
    capacity: 30,
  },
});
```

**Enrollment example:**

```typescript
// Student enrolled ONCE in their class
await prisma.enrollment.create({
  data: {
    studentId: student.id,
    classId: class6A.id, // Single enrollment
  },
});
```

### UI Changes

**Student Form (`/admin/students/new`):**

BEFORE:

- "Turma" dropdown showing "6º Ano A - Matemática", "6º Ano A - Português", etc. (confusing!)

AFTER:

- "Série/Ano" dropdown: "1º Ano", "2º Ano", ..., "9º Ano"
- "Turma/Seção" dropdown: "A", "B", "C"
- On save: find Class by (gradeLevel + section + academicYear)
- Create ONE Enrollment linking student to class

**Class Form (`/admin/classes/new`):**

- Already mostly correct!
- Remove "Professor Responsável" field (teachers are assigned to subjects, not classes)
- Keep fields: name, grade, section, academicYear, room, schedule, capacity

**Class Detail View:**

- Show basic info: grade, section, room, schedule, capacity
- List enrolled students
- List grade subjects (query Subject where gradeLevel = class.gradeLevel)
- For each subject: show assigned teacher (via TeacherSubject)

### Student Enrollment Flow

1. Admin accesses "Adicionar Novo Aluno"
2. Fills personal data + selects "6º Ano" + "A"
3. System finds/creates class "6º Ano A - 2026"
4. Creates Student with `gradeLevel: "6º Ano"`, `section: "A"`
5. Creates ONE Enrollment linking student to class
6. Student now automatically takes all subjects for 6º Ano

### Querying Student Subjects

```typescript
// Get student
const aluno = await prisma.student.findUnique({
  where: { id: alunoId },
});

// Get all subjects for student's grade
const materias = await prisma.subject.findMany({
  where: { gradeLevel: aluno.gradeLevel },
  include: { teachers: { include: { teacher: true } } },
});
```

### Edge Cases

**If class doesn't exist for grade+section:**

- Require admin to create class first (more control, avoids accidental classes)
- Show error message in student form
- Validation: check if class exists before creating enrollment

**Student transferred to different class:**

- Delete old Enrollment
- Create new Enrollment in destination class
- Update `gradeLevel` and `section` in Student record
- Grades remain intact (linked to subject, not class)

**Assigning teacher to a subject:**

- Use TeacherSubject (already exists)
- UI in `/admin/teachers` or `/admin/subjects`
- One teacher can teach multiple subjects

## Implementation Order

1. ✅ Update Prisma schema (remove subjectId/teacherId from Class, add schedule/capacity)
2. ✅ Create migration
3. ✅ Update seed script (create 27 classes instead of 270)
4. ✅ Run `prisma migrate reset`
5. ✅ Update `/api/admin/classes` route
6. ✅ Update class creation form
7. ✅ Update student creation form
8. ✅ Test complete enrollment flow

## Benefits

- **Simpler Model:** Database structure matches real-world school organization
- **Fewer Records:** 27 classes instead of 270 (~90% reduction)
- **Clearer UI:** No more confusing duplicate class listings
- **Easier Maintenance:** Straightforward queries and relationships
- **Better Performance:** Fewer joins and database records to manage

## Risks & Mitigations

**Risk:** Breaking existing code that queries classes
**Mitigation:** Complete reset of dev database, update all queries before production

**Risk:** Admin confusion about where to assign teachers
**Mitigation:** Clear UI showing teachers are assigned to subjects, not classes

**Risk:** Missing validation if class doesn't exist
**Mitigation:** Add validation in student enrollment API to check class exists
