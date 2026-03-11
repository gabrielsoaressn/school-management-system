import { getCurrentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";

export default async function StudentDashboard() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "STUDENT") {
    redirect("/login");
  }

  // Fetch student data
  const student = await prisma.student.findUnique({
    where: { userId: user.id },
    include: {
      user: true,
      enrollments: {
        include: {
          class: {
            include: {
              _count: {
                select: {
                  enrollments: true,
                },
              },
            },
          },
        },
      },
      grades: {
        include: {
          subject: true,
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 10,
      },
      attendance: {
        orderBy: {
          date: "desc",
        },
        take: 10,
      },
    },
  });

  // Calculate attendance percentage
  const totalAttendances = student?.attendance.length || 0;
  const presentAttendances =
    student?.attendance.filter((a) => a.status === "PRESENT").length || 0;
  const attendancePercentage =
    totalAttendances > 0 ? (presentAttendances / totalAttendances) * 100 : 0;

  // Calculate average score
  const grades = student?.grades || [];
  const averageScore =
    grades.length > 0
      ? grades.reduce((sum, g) => sum + g.score, 0) / grades.length
      : 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="border-b border-gray-200 bg-white">
        <div className="container mx-auto px-4 py-4">
          <Logo size="md" showText={true} />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-sm shadow-sm border border-gray-200 p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Painel do Aluno
          </h1>
          <p className="text-gray-600 mb-6">
            Bem-vindo, {student ? `${student.firstName} ${student.lastName}` : user.email}!
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Class Card */}
            <div className="bg-indigo-600 text-white rounded-sm p-6 border border-indigo-700">
              <h3 className="text-lg font-semibold mb-2">Minha Turma</h3>
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
            <div className="bg-green-600 text-white rounded-sm p-6 border border-green-700">
              <h3 className="text-lg font-semibold mb-2">Frequência</h3>
              <p className="text-3xl font-bold">
                {attendancePercentage.toFixed(1)}%
              </p>
              <p className="text-sm text-green-100">
                {presentAttendances} de {totalAttendances} presenças
              </p>
            </div>

            {/* Average Grade Card */}
            <div className="bg-purple-600 text-white rounded-sm p-6 border border-purple-700">
              <h3 className="text-lg font-semibold mb-2">Média Geral</h3>
              <p className="text-3xl font-bold">{averageScore.toFixed(1)}</p>
              <p className="text-sm text-purple-100">
                {grades.length} avaliações
              </p>
            </div>
          </div>

          {/* Student Info */}
          {student && (
            <div className="mt-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                Informações Pessoais
              </h2>
              <div className="bg-gray-50 rounded-sm border border-gray-200 p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      {new Date(student.dateOfBirth).toLocaleDateString("pt-BR")}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Notas Recentes
            </h2>
            <div className="bg-gray-50 rounded-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Matéria
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nota
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {grades.map((grade) => (
                    <tr key={grade.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {grade.subject.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            grade.score >= 70
                              ? "bg-green-100 text-green-800"
                              : grade.score >= 50
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {grade.score.toFixed(1)} ({grade.grade})
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {grade.term}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(grade.createdAt).toLocaleDateString("pt-BR")}
                      </td>
                    </tr>
                  ))}
                  {grades.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
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
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Frequência Recente
            </h2>
            <div className="bg-gray-50 rounded-sm border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {student?.attendance.map((attendance) => (
                    <tr key={attendance.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {new Date(attendance.date).toLocaleDateString("pt-BR")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            attendance.status === "PRESENT"
                              ? "bg-green-100 text-green-800"
                              : attendance.status === "ABSENT"
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {attendance.status === "PRESENT"
                            ? "Presente"
                            : attendance.status === "ABSENT"
                            ? "Ausente"
                            : "Justificado"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(student?.attendance.length || 0) === 0 && (
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
