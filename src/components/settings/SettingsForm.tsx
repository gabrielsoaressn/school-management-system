"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

interface Setting {
  id: string;
  key: string;
  value: string;
  label: string;
  type: string;
}

interface SettingsFormProps {
  settings: Setting[];
}

export default function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>(
    settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {} as Record<string, string>)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ settings: values }),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar configurações");
      }

      toast.success("Configurações salvas com sucesso!");
      router.refresh();
    } catch (error) {
      toast.error("Erro ao salvar configurações");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatLabel = (label: string) => {
    return label;
  };

  const renderInput = (setting: Setting) => {
    const commonClasses =
      "w-full px-3 py-2 border border-gray-300 rounded-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

    switch (setting.type) {
      case "number":
        return (
          <input
            type="number"
            step="0.01"
            value={values[setting.key] || ""}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className={commonClasses}
          />
        );
      case "boolean":
        return (
          <select
            value={values[setting.key] || "false"}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className={commonClasses}
          >
            <option value="true">Sim</option>
            <option value="false">Não</option>
          </select>
        );
      default:
        return (
          <input
            type="text"
            value={values[setting.key] || ""}
            onChange={(e) => handleChange(setting.key, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {settings.map((setting) => (
          <div key={setting.id} className="space-y-2">
            <label className="block text-sm font-semibold text-gray-700">
              {formatLabel(setting.label)}
            </label>
            {renderInput(setting)}
            {setting.type === "number" && setting.key.includes("percentage") && (
              <p className="text-xs text-gray-500">Valor em porcentagem</p>
            )}
            {setting.type === "number" && setting.key.includes("rate") && (
              <p className="text-xs text-gray-500">Valor em reais (R$)</p>
            )}
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={isSubmitting}
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Salvando..." : "Salvar Configurações"}
        </button>
      </div>
    </form>
  );
}
