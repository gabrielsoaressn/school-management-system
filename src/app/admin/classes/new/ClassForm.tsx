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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome da Turma *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            placeholder="Ex: 1º Ano A"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Série/Ano *
          </label>
          <input
            type="text"
            name="gradeLevel"
            required
            value={formData.gradeLevel}
            onChange={handleChange}
            placeholder="Ex: 1º Ano"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Seção
          </label>
          <input
            type="text"
            name="section"
            required
            value={formData.section}
            onChange={handleChange}
            placeholder="Ex: A, B, C"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
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
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sala
          </label>
          <input
            type="text"
            name="roomNumber"
            value={formData.roomNumber}
            onChange={handleChange}
            placeholder="Ex: Sala 101"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Horário
          </label>
          <input
            type="text"
            name="schedule"
            value={formData.schedule}
            onChange={handleChange}
            placeholder="Ex: Segunda a Sexta, 8h-12h"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>
      </div>

      <div className="flex gap-4">
        <button
          type="submit"
          disabled={loading}
          className="bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-sm border border-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Criar Turma"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-sm border border-gray-300 transition"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
