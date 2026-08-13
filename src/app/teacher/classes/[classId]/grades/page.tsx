"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BackButton } from "@/components/ui/BackButton";
import { Select } from "@/components/ui/Select";
import { FileText, Save } from "lucide-react";
import toast from "react-hot-toast";

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
};

type Subject = {
  id: string;
  name: string;
  code: string;
};

type AssessmentType = {
  id: string;
  name: string;
  code: string;
  weight: number;
  maxScore: number;
};

type ScoreEntry = {
  studentId: string;
  score: number | "";
  remarks: string;
};

const TERMS = ["1º Bimestre", "2º Bimestre", "3º Bimestre", "4º Bimestre"];

export default function GradesPage() {
  const params = useParams();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [assessmentTypes, setAssessmentTypes] = useState<AssessmentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Filters
  const [selectedSubject, setSelectedSubject] = useState("");
  const [selectedTerm, setSelectedTerm] = useState(TERMS[0]);
  const [selectedAssessmentType, setSelectedAssessmentType] = useState("");
  const [maxScore, setMaxScore] = useState(10);

  // Scores
  const [scores, setScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    fetchInitialData();
  }, [classId]);

  useEffect(() => {
    if (selectedSubject && selectedTerm && selectedAssessmentType) {
      fetchExistingGrades();
    }
  }, [selectedSubject, selectedTerm, selectedAssessmentType]);

  async function fetchInitialData() {
    setLoading(true);
    try {
      const [classRes, subjectsRes, typesRes] = await Promise.all([
        fetch("/api/teacher/classes"),
        fetch(`/api/teacher/subjects?classId=${classId}`),
        fetch("/api/teacher/assessment-types"),
      ]);

      const [classData, subjectsData, typesData] = await Promise.all([
        classRes.json(),
        subjectsRes.json(),
        typesRes.json(),
      ]);

      if (classData.success) {
        const currentClass = classData.data.find((c: any) => c.id === classId);
        if (currentClass) {
          setClassData(currentClass);
          const studentList = currentClass.enrollments.map(
            (e: any) => e.student
          );
          setStudents(studentList);

          // Inicializar scores vazios
          setScores(
            studentList.map((s: Student) => ({
              studentId: s.id,
              score: "",
              remarks: "",
            }))
          );
        }
      }

      if (subjectsData.success) {
        setSubjects(subjectsData.data);
      } else {
        toast.error(subjectsData.error || "Erro ao carregar disciplinas");
      }

      if (typesData.success) {
        setAssessmentTypes(typesData.data);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExistingGrades() {
    try {
      const response = await fetch(
        `/api/teacher/assessments?classId=${classId}&subjectId=${selectedSubject}&term=${selectedTerm}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        const selectedType = assessmentTypes.find(
          (t) => t.id === selectedAssessmentType
        );

        const updatedScores = students.map((student) => {
          const existing = data.data.find(
            (grade: any) =>
              grade.studentId === student.id &&
              grade.assessmentTypeId === selectedAssessmentType
          );
          return existing
            ? {
                studentId: student.id,
                score: existing.score,
                remarks: existing.remarks || "",
              }
            : {
                studentId: student.id,
                score: "",
                remarks: "",
              };
        });

        setScores(updatedScores);
        if (selectedType) {
          setMaxScore(selectedType.maxScore);
        }
      } else {
        // Reset scores
        setScores(
          students.map((s) => ({
            studentId: s.id,
            score: "",
            remarks: "",
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching grades:", error);
    }
  }

  function updateScore(studentId: string, score: string) {
    const numericScore = score === "" ? "" : parseFloat(score);
    setScores((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId
          ? { ...entry, score: numericScore }
          : entry
      )
    );
  }

  function updateRemarks(studentId: string, remarks: string) {
    setScores((prev) =>
      prev.map((entry) =>
        entry.studentId === studentId ? { ...entry, remarks } : entry
      )
    );
  }

  async function handleSave() {
    if (!selectedSubject || !selectedAssessmentType) {
      toast.error("Selecione a disciplina e o tipo de avaliação");
      return;
    }

    // Filter only scores that have been filled
    const filledScores = scores.filter((s) => s.score !== "");

    if (filledScores.length === 0) {
      toast.error("Preencha pelo menos uma nota");
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/teacher/assessments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjectId: selectedSubject,
          classId,
          assessmentTypeId: selectedAssessmentType,
          term: selectedTerm,
          maxScore,
          scores: filledScores.map((s) => ({
            studentId: s.studentId,
            score: Number(s.score),
            remarks: s.remarks,
          })),
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success("Notas salvas com sucesso!");
      } else {
        toast.error(data.error || "Erro ao salvar notas");
      }
    } catch (error) {
      console.error("Error saving grades:", error);
      toast.error("Erro ao salvar notas");
    } finally {
      setSaving(false);
    }
  }

  const calculateGrade = (score: number | ""): string => {
    if (score === "") return "-";
    const percentage = (Number(score) / maxScore) * 100;
    if (percentage >= 90) return "A";
    if (percentage >= 80) return "B";
    if (percentage >= 70) return "C";
    if (percentage >= 60) return "D";
    return "F";
  };

  const calculateAverage = (): string => {
    const filledScores = scores.filter((s) => s.score !== "");
    if (filledScores.length === 0) return "-";

    const sum = filledScores.reduce((acc, s) => acc + Number(s.score), 0);
    const avg = sum / filledScores.length;
    return avg.toFixed(2);
  };

  if (loading) {
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
      <BackButton href="/teacher/dashboard" />

      <PageHeader
        title={`Lançamento de Notas - ${classData?.name || "Turma"}`}
        subtitle={`${classData?.gradeLevel} - Turma ${classData?.section}`}
        icon={FileText}
      />

      {/* Filters */}
      <Card className="mb-6 p-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Select
            label="Disciplina *"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
            options={[
              { value: "", label: "Selecione a disciplina" },
              ...subjects.map((s) => ({ value: s.id, label: s.name })),
            ]}
          />

          <Select
            label="Bimestre *"
            value={selectedTerm}
            onChange={(e) => setSelectedTerm(e.target.value)}
            options={TERMS.map((t) => ({ value: t, label: t }))}
          />

          <Select
            label="Tipo de Avaliação *"
            value={selectedAssessmentType}
            onChange={(e) => {
              setSelectedAssessmentType(e.target.value);
              const type = assessmentTypes.find((t) => t.id === e.target.value);
              if (type) setMaxScore(type.maxScore);
            }}
            options={[
              { value: "", label: "Selecione o tipo" },
              ...assessmentTypes.map((t) => ({
                value: t.id,
                label: `${t.name} (Peso: ${t.weight})`,
              })),
            ]}
          />

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nota Máxima
            </label>
            <input
              type="number"
              value={maxScore}
              onChange={(e) => setMaxScore(Number(e.target.value))}
              min="0"
              step="0.1"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:border-transparent focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mt-4 flex justify-end">
          <Button
            onClick={handleSave}
            disabled={saving || !selectedSubject || !selectedAssessmentType}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Salvando..." : "Salvar Notas"}
          </Button>
        </div>
      </Card>

      {/* Grades Table */}
      {selectedSubject && selectedAssessmentType ? (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="border-b border-gray-200 bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Matrícula
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Aluno
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Nota (0-{maxScore})
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium uppercase text-gray-500">
                    Conceito
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase text-gray-500">
                    Observações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {students.map((student) => {
                  const entry = scores.find((s) => s.studentId === student.id);
                  const score = entry?.score || "";
                  const grade = calculateGrade(score);

                  return (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {student.firstName} {student.lastName}
                        </div>
                      </td>
                      <td className="whitespace-nowrap px-6 py-4">
                        <input
                          type="number"
                          value={score}
                          onChange={(e) =>
                            updateScore(student.id, e.target.value)
                          }
                          min="0"
                          max={maxScore}
                          step="0.1"
                          placeholder="0.0"
                          className="w-24 rounded-lg border border-gray-300 px-3 py-2 text-center focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="whitespace-nowrap px-6 py-4 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-sm font-semibold ${
                            grade === "A"
                              ? "bg-green-100 text-green-800"
                              : grade === "B"
                                ? "bg-blue-100 text-blue-800"
                                : grade === "C"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : grade === "D"
                                    ? "bg-orange-100 text-orange-800"
                                    : grade === "F"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {grade}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <input
                          type="text"
                          value={entry?.remarks || ""}
                          onChange={(e) =>
                            updateRemarks(student.id, e.target.value)
                          }
                          placeholder="Observações..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary */}
          <div className="border-t border-gray-200 bg-gray-50 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <span className="text-gray-600">
                  Total de Alunos:{" "}
                  <span className="font-semibold">{students.length}</span>
                </span>
                <span className="text-blue-600">
                  Notas Lançadas:{" "}
                  <span className="font-semibold">
                    {scores.filter((s) => s.score !== "").length}
                  </span>
                </span>
              </div>
              <div className="text-sm text-gray-600">
                Média da Turma:{" "}
                <span className="text-lg font-semibold text-gray-900">
                  {calculateAverage()}
                </span>
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-12 text-center">
          <FileText className="mx-auto mb-4 h-16 w-16 text-gray-300" />
          <h3 className="mb-2 text-lg font-semibold text-gray-900">
            Selecione os filtros acima
          </h3>
          <p className="text-gray-600">
            Escolha a disciplina, bimestre e tipo de avaliação para começar a
            lançar as notas
          </p>
        </Card>
      )}
    </PageWrapper>
  );
}
