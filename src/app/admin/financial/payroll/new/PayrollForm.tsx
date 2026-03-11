"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Link from "next/link";

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  position: string;
  salary: number;
  cpf: string | null;
}

interface PayrollFormProps {
  employees: Employee[];
}

export default function PayrollForm({ employees }: PayrollFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [formData, setFormData] = useState({
    employeeId: "",
    baseSalary: "",
    bonus: "0",
    deductions: "0",
    referenceMonth: String(currentMonth),
    referenceYear: String(currentYear),
    scheduledDate: "",
    paymentMethod: "",
    notes: "",
  });

  const handleEmployeeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const employeeId = e.target.value;
    const employee = employees.find((emp) => emp.id === employeeId);

    setSelectedEmployee(employee || null);
    setFormData({
      ...formData,
      employeeId,
      baseSalary: employee ? String(employee.salary) : "",
    });
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const calculateTotal = () => {
    const base = parseFloat(formData.baseSalary) || 0;
    const bonus = parseFloat(formData.bonus) || 0;
    const deductions = parseFloat(formData.deductions) || 0;
    return base + bonus - deductions;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const totalAmount = calculateTotal();

      const response = await fetch("/api/admin/payroll", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          baseSalary: parseFloat(formData.baseSalary),
          bonus: parseFloat(formData.bonus),
          deductions: parseFloat(formData.deductions),
          totalAmount,
          referenceMonth: parseInt(formData.referenceMonth),
          referenceYear: parseInt(formData.referenceYear),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar pagamento");
      }

      toast.success("Pagamento criado com sucesso!");
      router.push("/admin/financial/payroll");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar pagamento");
    } finally {
      setLoading(false);
    }
  };

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Funcionário *
          </label>
          <select
            name="employeeId"
            required
            value={formData.employeeId}
            onChange={handleEmployeeChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Selecione um funcionário</option>
            {employees.map((employee) => (
              <option key={employee.id} value={employee.id}>
                {employee.firstName} {employee.lastName} - {employee.position}
              </option>
            ))}
          </select>
        </div>

        {selectedEmployee && (
          <div className="bg-blue-50 border border-blue-200 rounded-sm p-4">
            <p className="text-sm text-blue-900">
              <strong>ID:</strong> {selectedEmployee.employeeId} |
              <strong> Cargo:</strong> {selectedEmployee.position} |
              <strong> Salário Base:</strong> R$ {selectedEmployee.salary.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Mês de Referência *
            </label>
            <select
              name="referenceMonth"
              required
              value={formData.referenceMonth}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthNames.map((month, index) => (
                <option key={index + 1} value={index + 1}>
                  {month}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ano de Referência *
            </label>
            <input
              type="number"
              name="referenceYear"
              required
              value={formData.referenceYear}
              onChange={handleChange}
              min="2020"
              max="2030"
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Salário Base (R$) *
            </label>
            <input
              type="number"
              step="0.01"
              name="baseSalary"
              required
              value={formData.baseSalary}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Bônus (R$)
            </label>
            <input
              type="number"
              step="0.01"
              name="bonus"
              value={formData.bonus}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descontos (R$)
            </label>
            <input
              type="number"
              step="0.01"
              name="deductions"
              value={formData.deductions}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="bg-green-50 border border-green-200 rounded-sm p-4">
          <p className="text-lg font-semibold text-green-900">
            Total a Pagar: R$ {calculateTotal().toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data de Pagamento *
            </label>
            <input
              type="date"
              name="scheduledDate"
              required
              value={formData.scheduledDate}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Método de Pagamento
            </label>
            <select
              name="paymentMethod"
              value={formData.paymentMethod}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Selecione</option>
              <option value="PIX">PIX</option>
              <option value="Transferência Bancária">Transferência Bancária</option>
              <option value="Dinheiro">Dinheiro</option>
              <option value="Cheque">Cheque</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Observações
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Observações adicionais sobre este pagamento"
          />
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
        <Link
          href="/admin/financial/payroll"
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-6 rounded-sm transition"
        >
          Cancelar
        </Link>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-sm transition disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar Pagamento"}
        </button>
      </div>
    </form>
  );
}
