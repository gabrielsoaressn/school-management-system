"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

interface Subject {
  id: string;
  name: string;
}

interface TeacherFormProps {
  subjects: Subject[];
}

export default function TeacherForm({ subjects }: TeacherFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    qualification: "",
    experience: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedSubjects.length === 0) {
      toast.error("Selecione pelo menos uma matéria");
      return;
    }
    
    setLoading(true);

    try {
      const response = await fetch("/api/admin/teachers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...formData,
          subjectIds: selectedSubjects,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar professor");
      }

      const result = await response.json();
      toast.success(result.message);
      if (result.info) {
        toast.success(result.info, { duration: 5000 });
      }
      router.push("/admin/dashboard");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Erro ao criar professor");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubjectToggle = (subjectId: string) => {
    setSelectedSubjects((prev) => {
      if (prev.includes(subjectId)) {
        return prev.filter((id) => id !== subjectId);
      } else {
        return [...prev, subjectId];
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Nome Completo *
          </label>
          <input
            type="text"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Email *
          </label>
          <input
            type="email"
            name="email"
            required
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Telefone *
          </label>
          <input
            type="tel"
            name="phone"
            required
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Qualificação *
          </label>
          <input
            type="text"
            name="qualification"
            required
            value={formData.qualification}
            onChange={handleChange}
            placeholder="Ex: Mestrado em Matemática"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experiência (em anos)
          </label>
          <input
            type="number"
            name="experience"
            value={formData.experience}
            onChange={handleChange}
            min="0"
            placeholder="Ex: 5"
            className="w-full px-4 py-2 border border-gray-300 rounded-sm focus:ring-2 focus:ring-gray-900 focus:border-transparent"
          />
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Matérias * (Selecionadas: {selectedSubjects.length})
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2 p-4 border border-gray-200 rounded-sm bg-gray-50">
            {subjects.map((subject) => (
              <label
                key={subject.id}
                className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 p-2 rounded"
              >
                <input
                  type="checkbox"
                  checked={selectedSubjects.includes(subject.id)}
                  onChange={() => handleSubjectToggle(subject.id)}
                  className="rounded border-gray-300 text-gray-900 focus:ring-gray-900 h-4 w-4"
                />
                <span className="text-sm text-gray-700">{subject.name}</span>
              </label>
            ))}
          </div>
          {selectedSubjects.length === 0 && (
            <p className="text-sm text-red-600 mt-2 font-medium">
              ⚠️ Selecione pelo menos uma matéria
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading || selectedSubjects.length === 0}
          className="bg-gray-900 hover:bg-black text-white font-semibold py-3 px-6 rounded-sm border border-gray-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Salvando..." : "Criar Professor"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/dashboard")}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-3 px-6 rounded-sm border border-gray-300 transition"
        >
          Cancelar
        </button>
      </div>

      {/* Debug info - remover depois */}
      {process.env.NODE_ENV === "development" && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded text-xs">
          <strong>Debug:</strong> {selectedSubjects.length} matéria(s) selecionada(s)
          <br />
          IDs: {selectedSubjects.join(", ") || "Nenhuma"}
        </div>
      )}
    </form>
  );
}
