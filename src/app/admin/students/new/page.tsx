import { requirePermission } from "@/lib/auth-guards";
import Link from "next/link";
import Logo from "@/components/ui/logo";
import { prisma } from "@/lib/prisma";
import StudentForm from "./StudentForm";

export default async function NewStudentPage() {
  await requirePermission("student:write");

  // Fetch parents for the form
  const parents = await prisma.parent.findMany({
    include: {
      user: {
        select: {
          email: true,
        },
      },
    },
    orderBy: {
      firstName: "asc",
    },
  });

  // Get available grade levels and sections from existing classes
  const classes = await prisma.class.findMany({
    select: {
      gradeLevel: true,
      section: true,
    },
    orderBy: [{ gradeLevel: "asc" }, { section: "asc" }],
  });

  // Extract unique grades and sections
  const gradeLevels = Array.from(
    new Set(classes.map((c) => c.gradeLevel))
  ).sort();
  const sections = Array.from(
    new Set(classes.map((c) => c.section))
  ).sort();

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
            gradeLevels={gradeLevels}
            sections={sections}
            parents={parents}
          />
        </div>
      </div>
    </div>
  );
}
