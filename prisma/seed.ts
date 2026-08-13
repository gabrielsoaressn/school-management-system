import {
  PrismaClient,
  UserRole,
  Gender,
  PaymentStatus,
  AttendanceStatus,
  EmployeeType,
  // 🆕 Novos enums - Módulos Avançados
  EnrollmentRequestStatus,
  GuardianType,
  ReminderType,
  ReminderStatus,
  OccurrenceType,
  OccurrenceSeverity,
  DocumentType,
} from "@prisma/client";
import bcrypt from "bcryptjs";
import { schoolDate } from "../src/lib/datetime";

const prisma = new PrismaClient();

// Dados de exemplo
const firstNames = {
  male: [
    "João",
    "Pedro",
    "Lucas",
    "Gabriel",
    "Rafael",
    "Felipe",
    "Bruno",
    "Matheus",
    "Carlos",
    "André",
  ],
  female: [
    "Maria",
    "Ana",
    "Julia",
    "Beatriz",
    "Carolina",
    "Fernanda",
    "Camila",
    "Larissa",
    "Patricia",
    "Amanda",
  ],
};

const lastNames = [
  "Silva",
  "Santos",
  "Oliveira",
  "Souza",
  "Rodrigues",
  "Ferreira",
  "Alves",
  "Pereira",
  "Lima",
  "Costa",
];

const subjects = [
  { name: "Matemática", code: "MAT" },
  { name: "Português", code: "POR" },
  { name: "História", code: "HIS" },
  { name: "Geografia", code: "GEO" },
  { name: "Ciências", code: "CIE" },
  { name: "Física", code: "FIS" },
  { name: "Química", code: "QUI" },
  { name: "Biologia", code: "BIO" },
  { name: "Inglês", code: "ING" },
  { name: "Educação Física", code: "EDF" },
];

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

function randomItem<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}

function randomDate(start: Date, end: Date): Date {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
}

/**
 * A due date `offset` months from the current month, on `day`, at midnight in
 * Sao Paulo. Seed data anchored to fixed dates goes stale: the financial
 * dashboards look at the current month and would show zero.
 */
function dueDateMonthsFromNow(offset: number, day = 10): Date {
  const now = new Date();
  return schoolDate(now.getFullYear(), now.getMonth() + 1 + offset, day);
}

async function main() {
  console.log("🌱 Iniciando seed do banco de dados...");

  // Limpar banco de dados
  console.log("🗑️  Limpando banco de dados...");

  // 🆕 Novas tabelas - Módulos Avançados
  await prisma.generatedDocument.deleteMany();
  await prisma.documentTemplate.deleteMany();
  await prisma.message.deleteMany();
  await prisma.communicationThread.deleteMany();
  await prisma.occurrence.deleteMany();
  await prisma.paymentRenegotiation.deleteMany();
  await prisma.paymentReminder.deleteMany();
  await prisma.financialContact.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.assessment.deleteMany();
  await prisma.assessmentType.deleteMany();
  await prisma.guardianRelationship.deleteMany();
  await prisma.enrollmentRequest.deleteMany();

  // Tabelas existentes
  await prisma.academicReport.deleteMany();
  await prisma.enrollment.deleteMany();
  // Curriculum before classes, classes before the academic year they belong to.
  await prisma.classSubjectTeacher.deleteMany();
  await prisma.class.deleteMany();
  await prisma.teacherSubject.deleteMany();
  await prisma.teacher.deleteMany();
  await prisma.student.deleteMany();
  await prisma.parent.deleteMany();
  await prisma.billing.deleteMany();
  await prisma.payroll.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.subject.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.notification.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.academicYear.deleteMany();
  await prisma.settings.deleteMany();

  const hashedPassword = await bcrypt.hash("password123", 10);

  // 0. Criar configurações do sistema
  console.log("⚙️  Criando configurações do sistema...");
  await prisma.settings.createMany({
    data: [
      {
        key: "default_tuition_monthly",
        value: "1500",
        label: "Mensalidade Padrão",
        type: "number",
      },
      {
        key: "hour_rate",
        value: "50",
        label: "Valor da Hora-Aula",
        type: "number",
      },
      {
        key: "enrollment_fee",
        value: "300",
        label: "Taxa de Matrícula",
        type: "number",
      },
      {
        key: "material_fee",
        value: "200",
        label: "Taxa de Material Escolar",
        type: "number",
      },
      {
        key: "late_payment_fine_percentage",
        value: "2",
        label: "Multa por Atraso (%)",
        type: "number",
      },
      {
        key: "late_payment_interest_daily",
        value: "0.033",
        label: "Juros Diário (%)",
        type: "number",
      },
      {
        key: "auto_generate_billing",
        value: "true",
        label: "Gerar Cobrança Automaticamente",
        type: "boolean",
      },
      {
        key: "billing_due_day",
        value: "10",
        label: "Dia de Vencimento das Mensalidades",
        type: "number",
      },
      {
        key: "school_name",
        value: "Escola D'Ávilla",
        label: "Nome da Escola",
        type: "text",
      },
      {
        key: "school_cnpj",
        value: "12.345.678/0001-90",
        label: "CNPJ da Escola",
        type: "text",
      },
    ],
  });

  // 1. Criar usuário admin
  console.log("👤 Criando usuário admin...");
  const adminUser = await prisma.user.create({
    data: {
      email: "admin@davilla.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  // Create additional staff members
  console.log("👥 Criando equipe de apoio...");
  // `role` is the login role: support staff must not get admin access.
  const staffMembers = [
    {
      type: EmployeeType.COORDINATOR,
      position: "Coordenador Pedagógico",
      salary: 8000,
      role: UserRole.COORDINATOR,
    },
    {
      type: EmployeeType.ADMINISTRATIVE,
      position: "Secretário",
      salary: 4000,
      role: UserRole.SECRETARY,
    },
    {
      type: EmployeeType.ADMINISTRATIVE,
      position: "Analista Financeiro",
      salary: 5000,
      role: UserRole.FINANCE,
    },
    {
      type: EmployeeType.PSYCHOLOGIST,
      position: "Psicólogo Escolar",
      salary: 6000,
      role: UserRole.STAFF,
    },
    {
      type: EmployeeType.CLASSROOM_ASSISTANT,
      position: "Auxiliar de Sala",
      salary: 3000,
      role: UserRole.STAFF,
    },
    {
      type: EmployeeType.HALLWAY_ASSISTANT,
      position: "Auxiliar de Corredor",
      salary: 2800,
      role: UserRole.STAFF,
    },
    {
      type: EmployeeType.MAINTENANCE,
      position: "Zelador",
      salary: 2500,
      role: UserRole.STAFF,
    },
    {
      type: EmployeeType.CLEANING,
      position: "Auxiliar de Limpeza",
      salary: 2300,
      role: UserRole.STAFF,
    },
  ];

  for (let i = 0; i < staffMembers.length; i++) {
    const staff = staffMembers[i];
    const gender = i % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const firstName = randomItem(
      firstNames[gender === Gender.MALE ? "male" : "female"]
    );
    const lastName = randomItem(lastNames);

    const staffUser = await prisma.user.create({
      data: {
        email: `staff${i + 1}@davilla.com`,
        password: hashedPassword,
        role: staff.role,
        isActive: true,
      },
    });

    await prisma.employee.create({
      data: {
        employeeId: `STAFF${String(i + 1).padStart(3, "0")}`,
        userId: staffUser.id,
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date("1975-01-01"), new Date("1995-12-31")),
        gender,
        phoneNumber: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        address: `Rua ${randomItem(lastNames)}, ${Math.floor(Math.random() * 900 + 100)}`,
        employeeType: staff.type,
        position: staff.position,
        department: "Apoio",
        salary: staff.salary,
      },
    });
  }

  // 2. Criar matérias
  console.log("📚 Criando matérias...");
  const createdSubjects = [];
  for (const subject of subjects) {
    for (const gradeLevel of gradeLevels) {
      const created = await prisma.subject.create({
        data: {
          name: subject.name,
          code: `${subject.code}${gradeLevel.charAt(0)}`,
          description: `${subject.name} - ${gradeLevel}`,
          gradeLevel,
          creditHours: 3,
        },
      });
      createdSubjects.push(created);
    }
  }

  // 3. Criar professores
  console.log("👨‍🏫 Criando professores...");
  // subjectId -> professores habilitados, para montar a grade curricular.
  const teacherSubjectMap = new Map<string, string[]>();
  const teachers = [];
  const teacherCount = 15;
  for (let i = 1; i <= teacherCount; i++) {
    const gender = i % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const firstName = randomItem(
      firstNames[gender === Gender.MALE ? "male" : "female"]
    );
    const lastName = randomItem(lastNames);

    const teacherUser = await prisma.user.create({
      data: {
        email: `professor${i}@davilla.com`,
        password: hashedPassword,
        role: UserRole.TEACHER,
        isActive: true,
      },
    });

    const employee = await prisma.employee.create({
      data: {
        employeeId: `PROF${String(i).padStart(3, "0")}`,
        userId: teacherUser.id,
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date("1975-01-01"), new Date("1995-12-31")),
        gender,
        phoneNumber: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        address: `Rua ${randomItem(lastNames)}, ${Math.floor(Math.random() * 900 + 100)}`,
        employeeType: EmployeeType.TEACHER,
        position: "Professor",
        department: "Ensino",
        salary: Math.floor(Math.random() * 5000) + 5000,
      },
    });

    const teacher = await prisma.teacher.create({
      data: {
        employeeId: employee.id,
        qualification: randomItem([
          "Licenciatura",
          "Bacharelado",
          "Mestrado",
          "Doutorado",
        ]),
        specialization: randomItem(subjects).name,
        experience: Math.floor(Math.random() * 20) + 1,
      },
    });

    teachers.push(teacher);

    // Distribui as disciplinas em rodízio entre os professores, de modo que
    // toda disciplina tenha ao menos um professor habilitado. A versão anterior
    // sorteava (`Math.random() > 0.7`) e deixava a maior parte da grade sem
    // professor, o que esvaziava o portal do professor.
    const teacherSubjects = createdSubjects.filter(
      (_, index) => index % teacherCount === i - 1
    );

    for (const subject of teacherSubjects) {
      await prisma.teacherSubject.create({
        data: {
          teacherId: teacher.id,
          subjectId: subject.id,
        },
      });

      // Índice usado depois para montar a grade curricular das turmas.
      const eligible = teacherSubjectMap.get(subject.id) ?? [];
      eligible.push(teacher.id);
      teacherSubjectMap.set(subject.id, eligible);
    }
  }

  // 4. Criar pais e alunos
  console.log("👨‍👩‍👧‍👦 Criando pais e alunos...");
  const students = [];

  for (let i = 1; i <= 50; i++) {
    const gender = i % 2 === 0 ? Gender.FEMALE : Gender.MALE;
    const firstName = randomItem(
      firstNames[gender === Gender.MALE ? "male" : "female"]
    );
    const lastName = randomItem(lastNames);

    // Criar pai/mãe
    const parentGender = Math.random() > 0.5 ? Gender.MALE : Gender.FEMALE;
    const parentFirstName = randomItem(
      firstNames[parentGender === Gender.MALE ? "male" : "female"]
    );

    const parentUser = await prisma.user.create({
      data: {
        email: `responsavel${i}@davilla.com`,
        password: hashedPassword,
        role: UserRole.PARENT,
        isActive: true,
      },
    });

    const parent = await prisma.parent.create({
      data: {
        userId: parentUser.id,
        firstName: parentFirstName,
        lastName: lastName,
        phoneNumber: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        address: `Rua ${randomItem(lastNames)}, ${Math.floor(Math.random() * 900 + 100)}`,
        occupation: randomItem([
          "Engenheiro",
          "Médico",
          "Professor",
          "Empresário",
          "Advogado",
          "Contador",
        ]),
      },
    });

    // Criar aluno
    const studentUser = await prisma.user.create({
      data: {
        email: `aluno${i}@davilla.com`,
        password: hashedPassword,
        role: UserRole.STUDENT,
        isActive: true,
      },
    });

    const gradeLevel = randomItem(gradeLevels);
    const section = randomItem(sections);

    const student = await prisma.student.create({
      data: {
        studentId: `EST${String(i).padStart(4, "0")}`,
        userId: studentUser.id,
        firstName,
        lastName,
        dateOfBirth: randomDate(new Date("2008-01-01"), new Date("2018-12-31")),
        gender,
        address: `Rua ${randomItem(lastNames)}, ${Math.floor(Math.random() * 900 + 100)}`,
        phoneNumber: `(11) 9${Math.floor(Math.random() * 9000 + 1000)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        parentId: parent.id,
      },
    });

    // The grade level lives on the enrolment now; carry it alongside the row
    // while the seed builds the rest of the data.
    students.push({ ...student, gradeLevel, section });
  }

  // 5. Ano letivo corrente
  console.log("📆 Criando ano letivo...");
  const year = new Date().getFullYear();
  const academicYear = await prisma.academicYear.create({
    data: {
      year,
      startDate: schoolDate(year, 2, 1),
      endDate: schoolDate(year, 12, 20),
      isCurrent: true,
      status: "ACTIVE",
    },
  });

  // 6. Turmas: uma por série/seção, dentro do ano letivo
  console.log("🏫 Criando turmas...");
  const classes = [];
  for (const gradeLevel of gradeLevels) {
    for (const section of sections) {
      const classData = await prisma.class.create({
        data: {
          name: `${gradeLevel} - Turma ${section}`,
          gradeLevel,
          section,
          academicYearId: academicYear.id,
          roomNumber: `${Math.floor(Math.random() * 3) + 1}${Math.floor(Math.random() * 10)}${Math.floor(Math.random() * 10)}`,
          schedule: "Segunda a Sexta, 7h-12h",
          capacity: 30,
        },
      });

      classes.push(classData);
    }
  }

  // 7. Grade curricular: quem leciona o quê em cada turma. É isto que autoriza
  // um professor a lançar nota e chamada.
  console.log("📘 Montando grade curricular...");
  let assignmentCount = 0;
  for (const classData of classes) {
    const gradeSubjects = createdSubjects.filter(
      (subject) => subject.gradeLevel === classData.gradeLevel
    );

    for (const subject of gradeSubjects) {
      const eligible = teacherSubjectMap.get(subject.id) ?? [];

      await prisma.classSubjectTeacher.create({
        data: {
          classId: classData.id,
          subjectId: subject.id,
          teacherId: eligible.length > 0 ? randomItem(eligible) : null,
          academicYearId: academicYear.id,
          weeklyPeriods: 2,
        },
      });
      assignmentCount++;
    }
  }
  console.log(`   ${assignmentCount} vínculos turma/disciplina/professor`);

  // 8. Matricular alunos nas turmas
  console.log("📝 Matriculando alunos...");
  for (const student of students) {
    const studentClass = classes.find(
      (c) =>
        c.gradeLevel === student.gradeLevel && c.section === student.section
    );

    if (studentClass) {
      await prisma.enrollment.create({
        data: {
          studentId: student.id,
          classId: studentClass.id,
          academicYearId: academicYear.id,
          gradeLevel: studentClass.gradeLevel,
          section: studentClass.section,
          status: "ACTIVE",
        },
      });
    }
  }

  // 12. Criar despesas
  console.log("💸 Criando despesas...");
  const expenseCategories = [
    "Salários",
    "Manutenção",
    "Material Didático",
    "Infraestrutura",
    "Serviços",
  ];
  for (let i = 0; i < 30; i++) {
    await prisma.expense.create({
      data: {
        category: randomItem(expenseCategories),
        description: `Despesa ${i + 1}`,
        amount: Math.floor(Math.random() * 10000) + 1000,
        date: randomDate(new Date("2026-01-01"), new Date()),
        paymentMethod: randomItem(["Transferência", "Boleto", "Cheque"]),
      },
    });
  }

  // 13. Criar anúncios
  console.log("📢 Criando anúncios...");
  await prisma.announcement.create({
    data: {
      title: "Bem-vindos ao D'Ávilla!",
      content:
        "Estamos felizes em tê-los conosco neste ano letivo de 2026. Desejamos a todos um excelente ano de aprendizado e crescimento.",
      priority: "high",
      createdBy: adminUser.id,
    },
  });

  await prisma.announcement.create({
    data: {
      title: "Reunião de Pais e Mestres",
      content:
        "A reunião de pais e mestres será realizada no dia 20 de março às 19h. Contamos com a presença de todos!",
      targetRole: "PARENT",
      priority: "normal",
      expiresAt: new Date("2026-03-20"),
      createdBy: adminUser.id,
    },
  });

  // ============================================
  // 🆕 MÓDULO 1: MATRÍCULA DIGITAL
  // ============================================

  console.log("📝 Criando solicitações de matrícula...");

  // Criar algumas solicitações de matrícula pendentes
  const enrollmentRequests = [
    {
      status: EnrollmentRequestStatus.PENDING,
      studentFirstName: "Lucas",
      studentLastName: "Mendes",
      gender: Gender.MALE,
      gradeLevel: "6º Ano",
      financialGuardianFirstName: "Roberto",
      financialGuardianLastName: "Mendes",
      financialGuardianCPF: "123.456.789-01",
      financialGuardianPhone: "(11) 98888-8888",
      financialGuardianEmail: "roberto.mendes@email.com",
      isSameGuardian: true,
    },
    {
      status: EnrollmentRequestStatus.UNDER_REVIEW,
      studentFirstName: "Isabella",
      studentLastName: "Rocha",
      gender: Gender.FEMALE,
      gradeLevel: "7º Ano",
      financialGuardianFirstName: "Marcos",
      financialGuardianLastName: "Rocha",
      financialGuardianCPF: "234.567.890-12",
      financialGuardianPhone: "(11) 97777-7777",
      financialGuardianEmail: "marcos.rocha@email.com",
      pedagogicalGuardianFirstName: "Sandra",
      pedagogicalGuardianLastName: "Rocha",
      pedagogicalGuardianCPF: "345.678.901-23",
      pedagogicalGuardianPhone: "(11) 97777-7778",
      pedagogicalGuardianEmail: "sandra.rocha@email.com",
      isSameGuardian: false,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
    {
      status: EnrollmentRequestStatus.APPROVED,
      studentFirstName: "Miguel",
      studentLastName: "Cardoso",
      gender: Gender.MALE,
      gradeLevel: "3º Ano",
      financialGuardianFirstName: "Patricia",
      financialGuardianLastName: "Cardoso",
      financialGuardianCPF: "456.789.012-34",
      financialGuardianPhone: "(11) 96666-6666",
      financialGuardianEmail: "patricia.cardoso@email.com",
      isSameGuardian: true,
      reviewedBy: adminUser.id,
      reviewedAt: new Date(),
    },
  ];

  for (let i = 0; i < enrollmentRequests.length; i++) {
    const req = enrollmentRequests[i];
    await prisma.enrollmentRequest.create({
      data: {
        requestNumber: `ENR-2026-${String(i + 1).padStart(4, "0")}`,
        status: req.status,
        studentFirstName: req.studentFirstName,
        studentLastName: req.studentLastName,
        dateOfBirth: randomDate(new Date("2010-01-01"), new Date("2018-12-31")),
        gender: req.gender,
        gradeLevel: req.gradeLevel,
        section: "A",
        financialGuardianFirstName: req.financialGuardianFirstName,
        financialGuardianLastName: req.financialGuardianLastName,
        financialGuardianCPF: req.financialGuardianCPF,
        financialGuardianPhone: req.financialGuardianPhone,
        financialGuardianEmail: req.financialGuardianEmail,
        pedagogicalGuardianFirstName: req.pedagogicalGuardianFirstName,
        pedagogicalGuardianLastName: req.pedagogicalGuardianLastName,
        pedagogicalGuardianCPF: req.pedagogicalGuardianCPF,
        pedagogicalGuardianPhone: req.pedagogicalGuardianPhone,
        pedagogicalGuardianEmail: req.pedagogicalGuardianEmail,
        isSameGuardian: req.isSameGuardian,
        address: `Rua ${randomItem(lastNames)}, ${Math.floor(Math.random() * 900 + 100)}`,
        city: "São Paulo",
        state: "SP",
        zipCode: `${Math.floor(Math.random() * 90000 + 10000)}-${Math.floor(Math.random() * 900 + 100)}`,
        reviewedBy: req.reviewedBy,
        reviewedAt: req.reviewedAt,
      },
    });
  }

  // Criar relacionamentos de responsáveis (FINANCIAL/PEDAGOGICAL)
  console.log("👨‍👩‍👧 Criando relacionamentos de responsáveis...");

  // Para os primeiros 10 alunos, criar relacionamentos explícitos
  for (let i = 0; i < Math.min(10, students.length); i++) {
    const student = students[i];
    if (student.parentId) {
      await prisma.guardianRelationship.create({
        data: {
          studentId: student.id,
          parentId: student.parentId,
          guardianType: GuardianType.BOTH,
          isPrimary: true,
          canPickup: true,
        },
      });
    }
  }

  // ============================================
  // 🆕 MÓDULO 2: GESTÃO ACADÊMICA
  // ============================================

  console.log("📚 Criando tipos de avaliação...");

  const assessmentTypes = [
    { name: "Prova Bimestral", code: "P1", weight: 0.4, maxScore: 10 },
    { name: "Trabalho em Grupo", code: "TG", weight: 0.3, maxScore: 10 },
    { name: "Participação", code: "PART", weight: 0.2, maxScore: 10 },
    { name: "Atividades", code: "ATIV", weight: 0.1, maxScore: 10 },
  ];

  const createdAssessmentTypes = [];
  for (const type of assessmentTypes) {
    const created = await prisma.assessmentType.create({
      data: {
        name: type.name,
        code: type.code,
        weight: type.weight,
        maxScore: type.maxScore,
        description: `Avaliação do tipo ${type.name}`,
      },
    });
    createdAssessmentTypes.push(created);
  }

  console.log("📊 Criando avaliações detalhadas...");

  // Criar algumas avaliações para os primeiros 20 alunos
  for (let i = 0; i < Math.min(20, students.length); i++) {
    const student = students[i];

    // Get student's class
    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id },
    });

    if (!enrollment) continue;

    // Get subjects for this grade
    const studentSubjects = createdSubjects
      .filter((s) => s.gradeLevel === student.gradeLevel)
      .slice(0, 3); // Limit to 3 subjects

    for (const subject of studentSubjects) {
      // Find a teacher for this subject
      const teacherSubjects = await prisma.teacherSubject.findMany({
        where: { subjectId: subject.id },
      });

      const teacherSubject =
        teacherSubjects.length > 0
          ? teacherSubjects[Math.floor(Math.random() * teacherSubjects.length)]
          : null;

      // Create assessments for each type
      for (const assessmentType of createdAssessmentTypes) {
        const score = Math.random() * 10; // 0-10

        await prisma.assessment.create({
          data: {
            studentId: student.id,
            subjectId: subject.id,
            classId: enrollment.classId,
            teacherId: teacherSubject?.teacherId,
            assessmentTypeId: assessmentType.id,
            term: "1º Bimestre",
            academicYearId: academicYear.id,
            score: parseFloat(score.toFixed(2)),
            maxScore: assessmentType.maxScore,
            grade: score >= 7 ? "A" : score >= 6 ? "B" : score >= 5 ? "C" : "D",
            assessmentDate: randomDate(academicYear.startDate, new Date()),
          },
        });
      }
    }
  }

  console.log("📅 Criando registros de presença detalhados...");

  // Criar registros de presença para os primeiros 10 alunos (últimos 10 dias úteis)
  for (let i = 0; i < Math.min(10, students.length); i++) {
    const student = students[i];

    const enrollment = await prisma.enrollment.findFirst({
      where: { studentId: student.id },
    });

    if (!enrollment) continue;

    // Get one subject for this student
    const studentSubject = createdSubjects.find(
      (s) => s.gradeLevel === student.gradeLevel
    );

    if (!studentSubject) continue;

    // Last 10 business days
    let daysAdded = 0;
    const currentDate = new Date();

    while (daysAdded < 10) {
      // Skip weekends
      if (currentDate.getDay() !== 0 && currentDate.getDay() !== 6) {
        const random = Math.random();
        let status: AttendanceStatus;

        if (random > 0.95) status = AttendanceStatus.ABSENT;
        else if (random > 0.9) status = AttendanceStatus.LATE;
        else status = AttendanceStatus.PRESENT;

        await prisma.attendanceRecord.create({
          data: {
            studentId: student.id,
            classId: enrollment.classId,
            subjectId: studentSubject.id,
            academicYearId: academicYear.id,
            date: new Date(currentDate),
            status,
          },
        });

        daysAdded++;
      }

      currentDate.setDate(currentDate.getDate() - 1);
    }
  }

  // ============================================
  // 🆕 MÓDULO 3: FINANCEIRO AVANÇADO
  // ============================================

  console.log("💰 Criando cobranças para responsáveis...");

  // Criar algumas cobranças (Billing) para os primeiros 20 pais
  const parentsWithBillings = await prisma.parent.findMany({
    take: 20,
  });

  for (let i = 0; i < parentsWithBillings.length; i++) {
    const parent = parentsWithBillings[i];

    // Relative to today, so the dashboards always have a current month to show:
    // one paid last month, one overdue last month, one open this month.
    const billings = [
      {
        status: PaymentStatus.PAID,
        dueDate: dueDateMonthsFromNow(-1),
        paidDate: dueDateMonthsFromNow(-1, 8),
      },
      {
        status: PaymentStatus.OVERDUE,
        dueDate: dueDateMonthsFromNow(-1),
        paidDate: null,
      },
      {
        status: PaymentStatus.PENDING,
        dueDate: dueDateMonthsFromNow(0),
        paidDate: null,
      },
    ];

    for (let j = 0; j < billings.length; j++) {
      const billing = billings[j];

      const createdBilling = await prisma.billing.create({
        data: {
          invoiceNumber: `BILL-${String(i * 3 + j + 1).padStart(6, "0")}`,
          parentId: parent.id,
          type: "TUITION",
          description: "Mensalidade escolar",
          amount: 1500 + Math.random() * 500,
          dueDate: billing.dueDate,
          paidDate: billing.paidDate,
          status: billing.status,
          paymentMethod: billing.paidDate
            ? randomItem(["PIX", "Cartão", "Boleto"])
            : null,
        },
      });

      // Para cobranças vencidas, criar lembretes
      if (billing.status === PaymentStatus.OVERDUE) {
        // Criar 2 lembretes
        await prisma.paymentReminder.create({
          data: {
            billingId: createdBilling.id,
            reminderType: ReminderType.EMAIL,
            status: ReminderStatus.DELIVERED,
            recipientName: `${parent.firstName} ${parent.lastName}`,
            recipientEmail:
              parent.email || `${parent.firstName.toLowerCase()}@email.com`,
            subject: "Lembrete: Mensalidade em atraso",
            message: `Prezado(a) ${parent.firstName}, identificamos que a mensalidade com vencimento em ${billing.dueDate.toLocaleDateString("pt-BR")} está em atraso. Por favor, regularize sua situação.`,
            templateUsed: "reminder_overdue",
            sentAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 dias atrás
            deliveredAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 + 60000),
          },
        });

        await prisma.paymentReminder.create({
          data: {
            billingId: createdBilling.id,
            reminderType: ReminderType.WHATSAPP,
            status: ReminderStatus.SENT,
            recipientName: `${parent.firstName} ${parent.lastName}`,
            recipientPhone: parent.phoneNumber,
            message: `Olá ${parent.firstName}! Sua mensalidade está em atraso. Acesse o portal para regularizar.`,
            templateUsed: "reminder_whatsapp",
            sentAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias atrás
          },
        });
      }
    }
  }

  console.log("🔄 Criando renegociações...");

  // Criar algumas renegociações
  const overdueBillings = await prisma.billing.findMany({
    where: { status: PaymentStatus.OVERDUE },
    take: 3,
  });

  for (const billing of overdueBillings) {
    await prisma.paymentRenegotiation.create({
      data: {
        billingId: billing.id,
        originalAmount: billing.amount,
        renegotiatedAmount: billing.amount.times(0.9).toDecimalPlaces(2), // 10% desconto
        discount: billing.amount.times(0.1).toDecimalPlaces(2),
        installments: 3,
        newDueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
        renegotiatedBy: adminUser.id,
        reason: "Dificuldade financeira temporária",
        notes: "Acordo de parcelamento em 3x sem juros",
      },
    });

    // Atualizar status da cobrança
    await prisma.billing.update({
      where: { id: billing.id },
      data: { status: PaymentStatus.RENEGOTIATED },
    });
  }

  console.log("📞 Criando contatos financeiros...");

  // Criar contatos financeiros para os primeiros 15 pais
  for (let i = 0; i < Math.min(15, parentsWithBillings.length); i++) {
    const parent = parentsWithBillings[i];

    await prisma.financialContact.create({
      data: {
        parentId: parent.id,
        contactType: "PRIMARY",
        name: `${parent.firstName} ${parent.lastName}`,
        email: parent.email || `${parent.firstName.toLowerCase()}@email.com`,
        phoneNumber: parent.phoneNumber,
        whatsappNumber: parent.phoneNumber,
        preferredMethod: randomItem(["EMAIL", "WHATSAPP"]),
        isActive: true,
      },
    });
  }

  // Atualizar pais com whatsappNumber
  await prisma.parent.updateMany({
    data: {
      whatsappNumber: null, // Will be set individually
    },
  });

  for (const parent of parentsWithBillings.slice(0, 15)) {
    await prisma.parent.update({
      where: { id: parent.id },
      data: { whatsappNumber: parent.phoneNumber },
    });
  }

  // ============================================
  // 🆕 MÓDULO 4: PORTAL DE COMUNICAÇÃO
  // ============================================

  console.log("📢 Criando ocorrências pedagógicas...");

  const occurrences = [
    {
      type: OccurrenceType.BEHAVIORAL,
      severity: OccurrenceSeverity.LOW,
      title: "Conversa em sala",
      description:
        "Aluno foi advertido por conversar durante a aula de matemática.",
    },
    {
      type: OccurrenceType.POSITIVE,
      severity: OccurrenceSeverity.LOW,
      title: "Excelente participação",
      description:
        "Aluno demonstrou excelente participação e ajudou colegas com dificuldade.",
    },
    {
      type: OccurrenceType.ACADEMIC,
      severity: OccurrenceSeverity.MEDIUM,
      title: "Tarefa não entregue",
      description:
        "Aluno não entregou a tarefa de casa pela terceira vez consecutiva.",
    },
    {
      type: OccurrenceType.ATTENDANCE,
      severity: OccurrenceSeverity.HIGH,
      title: "Faltas excessivas",
      description:
        "Aluno ultrapassou 10% de faltas no bimestre. Responsável será convocado.",
    },
  ];

  for (let i = 0; i < Math.min(10, students.length); i++) {
    const student = students[i];
    const occurrence = randomItem(occurrences);

    await prisma.occurrence.create({
      data: {
        studentId: student.id,
        type: occurrence.type,
        severity: occurrence.severity,
        title: occurrence.title,
        description: occurrence.description,
        reportedBy: teachers[i % teachers.length]?.id || adminUser.id,
        reportedByName: `Prof. ${randomItem(firstNames.male)} ${randomItem(lastNames)}`,
        date: randomDate(new Date("2026-02-01"), new Date()),
        parentNotified: Math.random() > 0.5,
        parentViewedAt:
          Math.random() > 0.7
            ? randomDate(new Date("2026-02-10"), new Date())
            : null,
      },
    });
  }

  console.log("💬 Criando threads de comunicação...");

  // Criar algumas threads de comunicação
  for (let i = 0; i < 5; i++) {
    const parent = parentsWithBillings[i];

    const thread = await prisma.communicationThread.create({
      data: {
        subject: randomItem([
          "Dúvida sobre tarefa de casa",
          "Solicitação de reunião",
          "Feedback sobre desempenho",
          "Informação sobre evento",
        ]),
        senderId: parent.userId,
        senderName: `${parent.firstName} ${parent.lastName}`,
        senderRole: "PARENT",
        recipientId: adminUser.id,
        recipientName: "Coordenação Pedagógica",
        recipientRole: "ADMIN",
        lastMessageAt: new Date(),
      },
    });

    // Criar 2-3 mensagens na thread
    const messageCount = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < messageCount; j++) {
      const isFromParent = j % 2 === 0;

      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: isFromParent ? parent.userId : adminUser.id,
          senderName: isFromParent
            ? `${parent.firstName} ${parent.lastName}`
            : "Coordenação",
          content: isFromParent
            ? "Gostaria de agendar uma reunião para conversar sobre o desempenho do meu filho."
            : "Claro! Temos disponibilidade na próxima terça-feira às 14h. Confirma?",
          isRead: Math.random() > 0.3,
          readAt: Math.random() > 0.5 ? new Date() : null,
        },
      });
    }
  }

  // ============================================
  // 🆕 MÓDULO 5: GERADOR DE DOCUMENTOS
  // ============================================

  console.log("📄 Criando templates de documentos...");

  const templates = [
    {
      name: "Declaração de Matrícula",
      type: DocumentType.ENROLLMENT_DECLARATION,
      description: "Declaração padrão de matrícula do aluno",
      htmlTemplate: `
        <html>
          <body>
            <h1>DECLARAÇÃO DE MATRÍCULA</h1>
            <p>Declaramos para os devidos fins que <strong>{{student.fullName}}</strong>,
            portador(a) do CPF <strong>{{student.cpf}}</strong>, nascido(a) em <strong>{{student.dateOfBirth}}</strong>,
            está regularmente matriculado(a) no <strong>{{student.gradeLevel}}</strong> - Turma <strong>{{student.section}}</strong>,
            no ano letivo de <strong>{{student.academicYear}}</strong>.</p>
            <p>Responsável Financeiro: <strong>{{parent.fullName}}</strong>, CPF: <strong>{{parent.cpf}}</strong></p>
            <br><br>
            <p>{{school.name}}<br>CNPJ: {{school.cnpj}}</p>
            <p>Data: {{document.generatedDate}}</p>
          </body>
        </html>
      `,
      availableVariables: JSON.stringify([
        "student.fullName",
        "student.cpf",
        "student.dateOfBirth",
        "student.gradeLevel",
        "student.section",
        "student.academicYear",
        "parent.fullName",
        "parent.cpf",
        "school.name",
        "school.cnpj",
        "document.generatedDate",
      ]),
    },
    {
      name: "Contrato de Prestação de Serviços",
      type: DocumentType.SERVICE_CONTRACT,
      description: "Contrato padrão de prestação de serviços educacionais",
      htmlTemplate: `
        <html>
          <body>
            <h1>CONTRATO DE PRESTAÇÃO DE SERVIÇOS EDUCACIONAIS</h1>
            <p><strong>CONTRATANTE:</strong> {{parent.fullName}}, CPF: {{parent.cpf}}</p>
            <p><strong>CONTRATADA:</strong> {{school.name}}, CNPJ: {{school.cnpj}}</p>
            <h2>CLÁUSULA PRIMEIRA - DO OBJETO</h2>
            <p>O presente contrato tem por objeto a prestação de serviços educacionais ao aluno
            <strong>{{student.fullName}}</strong>, matriculado no <strong>{{student.gradeLevel}}</strong>.</p>
            <h2>CLÁUSULA SEGUNDA - DO VALOR</h2>
            <p>O valor da mensalidade é de <strong>R$ {{tuition.amount}}</strong>,
            com vencimento todo dia <strong>{{tuition.dueDay}}</strong>.</p>
            <br><br>
            <p>Data: {{document.generatedDate}}</p>
            <p>____________________<br>{{parent.fullName}}</p>
          </body>
        </html>
      `,
      availableVariables: JSON.stringify([
        "student.fullName",
        "student.gradeLevel",
        "parent.fullName",
        "parent.cpf",
        "school.name",
        "school.cnpj",
        "tuition.amount",
        "tuition.dueDay",
        "document.generatedDate",
      ]),
    },
  ];

  for (const template of templates) {
    await prisma.documentTemplate.create({
      data: {
        name: template.name,
        type: template.type,
        description: template.description,
        htmlTemplate: template.htmlTemplate,
        availableVariables: template.availableVariables,
        isActive: true,
      },
    });
  }

  console.log("📝 Gerando documentos de exemplo...");

  // Gerar alguns documentos para os primeiros 5 alunos
  const documentTemplates = await prisma.documentTemplate.findMany();

  for (let i = 0; i < Math.min(5, students.length); i++) {
    const student = students[i];
    const template = documentTemplates[i % documentTemplates.length];

    if (!template) continue;

    await prisma.generatedDocument.create({
      data: {
        templateId: template.id,
        studentId: student.id,
        type: template.type,
        generatedHtml: template.htmlTemplate
          .replace(
            "{{student.fullName}}",
            `${student.firstName} ${student.lastName}`
          )
          .replace("{{student.gradeLevel}}", student.gradeLevel)
          .replace(
            "{{document.generatedDate}}",
            new Date().toLocaleDateString("pt-BR")
          ),
        generatedBy: adminUser.id,
        generatedAt: new Date(),
        metadata: JSON.stringify({
          purpose: "Transferência de escola",
          requestedBy: "Responsável",
        }),
      },
    });
  }

  console.log("✅ Seed concluído com sucesso!");
  console.log("\n📊 Resumo:");
  console.log("\n🎯 Dados Básicos:");
  console.log(`  - ${await prisma.user.count()} usuários`);
  console.log(`  - ${await prisma.student.count()} alunos`);
  console.log(`  - ${await prisma.teacher.count()} professores`);
  console.log(`  - ${await prisma.parent.count()} responsáveis`);
  console.log(`  - ${await prisma.subject.count()} matérias`);
  console.log(`  - ${await prisma.class.count()} turmas`);
  console.log(`  - ${await prisma.enrollment.count()} matrículas`);
  console.log(`  - ${await prisma.expense.count()} despesas`);

  console.log("\n🆕 Módulos Avançados:");
  console.log(`  📝 Módulo 1 - Matrícula Digital:`);
  console.log(
    `     - ${await prisma.enrollmentRequest.count()} solicitações de matrícula`
  );
  console.log(
    `     - ${await prisma.guardianRelationship.count()} relacionamentos de responsáveis`
  );

  console.log(`  📚 Módulo 2 - Gestão Acadêmica:`);
  console.log(
    `     - ${await prisma.assessmentType.count()} tipos de avaliação`
  );
  console.log(
    `     - ${await prisma.assessment.count()} avaliações detalhadas`
  );
  console.log(
    `     - ${await prisma.attendanceRecord.count()} registros de presença (novos)`
  );

  console.log(`  💰 Módulo 3 - Financeiro Avançado:`);
  console.log(`     - ${await prisma.billing.count()} cobranças (billings)`);
  console.log(
    `     - ${await prisma.paymentReminder.count()} lembretes enviados`
  );
  console.log(
    `     - ${await prisma.paymentRenegotiation.count()} renegociações`
  );
  console.log(
    `     - ${await prisma.financialContact.count()} contatos financeiros`
  );

  console.log(`  📢 Módulo 4 - Portal de Comunicação:`);
  console.log(
    `     - ${await prisma.occurrence.count()} ocorrências pedagógicas`
  );
  console.log(
    `     - ${await prisma.communicationThread.count()} threads de comunicação`
  );
  console.log(`     - ${await prisma.message.count()} mensagens`);

  console.log(`  📄 Módulo 5 - Gerador de Documentos:`);
  console.log(
    `     - ${await prisma.documentTemplate.count()} templates de documentos`
  );
  console.log(
    `     - ${await prisma.generatedDocument.count()} documentos gerados`
  );

  console.log("\n🔑 Credenciais de acesso:");
  console.log("  Admin: admin@davilla.com / password123");
  console.log("  Professor: professor1@davilla.com / password123");
  console.log("  Responsável: responsavel1@davilla.com / password123");
  console.log("  Aluno: aluno1@davilla.com / password123");
}

main()
  .catch((e) => {
    console.error("❌ Erro durante o seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
