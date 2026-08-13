"use client";

import { useState } from "react";
import PageWrapper from "@/components/layout/PageWrapper";
import PageHeader from "@/components/layout/PageHeader";
import Card from "@/components/ui/Card";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import SearchBar from "@/components/ui/SearchBar";
import EmptyState from "@/components/ui/EmptyState";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/Table";
import { GraduationCap, Plus, SearchX } from "lucide-react";
import { formatDate } from "@demo/lib/format";
import { STUDENTS, type StudentRow } from "@demo/lib/mock";

const STATUS_VARIANT: Record<
  StudentRow["status"],
  "success" | "warning" | "default"
> = {
  Ativo: "success",
  Transferido: "warning",
  Inativo: "default",
};

export default function AdminStudentsDemo() {
  const [query, setQuery] = useState("");

  const term = query.trim().toLowerCase();
  const students = term
    ? STUDENTS.filter((student) =>
        [
          student.name,
          student.registration,
          student.className,
          student.guardian,
        ]
          .join(" ")
          .toLowerCase()
          .includes(term)
      )
    : STUDENTS;

  return (
    <PageWrapper>
      <PageHeader
        title="Alunos"
        subtitle={`${students.length} de ${STUDENTS.length} alunos exibidos`}
        icon={GraduationCap}
      >
        <Button variant="primary" disabled title="Indisponível na demo">
          <Plus className="mr-2 h-4 w-4" />
          Novo aluno
        </Button>
      </PageHeader>

      <Card padding="md">
        <div className="mb-4">
          <SearchBar
            value={query}
            onChange={setQuery}
            placeholder="Buscar por nome, matrícula, turma ou responsável..."
            className="max-w-xl"
          />
        </div>

        {students.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="Nenhum aluno encontrado"
            description="Ajuste a busca para ver outros alunos."
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matrícula</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Turma</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Matriculado em</TableHead>
                <TableHead>Situação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {students.map((student) => (
                <TableRow key={student.id} hover>
                  <TableCell className="font-mono text-xs text-muted-foreground">
                    {student.registration}
                  </TableCell>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.className}</TableCell>
                  <TableCell>
                    <span className="block">{student.guardian}</span>
                    <span className="block text-xs text-muted-foreground">
                      {student.guardianPhone}
                    </span>
                  </TableCell>
                  <TableCell>{formatDate(student.enrolledAt)}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_VARIANT[student.status]}>
                      {student.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </PageWrapper>
  );
}
