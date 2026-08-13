import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/datetime";

/** Four statuses, each with its own label: "Justificado" covered two of them. */
const ATTENDANCE_LABELS: Record<
  "PRESENT" | "ABSENT" | "LATE" | "EXCUSED",
  { label: string; className: string }
> = {
  PRESENT: { label: "Presente", className: "bg-green-100 text-green-800" },
  ABSENT: { label: "Falta", className: "bg-red-100 text-red-800" },
  LATE: { label: "Atraso", className: "bg-yellow-100 text-yellow-800" },
  EXCUSED: {
    label: "Falta justificada",
    className: "bg-blue-100 text-blue-800",
  },
};

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STUDENT") {
    redirect("/login");
  }

  // Assessments and attendance records — the same rows the teacher writes from
  // the class register — scoped to the current academic year. This screen used
  // to read the legacy Grade/Attendance pair, so it never showed what the
  // teacher had entered.
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        where: { status: "ACTIVE", academicYear: { isCurrent: true } },
        include: {
          class: { include: { _count: { select: { enrollments: true } } } },
          academicYear: true,
        },
        take: 1,
      },
      assessments: {
        where: { academicYear: { isCurrent: true } },
        include: { subject: true, assessmentType: true },
        orderBy: { assessmentDate: "desc" },
        take: 10,
      },
      attendanceRecords: {
        where: { academicYear: { isCurrent: true } },
        orderBy: { date: "desc" },
        take: 20,
      },
    },
  });

  const attendanceRecords = student?.attendanceRecords ?? [];
  const totalAttendances = attendanceRecords.length;
  const presentAttendances = attendanceRecords.filter(
    (record) => record.status === "PRESENT" || record.status === "LATE"
  ).length;
  const attendancePercentage =
    totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 0;

  // Average as a percentage of each assessment's maximum, so a test out of 10
  // and one out of 100 weigh the same.
  const assessments = student?.assessments ?? [];
  const averageScore =
    assessments.length > 0
      ? assessments.reduce(
          (total, assessment) =>
            total +
            (assessment.maxScore > 0
              ? (assessment.score / assessment.maxScore) * 10
              : 0),
          0
        ) / assessments.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="rounded-sm border border-gray-200 bg-white p-6 shadow-sm">
          <h1 className="mb-2 text-3xl font-bold text-gray-900">
            Painel do Aluno
          </h1>
          <p className="mb-6 text-gray-600">
            Bem-vindo,{" "}
            {student ? `${student.firstName} ${student.lastName}` : user.email}!
          </p>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {/* Class Card */}
            <div className="rounded-sm border border-indigo-700 bg-indigo-600 p-6 text-white">
              <h3 className="mb-2 text-lg font-semibold">Minha Turma</h3>
              <p className="text-3xl font-bold">
                {student?.enrollments && student.enrollments.length > 0
                  ? student.enrollments[0].class.name
                  : "Não matriculado"}
              </p>
              <p className="text-sm text-indigo-100">
                {student?.enrollments && student.enrollments.length > 0
                  ? student.enrollments[0].class._count.enrollments
                  : 0}{" "}
                alunos
              </p>
            </div>

            {/* Attendance Card */}
            <div className="rounded-sm border border-green-700 bg-green-600 p-6 text-white">
              <h3 className="mb-2 text-lg font-semibold">Frequência</h3>
              <p className="text-3xl font-bold">
                {attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-green-100">
                {presentAttendances} de {totalAttendances} aulas
              </p>
            </div>

            {/* Average Grade Card */}
            <div className="rounded-sm border border-purple-700 bg-purple-600 p-6 text-white">
              <h3 className="mb-2 text-lg font-semibold">Média Geral</h3>
              <p className="text-3xl font-bold">{averageScore.toFixed(1)}</p>
              <p className="text-sm text-purple-100">
                {assessments.length} avaliações
              </p>
            </div>
          </div>

          {/* Student Info */}
          {student && (
            <div className="mt-8">
              <h2 className="mb-4 text-2xl font-bold text-gray-900">
                Informações Pessoais
              </h2>
              <div className="rounded-sm border border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm text-gray-600">Nome Completo</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {student.firstName} {student.lastName}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {student.user.email}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Data de Nascimento</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {new Date(student.dateOfBirth).toLocaleDateString(
                        "pt-BR"
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Turma</p>
                    <p className="text-lg font-semibold text-gray-900">
                      {student.enrollments && student.enrollments.length > 0
                        ? student.enrollments[0].class.name
                        : "Não matriculado"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent Grades */}
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Notas Recentes
            </h2>
            <div className="overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Matéria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Nota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Avaliação
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Bimestre
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {assessments.map((assessment) => {
                    // Colour by percentage of the maximum, not by the raw score:
                    // a 7 out of 10 and a 70 out of 100 are the same result.
                    const percentage =
                      assessment.maxScore > 0
                        ? (assessment.score / assessment.maxScore) * 100
                        : 0;

                    return (
                      <tr key={assessment.id}>
                        <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                          {assessment.subject.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                          <span
                            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                              percentage >= 70
                                ? "bg-green-100 text-green-800"
                                : percentage >= 50
                                  ? "bg-yellow-100 text-yellow-800"
                                  : "bg-red-100 text-red-800"
                            }`}
                          >
                            {assessment.score.toFixed(1)} /{" "}
                            {assessment.maxScore.toFixed(0)}
                            {assessment.grade ? ` (${assessment.grade})` : ""}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {assessment.assessmentType.name}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {assessment.term}
                        </td>
                        <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-600">
                          {formatDate(assessment.assessmentDate)}
                        </td>
                      </tr>
                    );
                  })}
                  {assessments.length === 0 && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Nenhuma nota registrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Recent Attendance */}
          <div className="mt-8">
            <h2 className="mb-4 text-2xl font-bold text-gray-900">
              Frequência Recente
            </h2>
            <div className="overflow-hidden rounded-sm border border-gray-200 bg-gray-50">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {attendanceRecords.map((record) => (
                    <tr key={record.id}>
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {formatDate(record.date)}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            ATTENDANCE_LABELS[record.status].className
                          }`}
                        >
                          {ATTENDANCE_LABELS[record.status].label}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <tr>
                      <td
                        colSpan={2}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Nenhuma frequência registrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
