'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { PageWrapper } from '@/components/layout/PageWrapper';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { BackButton } from '@/components/ui/BackButton';
import { Input } from '@/components/ui/Input';
import { ClipboardCheck, Save, Check, X, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

type Student = {
  id: string;
  studentId: string;
  firstName: string;
  lastName: string;
};

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

type AttendanceRecord = {
  studentId: string;
  status: AttendanceStatus;
  remarks?: string;
};

const STATUS_CONFIG = {
  PRESENT: { label: 'Presente', color: 'green' as const, icon: Check },
  ABSENT: { label: 'Falta', color: 'red' as const, icon: X },
  LATE: { label: 'Atraso', color: 'yellow' as const, icon: Clock },
  EXCUSED: { label: 'Justificada', color: 'blue' as const, icon: AlertCircle },
};

export default function AttendancePage() {
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchClassData();
  }, [classId]);

  useEffect(() => {
    if (students.length > 0) {
      fetchExistingAttendance();
    }
  }, [selectedDate, students]);

  const fetchClassData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/teacher/classes');
      const data = await response.json();

      if (data.success) {
        const currentClass = data.data.find((c: any) => c.id === classId);
        if (currentClass) {
          setClassData(currentClass);
          const studentList = currentClass.enrollments.map((e: any) => e.student);
          setStudents(studentList);

          // Inicializar todos como PRESENT por padrão
          setAttendanceRecords(
            studentList.map((s: Student) => ({
              studentId: s.id,
              status: 'PRESENT' as AttendanceStatus,
            }))
          );
        }
      }
    } catch (error) {
      console.error('Error fetching class:', error);
      toast.error('Erro ao carregar turma');
    } finally {
      setLoading(false);
    }
  };

  const fetchExistingAttendance = async () => {
    try {
      const response = await fetch(
        `/api/teacher/attendance?classId=${classId}&date=${selectedDate}`
      );
      const data = await response.json();

      if (data.success && data.data.length > 0) {
        // Atualizar records com dados existentes
        const updatedRecords = students.map((student) => {
          const existing = data.data.find(
            (record: any) => record.studentId === student.id
          );
          return existing
            ? {
                studentId: student.id,
                status: existing.status,
                remarks: existing.remarks,
              }
            : {
                studentId: student.id,
                status: 'PRESENT' as AttendanceStatus,
              };
        });
        setAttendanceRecords(updatedRecords);
      } else {
        // Resetar para PRESENT se não houver dados
        setAttendanceRecords(
          students.map((s) => ({
            studentId: s.id,
            status: 'PRESENT' as AttendanceStatus,
          }))
        );
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const updateAttendance = (studentId: string, status: AttendanceStatus) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.studentId === studentId ? { ...record, status } : record
      )
    );
  };

  const updateRemarks = (studentId: string, remarks: string) => {
    setAttendanceRecords((prev) =>
      prev.map((record) =>
        record.studentId === studentId ? { ...record, remarks } : record
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/teacher/attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          classId,
          date: selectedDate,
          records: attendanceRecords,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Chamada salva com sucesso!');
      } else {
        toast.error(data.message || 'Erro ao salvar chamada');
      }
    } catch (error) {
      console.error('Error saving attendance:', error);
      toast.error('Erro ao salvar chamada');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
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
        title={`Chamada - ${classData?.name || 'Turma'}`}
        subtitle={`${classData?.gradeLevel} - Turma ${classData?.section}`}
        icon={ClipboardCheck}
      />

      <Card className="mb-6 p-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data da Chamada
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              max={new Date().toISOString().split('T')[0]}
            />
          </div>
          <div className="flex gap-2 items-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {saving ? 'Salvando...' : 'Salvar Chamada'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Legend */}
      <Card className="mb-6 p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Legenda:</h3>
        <div className="flex flex-wrap gap-3">
          {Object.entries(STATUS_CONFIG).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <Badge key={key} color={config.color}>
                <Icon className="w-3 h-3 mr-1" />
                {config.label}
              </Badge>
            );
          })}
        </div>
      </Card>

      {/* Attendance Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Matrícula
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Aluno
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Observações
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.map((student) => {
                const record = attendanceRecords.find(
                  (r) => r.studentId === student.id
                );
                const currentStatus = record?.status || 'PRESENT';

                return (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {student.studentId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {student.firstName} {student.lastName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex justify-center gap-1">
                        {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                          const Icon = config.icon;
                          const isSelected = currentStatus === key;
                          return (
                            <button
                              key={key}
                              onClick={() =>
                                updateAttendance(student.id, key as AttendanceStatus)
                              }
                              className={`p-2 rounded-lg border-2 transition-all ${
                                isSelected
                                  ? `border-${config.color}-500 bg-${config.color}-50`
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              title={config.label}
                            >
                              <Icon
                                className={`w-5 h-5 ${
                                  isSelected
                                    ? `text-${config.color}-600`
                                    : 'text-gray-400'
                                }`}
                              />
                            </button>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <input
                        type="text"
                        value={record?.remarks || ''}
                        onChange={(e) =>
                          updateRemarks(student.id, e.target.value)
                        }
                        placeholder="Observações..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Summary */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-6 text-sm">
            <span className="text-gray-600">
              Total: <span className="font-semibold">{students.length}</span>
            </span>
            <span className="text-green-600">
              Presentes:{' '}
              <span className="font-semibold">
                {attendanceRecords.filter((r) => r.status === 'PRESENT').length}
              </span>
            </span>
            <span className="text-red-600">
              Faltas:{' '}
              <span className="font-semibold">
                {attendanceRecords.filter((r) => r.status === 'ABSENT').length}
              </span>
            </span>
            <span className="text-yellow-600">
              Atrasos:{' '}
              <span className="font-semibold">
                {attendanceRecords.filter((r) => r.status === 'LATE').length}
              </span>
            </span>
          </div>
        </div>
      </Card>
    </PageWrapper>
  );
}
