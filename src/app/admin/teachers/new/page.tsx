import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import TeacherForm from "./TeacherForm";

export default async function NewTeacherPage() {
  await requirePermission("employee:write");

  // Fetch subjects for the form (distinct by name to avoid duplicates)
  const allSubjects = await prisma.subject.findMany({
    orderBy: { name: "asc" },
  });

  // Remove duplicates by name
  const subjectsMap = new Map();
  allSubjects.forEach((subject) => {
    if (!subjectsMap.has(subject.name)) {
      subjectsMap.set(subject.name, subject);
    }
  });
  const subjects = Array.from(subjectsMap.values());

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
              Adicionar Novo Professor
            </h1>
            <Link
              href="/admin/dashboard"
              className="text-gray-600 hover:text-gray-900"
            >
              ← Voltar ao Dashboard
            </Link>
          </div>
          <TeacherForm subjects={subjects} />
        </div>
      </div>
    </div>
  );
}
