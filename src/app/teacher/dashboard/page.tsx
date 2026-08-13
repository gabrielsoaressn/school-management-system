"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  BookOpen,
  Users,
  ClipboardCheck,
  FileText,
  ChevronRight,
} from "lucide-react";
import toast from "react-hot-toast";

type Class = {
  id: string;
  name: string;
  gradeLevel: string;
  section: string;
  academicYear: string;
  _count: {
    enrollments: number;
  };
};

export default function TeacherDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
    } else if (
      status === "authenticated" &&
      session?.user?.role !== "TEACHER" &&
      session?.user?.role !== "ADMIN"
    ) {
      router.push("/login");
    }
  }, [status, session, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchClasses();
    }
  }, [status]);

  async function fetchClasses() {
    setLoading(true);
    try {
      const response = await fetch("/api/teacher/classes");
      const data = await response.json();

      if (data.success) {
        setClasses(data.data);
      } else {
        toast.error("Erro ao carregar turmas");
      }
    } catch (error) {
      console.error("Error fetching classes:", error);
      toast.error("Erro ao carregar turmas");
    } finally {
      setLoading(false);
    }
  }

  if (status === "loading" || loading) {
    return (
      <PageWrapper>
        <div className="flex min-h-screen items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-b-2 border-blue-600"></div>
            <p className="text-gray-600">Carregando...</p>
          </div>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader
        title="Portal do Professor"
        subtitle={`Bem-vindo, ${session?.user?.email}`}
        icon={BookOpen}
      />

      {/* Quick Stats */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Turmas</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.length}
              </p>
            </div>
            <BookOpen className="h-8 w-8 text-blue-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total de Alunos</p>
              <p className="text-2xl font-bold text-gray-900">
                {classes.reduce((sum, c) => sum + c._count.enrollments, 0)}
              </p>
            </div>
            <Users className="h-8 w-8 text-green-500" />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Ano Letivo</p>
              <p className="text-2xl font-bold text-gray-900">
                {new Date().getFullYear()}
              </p>
            </div>
            <FileText className="h-8 w-8 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Classes List */}
      <Card>
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-gray-900">Minhas Turmas</h2>
          <p className="mt-1 text-sm text-gray-600">
            Selecione uma turma para gerenciar chamada e notas
          </p>
        </div>

        {classes.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title="Nenhuma turma encontrada"
            description="Você ainda não está vinculado a nenhuma turma."
          />
        ) : (
          <div className="divide-y divide-gray-200">
            {classes.map((classItem) => (
              <div
                key={classItem.id}
                className="p-6 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                        <BookOpen className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {classItem.name}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {classItem.gradeLevel} - Turma {classItem.section} |{" "}
                          {classItem.academicYear}
                        </p>
                      </div>
                    </div>
                    <div className="ml-15 flex items-center gap-4 text-sm text-gray-500">
                      <span className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {classItem._count.enrollments} alunos
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        router.push(
                          `/teacher/classes/${classItem.id}/attendance`
                        )
                      }
                    >
                      <ClipboardCheck className="mr-2 h-4 w-4" />
                      Chamada
                    </Button>
                    <Button
                      size="sm"
                      onClick={() =>
                        router.push(`/teacher/classes/${classItem.id}/grades`)
                      }
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Notas
                      <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </PageWrapper>
  );
}
