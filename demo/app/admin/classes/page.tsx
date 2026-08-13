import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import { BookOpen, Users, MapPin } from "lucide-react";
import { CLASSES, SCHOOL } from "@demo/lib/mock";

export default function AdminClassesDemo() {
  const totalStudents = CLASSES.reduce(
    (total, turma) => total + turma.students,
    0
  );

  return (
    <PageWrapper>
      <PageHeader
        title="Turmas"
        subtitle={`${CLASSES.length} turmas ativas · ${totalStudents} alunos enturmados · ano letivo ${SCHOOL.academicYear}`}
        icon={BookOpen}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {CLASSES.map((turma) => {
          const occupancy = Math.round((turma.students / turma.capacity) * 100);
          const full = turma.students >= turma.capacity;

          return (
            <Card key={turma.id} padding="lg" hover>
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    {turma.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Regente: {turma.homeroomTeacher}
                  </p>
                </div>
                <Badge variant={turma.shift === "Manhã" ? "info" : "default"}>
                  {turma.shift}
                </Badge>
              </div>

              <div className="mb-4 flex flex-wrap gap-4 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <Users className="h-4 w-4" aria-hidden="true" />
                  {turma.students}/{turma.capacity} alunos
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" aria-hidden="true" />
                  {turma.room}
                </span>
              </div>

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full ${
                    full ? "bg-warning" : "bg-primary"
                  }`}
                  style={{ width: `${occupancy}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                {occupancy}% da capacidade
                {full ? " — turma lotada" : ""}
              </p>
            </Card>
          );
        })}
      </div>
    </PageWrapper>
  );
}
