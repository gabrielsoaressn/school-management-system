# Class Structure Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign Class model to represent grade+section instead of grade+section+subject, reducing database records from ~270 to ~27 and aligning with real-world school structure.

**Architecture:** Remove subjectId and teacherId from Class model. Classes now represent physical classrooms (e.g., "6º Ano A"). Students enroll once per class and automatically get all subjects for their grade. Teachers are assigned to subjects via existing TeacherSubject model.

**Tech Stack:** Prisma, PostgreSQL, Next.js 15, TypeScript, React

---

## Task 1: Update Prisma Schema

**Files:**
- Modify: `prisma/schema.prisma` (Class model, lines 223-247)

**Step 1: Remove subjectId and teacherId from Class model**

Open `prisma/schema.prisma` and update the Class model:

```prisma
model Class {
  id              String        @id @default(cuid())
  name            String
  gradeLevel      String
  section         String
  academicYear    String
  roomNumber      String?
  schedule        String?
  capacity        Int?

  // Relations
  enrollments     Enrollment[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@unique([gradeLevel, section, academicYear])
  @@index([gradeLevel, section])
}
```

**Changes made:**
- ❌ Removed `subjectId` field
- ❌ Removed `subject` relation
- ❌ Removed `teacherId` field
- ❌ Removed `teacher` relation
- ✅ Added `schedule` field (String?, optional)
- ✅ Added `capacity` field (Int?, optional)
- ✅ Changed unique constraint from `[gradeLevel, section, subjectId, academicYear]` to `[gradeLevel, section, academicYear]`
- ✅ Kept index on `[gradeLevel, section]`

**Step 2: Verify schema syntax**

Run: `npx prisma format`

Expected: Schema formatted successfully, no syntax errors

**Step 3: Commit schema changes**

```bash
git add prisma/schema.prisma
git commit -m "refactor(schema): remove subjectId/teacherId from Class model

- Remove subject and teacher relations from Class
- Add schedule and capacity fields
- Update unique constraint to gradeLevel+section+academicYear
- Classes now represent physical classrooms, not subject-specific classes

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 2: Create and Apply Migration (Reset)

**Files:**
- N/A (migration will be created automatically)

**Step 1: Reset database with new schema**

Run: `npx prisma migrate reset`

Expected:
- Drop database
- Create new migration
- Apply migration
- Run seed (will fail initially - we'll fix in next tasks)

**Step 2: Verify migration was created**

Run: `ls prisma/migrations`

Expected: New migration directory with timestamp

**Step 3: Commit migration**

```bash
git add prisma/migrations
git commit -m "chore(db): create migration for class structure redesign

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 3: Update Seed Script - Clean Data Section

**Files:**
- Modify: `prisma/seed.ts` (lines 249-274)

**Step 1: Update class creation loop to create consolidated classes**

Replace the class creation section (lines 249-274) with:

```typescript
// 5. Criar turmas (consolidadas - uma por série/seção)
console.log('🏫 Criando turmas...');
const classes = [];
for (const gradeLevel of gradeLevels) {
  for (const section of sections) {
    const classData = await prisma.class.create({
      data: {
        name: `${gradeLevel} - Turma ${section}`,
        gradeLevel,
        section,
        academicYear: '2026',
        roomNumber: `${Math.floor(Math.random() * 3) + 1}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
        schedule: 'Segunda a Sexta, 7h-12h',
        capacity: 30,
      },
    });

    classes.push(classData);
  }
}
```

**Step 2: Run seed to verify classes are created correctly**

Run: `npx prisma db seed`

Expected:
- 27 classes created (9 grades × 3 sections)
- Output shows: "🏫 Criando turmas..."
- Enrollments will fail (we'll fix next)

**Step 3: Commit seed changes**

```bash
git add prisma/seed.ts
git commit -m "refactor(seed): create consolidated classes

Create one class per grade+section instead of one per subject.
Now creates 27 classes instead of 270.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 4: Update Seed Script - Enrollments Section

**Files:**
- Modify: `prisma/seed.ts` (lines 276-291)

**Step 1: Update enrollment creation to enroll once per class**

Replace the enrollment section (lines 276-291) with:

```typescript
// 6. Matricular alunos nas turmas
console.log('📝 Matriculando alunos...');
for (const student of students) {
  // Find the class for this student's grade and section
  const studentClass = classes.find(
    c => c.gradeLevel === student.gradeLevel && c.section === student.section
  );

  if (studentClass) {
    await prisma.enrollment.create({
      data: {
        studentId: student.id,
        classId: studentClass.id,
      },
    });
  }
}
```

**Step 2: Run complete seed**

Run: `npx prisma migrate reset`

Expected:
- Database reset
- All seed data created successfully
- Output shows number of students, classes, enrollments

**Step 3: Verify data in database**

Run: `npx prisma studio`

Navigate to Class model and verify:
- 27 classes total
- Each class has name like "6º Ano - Turma A"
- No subjectId or teacherId fields
- schedule and capacity fields populated

**Step 4: Commit enrollment changes**

```bash
git add prisma/seed.ts
git commit -m "refactor(seed): update enrollments for consolidated classes

Enroll each student once in their class (grade+section) instead of
once per subject. Reduces enrollment records significantly.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 5: Update Class API Route

**Files:**
- Modify: `src/app/api/admin/classes/route.ts`

**Step 1: Read current implementation**

Current file attempts to create class with fields that no longer exist in schema.

**Step 2: Update POST handler to match new schema**

Replace the entire file content:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      name,
      grade,
      section,
      academicYear,
      capacity,
      schedule,
      room,
    } = body;

    // Validate required fields
    if (!name || !grade || !section || !academicYear) {
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if class already exists
    const existingClass = await prisma.class.findUnique({
      where: {
        gradeLevel_section_academicYear: {
          gradeLevel: grade,
          section: section,
          academicYear: academicYear,
        },
      },
    });

    if (existingClass) {
      return NextResponse.json(
        { message: "Turma já existe para esta série/seção/ano" },
        { status: 400 }
      );
    }

    // Create class
    const newClass = await prisma.class.create({
      data: {
        name,
        gradeLevel: grade,
        section,
        academicYear,
        capacity: capacity ? parseInt(capacity) : null,
        schedule: schedule || null,
        roomNumber: room || null,
      },
    });

    return NextResponse.json(
      { message: "Turma criada com sucesso", data: newClass },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating class:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar turma" },
      { status: 500 }
    );
  }
}
```

**Step 3: Test API with curl**

Run:
```bash
curl -X POST http://localhost:3000/api/admin/classes \
  -H "Content-Type: application/json" \
  -d '{
    "name": "1º Ano D",
    "grade": "1º Ano",
    "section": "D",
    "academicYear": "2026",
    "capacity": 25,
    "schedule": "Segunda a Sexta, 7h-12h",
    "room": "105"
  }'
```

Expected: Success response with created class data

**Step 4: Commit API changes**

```bash
git add src/app/api/admin/classes/route.ts
git commit -m "refactor(api): update class creation for new schema

Remove subjectId and teacherId from class creation.
Add validation for duplicate classes.
Handle new schedule and capacity fields.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 6: Update Class Form Component

**Files:**
- Modify: `src/app/admin/classes/new/ClassForm.tsx`

**Step 1: Remove teacher selection field**

In ClassForm.tsx, remove the teacher-related code:

1. Remove `teacherId` from formData state (line 25)
2. Remove the entire "Professor Responsável" div section (lines 150-167)
3. Remove `teacherId` from the fetch body (line 41)

Updated formData:
```typescript
const [formData, setFormData] = useState({
  name: "",
  grade: "",
  section: "",
  academicYear: new Date().getFullYear().toString(),
  capacity: "30",
  schedule: "",
  room: "",
});
```

**Step 2: Update form submission to not send teacherId**

The fetch call should only send the fields we have in formData:

```typescript
body: JSON.stringify({
  ...formData,
  capacity: parseInt(formData.capacity),
  academicYear: formData.academicYear,
}),
```

**Step 3: Remove teachers prop from component interface**

Remove `teachers` from the interface and props:

```typescript
export default function ClassForm() {
  // Component implementation
}
```

**Step 4: Update parent page to not fetch teachers**

Modify: `src/app/admin/classes/new/page.tsx`

Remove teacher fetching and just render the form:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import ClassForm from "./ClassForm";

export default async function NewClassPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Criar Nova Turma
            </h1>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
          <ClassForm />
        </div>
      </div>
    </div>
  );
}
```

**Step 5: Test form in browser**

1. Start dev server: `npm run dev`
2. Navigate to `/admin/classes/new`
3. Verify teacher field is gone
4. Try creating a class
5. Check database to confirm class was created

**Step 6: Commit form changes**

```bash
git add src/app/admin/classes/new/ClassForm.tsx src/app/admin/classes/new/page.tsx
git commit -m "refactor(ui): remove teacher field from class form

Teachers are now assigned to subjects, not classes.
Simplified class creation form to only collect class-level info.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 7: Update Student Form - Add Grade and Section Fields

**Files:**
- Modify: `src/app/admin/students/new/page.tsx`
- Modify: `src/app/admin/students/new/StudentForm.tsx` (if exists)

**Step 1: Check current student form structure**

Read `src/app/admin/students/new/page.tsx` to understand current implementation.

**Step 2: Update page to fetch grade levels and sections**

Modify the page to provide grade/section options:

```typescript
import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import StudentForm from "./StudentForm";

export default async function NewStudentPage() {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    redirect("/login");
  }

  // Fetch parents for the form
  const parents = await prisma.parent.findMany({
    include: {
      user: true,
    },
    orderBy: {
      firstName: "asc",
    },
  });

  // Define available grade levels and sections
  const gradeLevels = [
    "1º Ano",
    "2º Ano",
    "3º Ano",
    "4º Ano",
    "5º Ano",
    "6º Ano",
    "7º Ano",
    "8º Ano",
    "9º Ano",
  ];
  const sections = ["A", "B", "C"];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Adicionar Novo Aluno
            </h1>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
          <StudentForm
            parents={parents}
            gradeLevels={gradeLevels}
            sections={sections}
          />
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Commit page changes**

```bash
git add src/app/admin/students/new/page.tsx
git commit -m "refactor(ui): provide grade levels and sections to student form

Pass gradeLevels and sections as props instead of classes list.
Students will select grade and section, not specific classes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 8: Update Student Form Component

**Files:**
- Modify: `src/app/admin/students/new/StudentForm.tsx`

**Step 1: Find StudentForm component**

Run: `find src -name "StudentForm.tsx" -o -name "StudentForm.jsx"`

If not found, check if form is inline in page.tsx.

**Step 2: Update StudentForm to accept new props**

Update the component interface and form fields:

```typescript
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
}

interface StudentFormProps {
  parents: Parent[];
  gradeLevels: string[];
  sections: string[];
}

export default function StudentForm({ parents, gradeLevels, sections }: StudentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    dateOfBirth: "",
    gender: "MALE",
    phoneNumber: "",
    address: "",
    gradeLevel: "",
    section: "",
    parentId: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar aluno");
      }

      toast.success("Aluno criado com sucesso!");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Existing fields... firstName, lastName, etc. */}

        {/* REPLACE class selection with grade and section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Série/Ano *
          </label>
          <select
            name="gradeLevel"
            required
            value={formData.gradeLevel}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Selecione a série</option>
            {gradeLevels.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Turma/Seção *
          </label>
          <select
            name="section"
            required
            value={formData.section}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          >
            <option value="">Selecione a turma</option>
            {sections.map((sec) => (
              <option key={sec} value={sec}>
                Turma {sec}
              </option>
            ))}
          </select>
        </div>

        {/* Rest of form fields... */}
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-sm border border-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Criar Aluno"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-sm border border-gray-300 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
```

**Step 3: Commit form component changes**

```bash
git add src/app/admin/students/new/StudentForm.tsx
git commit -m "refactor(ui): replace class selection with grade/section dropdowns

Students now select their grade level and section instead of choosing
from a confusing list of subject-specific classes.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 9: Update Student Creation API

**Files:**
- Modify: `src/app/api/admin/students/route.ts`

**Step 1: Update POST handler to handle grade/section instead of classId**

The API should:
1. Receive gradeLevel and section from form
2. Find or validate that class exists
3. Create student with gradeLevel and section
4. Create enrollment linking student to class

Update the API route:

```typescript
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(request: Request) {
  try {
    const user = await getCurrentUser();

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      dateOfBirth,
      gender,
      phoneNumber,
      address,
      gradeLevel,
      section,
      parentId,
    } = body;

    // Validate required fields
    if (!firstName || !lastName || !email || !gradeLevel || !section) {
      return NextResponse.json(
        { message: "Campos obrigatórios faltando" },
        { status: 400 }
      );
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "Email já está em uso" },
        { status: 400 }
      );
    }

    // Find the class for this grade and section
    const currentYear = new Date().getFullYear().toString();
    const studentClass = await prisma.class.findUnique({
      where: {
        gradeLevel_section_academicYear: {
          gradeLevel,
          section,
          academicYear: currentYear,
        },
      },
    });

    if (!studentClass) {
      return NextResponse.json(
        { message: `Turma ${gradeLevel} ${section} não encontrada para o ano ${currentYear}` },
        { status: 400 }
      );
    }

    // Generate unique student ID
    const studentCount = await prisma.student.count();
    const studentIdNumber = `EST${String(studentCount + 1).padStart(4, "0")}`;

    // Generate default password
    const defaultPassword = "student123";
    const hashedPassword = await bcrypt.hash(defaultPassword, 10);

    // Create user, student, and enrollment in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create user
      const newUser = await tx.user.create({
        data: {
          email,
          password: hashedPassword,
          role: "STUDENT",
          isActive: true,
        },
      });

      // Create student
      const newStudent = await tx.student.create({
        data: {
          studentId: studentIdNumber,
          userId: newUser.id,
          firstName,
          lastName,
          dateOfBirth: new Date(dateOfBirth),
          gender,
          phoneNumber: phoneNumber || "",
          address: address || "",
          gradeLevel,
          section,
          parentId: parentId || null,
        },
      });

      // Enroll student in class
      await tx.enrollment.create({
        data: {
          studentId: newStudent.id,
          classId: studentClass.id,
        },
      });

      return { user: newUser, student: newStudent };
    });

    return NextResponse.json(
      {
        message: "Aluno criado com sucesso",
        data: result,
        info: `Senha padrão: ${defaultPassword}`,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating student:", error);
    return NextResponse.json(
      { message: error.message || "Erro ao criar aluno" },
      { status: 500 }
    );
  }
}
```

**Step 2: Test student creation**

1. Start dev server
2. Navigate to `/admin/students/new`
3. Fill form with grade "6º Ano" and section "A"
4. Submit form
5. Verify student created and enrolled in correct class

**Step 3: Commit API changes**

```bash
git add src/app/api/admin/students/route.ts
git commit -m "refactor(api): update student creation for new class structure

Find class by gradeLevel+section instead of receiving classId.
Automatically enroll student in the appropriate class.
Add validation to ensure class exists before creating student.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Task 10: Verification and Testing

**Files:**
- N/A (testing)

**Step 1: Test complete flow**

1. Create a new class:
   - Navigate to `/admin/classes/new`
   - Create "1º Ano - Turma D"
   - Verify it appears in database

2. Create a new student:
   - Navigate to `/admin/students/new`
   - Select grade "1º Ano", section "D"
   - Fill other fields
   - Submit form
   - Verify student created with correct gradeLevel and section

3. Check enrollment:
   - Open Prisma Studio: `npx prisma studio`
   - Verify student has ONE enrollment
   - Enrollment points to correct class

4. Verify subjects are accessible:
   - Query subjects for student's grade
   - Confirm all subjects for "1º Ano" are returned

**Step 2: Test data integrity**

Run these queries in Prisma Studio or via API:

```typescript
// Get student with their class
const student = await prisma.student.findUnique({
  where: { id: "student-id" },
  include: {
    enrollments: {
      include: { class: true }
    }
  }
});

// Get all subjects for student's grade
const subjects = await prisma.subject.findMany({
  where: { gradeLevel: student.gradeLevel },
  include: {
    teachers: {
      include: {
        teacher: {
          include: { employee: true }
        }
      }
    }
  }
});
```

Expected:
- Student has gradeLevel and section fields
- One enrollment per student
- All subjects for grade are returned with assigned teachers

**Step 3: Final verification checklist**

- ✅ Schema updated (no subjectId/teacherId in Class)
- ✅ Migration applied successfully
- ✅ Seed creates 27 classes (not 270)
- ✅ Seed creates one enrollment per student
- ✅ Class API creates classes without subjects
- ✅ Class form doesn't show teacher field
- ✅ Student form shows grade and section dropdowns
- ✅ Student API finds class and creates enrollment
- ✅ Data integrity maintained (students, enrollments, grades)

**Step 4: Create final commit**

```bash
git add -A
git commit -m "feat: complete class structure redesign

Redesigned Class model to represent physical classrooms instead of
subject-specific classes. Key changes:

- Removed subjectId and teacherId from Class model
- Added schedule and capacity fields
- Updated seed to create 27 classes instead of 270
- Students enroll once per class, not per subject
- Updated UI to select grade+section instead of specific classes
- Maintained data integrity for grades and teacher assignments

Reduces database records and aligns model with real-world structure.

Co-Authored-By: Claude Sonnet 4.5 <noreply@anthropic.com>"
```

---

## Implementation Complete

**Summary of changes:**
- ✅ Schema: Removed subjectId/teacherId from Class, added schedule/capacity
- ✅ Database: Reduced from ~270 to ~27 class records
- ✅ Seed: Consolidated class creation and enrollment logic
- ✅ API: Updated class and student creation endpoints
- ✅ UI: Simplified forms to match new data model
- ✅ Data integrity: Maintained relationships for grades and teacher assignments

**Next steps:**
- Deploy to staging for testing
- Update any dashboard views that display classes
- Consider adding UI to assign teachers to subjects
- Add validation to prevent orphaned enrollments
