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
  { label: "Adicionar Funcionário", href: "/admin/financial/employees/new", icon: "👤" },
  { label: "Criar Turma", href: "/admin/classes/new", icon: "🏫" },
  { label: "Adicionar Responsável", href: "/admin/financial/parents/new", icon: "👨‍👩‍👧" },
];

export default function FloatingAddButton() {
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
        <div className="absolute bottom-20 right-0 mb-2 bg-white border-2 border-black rounded-sm shadow-lg overflow-hidden min-w-[240px] animate-slideUp">
          {menuItems.map((item, index) => (
            <Link
              key={index}
              href={item.href}
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-4 py-3 hover:bg-gray-100 transition border-b border-gray-200 last:border-b-0"
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
        className="w-16 h-16 bg-black hover:bg-gray-800 text-white rounded-full shadow-lg flex items-center justify-center text-3xl font-light transition-all hover:scale-110"
        aria-label="Adicionar"
      >
        {isOpen ? "×" : "+"}
      </button>
    </div>
  );
}
