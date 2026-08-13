"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";

interface MenuItem {
  label: string;
  href: string;
  icon: string;
}

const menuItems: MenuItem[] = [
  { label: "Adicionar Aluno", href: "/admin/students/new", icon: "👨‍🎓" },
  {
    label: "Adicionar Funcionário",
    href: "/admin/financial/employees/new",
    icon: "👤",
  },
  { label: "Criar Turma", href: "/admin/classes/new", icon: "🏫" },
  {
    label: "Adicionar Responsável",
    href: "/admin/financial/parents/new",
    icon: "👨‍👩‍👧",
  },
];

export function FloatingAddButton() {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={menuRef} className="fixed bottom-8 right-8 z-50">
      {/* Menu */}
      {isOpen && (
        <div className="animate-slideUp absolute bottom-20 right-0 mb-2 min-w-[240px] overflow-hidden rounded-sm border-2 border-black bg-white shadow-lg">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 border-b border-gray-200 px-4 py-3 transition last:border-b-0 hover:bg-gray-100"
            >
              <span className="text-2xl">{item.icon}</span>
              <span className="font-semibold text-gray-900">{item.label}</span>
            </Link>
          ))}
        </div>
      )}

      {/* Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-16 w-16 items-center justify-center rounded-full bg-black text-3xl font-light text-white shadow-lg transition-all hover:scale-110 hover:bg-gray-800"
        aria-label="Adicionar"
      >
        {isOpen ? "×" : "+"}
      </button>
    </div>
  );
}

export default FloatingAddButton;
