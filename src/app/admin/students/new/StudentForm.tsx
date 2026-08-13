"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

// Formatting functions
const formatCPF = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }
  return value;
};

const formatPhone = (value: string) => {
  const numbers = value.replace(/\D/g, "");
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, "($1) $2")
      .replace(/(\d{5})(\d)/, "$1-$2")
      .replace(/(-\d{4})\d+?$/, "$1");
  }
  return value;
};

interface Parent {
  id: string;
  firstName: string;
  lastName: string;
  user: {
    email: string;
  };
}

interface StudentFormProps {
  gradeLevels: string[];
  sections: string[];
  parents: Parent[];
}

export default function StudentForm({
  gradeLevels,
  sections,
  parents,
}: StudentFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [useExistingParent, setUseExistingParent] = useState(false);
  const [applyDiscount, setApplyDiscount] = useState(false);
  const [settings, setSettings] = useState<any>({});

  const [formData, setFormData] = useState({
    // Student data
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    dateOfBirth: "",
    gender: "",
    gradeLevel: "",
    section: "",
    address: "",
    phoneNumber: "",
    // Parent data (if creating new)
    parentId: "",
    parentFirstName: "",
    parentLastName: "",
    parentEmail: "",
    parentPassword: "",
    parentPhone: "",
    parentAddress: "",
    parentCpf: "",
    parentOccupation: "",
    // Billing options
    tuitionAmount: "",
    discountType: "PERCENTAGE",
    discountValue: "",
  });

  // Fetch settings on mount
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((data) => {
        const settingsMap = data.data.reduce((acc: any, s: any) => {
          acc[s.key] = s.value;
          return acc;
        }, {});
        setSettings(settingsMap);
        // Set default tuition amount from settings
        if (settingsMap.default_tuition_monthly) {
          setFormData((prev) => ({
            ...prev,
            tuitionAmount: settingsMap.default_tuition_monthly,
          }));
        }
      })
      .catch((err) => console.error("Error fetching settings:", err));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload: any = {
        ...formData,
        applyDiscount,
      };

      // If using existing parent, clear new parent fields
      if (useExistingParent) {
        delete payload.parentFirstName;
        delete payload.parentLastName;
        delete payload.parentEmail;
        delete payload.parentPassword;
        delete payload.parentPhone;
        delete payload.parentAddress;
        delete payload.parentCpf;
        delete payload.parentOccupation;
      } else {
        // If creating new parent, clear parentId
        delete payload.parentId;
      }

      // Convert discount value to number if applying discount
      if (applyDiscount && payload.discountValue) {
        payload.discountValue = parseFloat(payload.discountValue);
      }

      const response = await fetch("/api/admin/students", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar aluno");
      }

      const result = await response.json();
      toast.success(result.message);
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar aluno");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    let formattedValue = value;

    // Apply formatting based on field name
    if (name === "parentCpf") {
      formattedValue = formatCPF(value);
    } else if (name === "phoneNumber" || name === "parentPhone") {
      formattedValue = formatPhone(value);
    }

    setFormData({
      ...formData,
      [name]: formattedValue,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Student Information */}
      <div>
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Dados do Aluno
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Nome *
            </label>
            <input
              type="text"
              name="firstName"
              required
              value={formData.firstName}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Sobrenome *
            </label>
            <input
              type="text"
              name="lastName"
              required
              value={formData.lastName}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Email *
            </label>
            <input
              type="email"
              name="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Senha *
            </label>
            <input
              type="password"
              name="password"
              required
              minLength={6}
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Data de Nascimento *
            </label>
            <input
              type="date"
              name="dateOfBirth"
              required
              value={formData.dateOfBirth}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Gênero *
            </label>
            <select
              name="gender"
              required
              value={formData.gender}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecione</option>
              <option value="MALE">Masculino</option>
              <option value="FEMALE">Feminino</option>
              <option value="OTHER">Outro</option>
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Série *
            </label>
            <select
              name="gradeLevel"
              required
              value={formData.gradeLevel}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecione</option>
              {gradeLevels.map((grade) => (
                <option key={grade} value={grade}>
                  {grade}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Turma *
            </label>
            <select
              name="section"
              required
              value={formData.section}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecione</option>
              {sections.map((section) => (
                <option key={section} value={section}>
                  {section}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Endereço
            </label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Telefone
            </label>
            <input
              type="text"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              placeholder="(00) 00000-0000"
              maxLength={15}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
          </div>
        </div>
      </div>

      {/* Parent Information */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">
          Dados do Responsável
        </h2>

        <div className="mb-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={useExistingParent}
              onChange={(e) => setUseExistingParent(e.target.checked)}
              className="mr-2"
            />
            <span className="text-sm font-medium text-gray-700">
              Usar responsável existente
            </span>
          </label>
        </div>

        {useExistingParent ? (
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Selecionar Responsável *
            </label>
            <select
              name="parentId"
              required
              value={formData.parentId}
              onChange={handleChange}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            >
              <option value="">Selecione um responsável</option>
              {parents.map((parent) => (
                <option key={parent.id} value={parent.id}>
                  {parent.firstName} {parent.lastName} - {parent.user.email}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Nome *
              </label>
              <input
                type="text"
                name="parentFirstName"
                required={!useExistingParent}
                value={formData.parentFirstName}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Sobrenome *
              </label>
              <input
                type="text"
                name="parentLastName"
                required={!useExistingParent}
                value={formData.parentLastName}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Email *
              </label>
              <input
                type="email"
                name="parentEmail"
                required={!useExistingParent}
                value={formData.parentEmail}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Senha *
              </label>
              <input
                type="password"
                name="parentPassword"
                required={!useExistingParent}
                minLength={6}
                value={formData.parentPassword}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Telefone *
              </label>
              <input
                type="text"
                name="parentPhone"
                required={!useExistingParent}
                value={formData.parentPhone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                CPF
              </label>
              <input
                type="text"
                name="parentCpf"
                value={formData.parentCpf}
                onChange={handleChange}
                placeholder="000.000.000-00"
                maxLength={14}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Endereço
              </label>
              <input
                type="text"
                name="parentAddress"
                value={formData.parentAddress}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Profissão
              </label>
              <input
                type="text"
                name="parentOccupation"
                value={formData.parentOccupation}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        )}
      </div>

      {/* Billing Information */}
      <div className="border-t border-gray-200 pt-6">
        <h2 className="mb-4 text-2xl font-bold text-gray-900">Mensalidade</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">
              Valor da Mensalidade (R$)
            </label>
            <input
              type="number"
              step="0.01"
              name="tuitionAmount"
              value={formData.tuitionAmount}
              onChange={handleChange}
              placeholder={settings.default_tuition_monthly || "1500"}
              className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
            />
            <p className="mt-1 text-xs text-gray-500">
              Padrão: R$ {settings.default_tuition_monthly || "1500"}
            </p>
          </div>

          <div>
            <label className="mb-4 mt-8 flex items-center">
              <input
                type="checkbox"
                checked={applyDiscount}
                onChange={(e) => setApplyDiscount(e.target.checked)}
                className="mr-2"
              />
              <span className="text-sm font-medium text-gray-700">
                Aplicar Desconto
              </span>
            </label>
          </div>
        </div>

        {applyDiscount && (
          <div className="mt-4 grid grid-cols-1 gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Tipo de Desconto
              </label>
              <select
                name="discountType"
                value={formData.discountType}
                onChange={handleChange}
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              >
                <option value="PERCENTAGE">Porcentagem (%)</option>
                <option value="FIXED_AMOUNT">Valor Fixo (R$)</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700">
                Valor do Desconto
              </label>
              <input
                type="number"
                step="0.01"
                name="discountValue"
                value={formData.discountValue}
                onChange={handleChange}
                placeholder={
                  formData.discountType === "PERCENTAGE" ? "10" : "150"
                }
                className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
              />
              <p className="mt-1 text-xs text-gray-500">
                {formData.discountType === "PERCENTAGE"
                  ? "Desconto em %"
                  : "Desconto em R$"}
              </p>
            </div>
          </div>
        )}

        {settings.auto_generate_billing === "true" && (
          <div className="mt-4 rounded-sm border border-blue-200 bg-blue-50 p-4">
            <p className="text-sm text-blue-800">
              ℹ️ A mensalidade será gerada automaticamente com vencimento no dia{" "}
              {settings.billing_due_day || "10"} de cada mês.
            </p>
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-4 border-t border-gray-200 pt-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-sm bg-gray-200 px-6 py-2 font-semibold text-gray-800 transition hover:bg-gray-300"
          disabled={loading}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm bg-gray-900 px-6 py-2 font-semibold text-white transition hover:bg-black disabled:opacity-50"
        >
          {loading ? "Criando..." : "Criar Aluno"}
        </button>
      </div>
    </form>
  );
}
