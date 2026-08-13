"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ClassForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "",
    section: "",
    academicYear: new Date().getFullYear().toString(),
    capacity: "30",
    schedule: "",
    roomNumber: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("/api/admin/classes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          capacity: parseInt(formData.capacity),
          academicYear: parseInt(formData.academicYear),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar turma");
      }

      toast.success("Turma criada com sucesso!");
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar turma");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Nome da Turma *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: 1º Ano A"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Série/Ano *
          </label>
          <input
            type="text"
            name="gradeLevel"
            required
            value={formData.gradeLevel}
            onChange={handleChange}
            placeholder="Ex: 1º Ano"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Seção
          </label>
          <input
            type="text"
            name="section"
            required
            value={formData.section}
            onChange={handleChange}
            placeholder="Ex: A, B, C"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Ano Letivo *
          </label>
          <input
            type="number"
            name="academicYear"
            required
            value={formData.academicYear}
            onChange={handleChange}
            min="2020"
            max="2030"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Capacidade *
          </label>
          <input
            type="number"
            name="capacity"
            required
            value={formData.capacity}
            onChange={handleChange}
            min="1"
            max="100"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Sala
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            placeholder="Ex: Sala 101"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700">
            Horário
          </label>
          <input
            type="text"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            placeholder="Ex: Segunda a Sexta, 8h-12h"
            className="w-full rounded-sm border border-gray-300 px-4 py-2 focus:border-transparent focus:ring-2 focus:ring-gray-900"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="rounded-sm border border-gray-800 bg-gray-900 px-6 py-3 font-semibold text-white transition hover:bg-black disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Salvando..." : "Criar Turma"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="rounded-sm border border-gray-300 bg-gray-200 px-6 py-3 font-semibold text-gray-800 transition hover:bg-gray-300"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
