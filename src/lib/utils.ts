import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

// Money lives in src/lib/money.ts and dates in src/lib/datetime.ts. This file
// used to export a formatCurrency in USD/en-US and a formatDate in "MMM dd,
// yyyy"; both were dead code and both were wrong for a Brazilian school.
export { formatCurrency } from "./money";
export { formatDate, formatDateTime } from "./datetime";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateStudentId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `STU${year}${random}`;
}

export function generateEmployeeId(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 10000)
    .toString()
    .padStart(4, "0");
  return `EMP${year}${random}`;
}

export function calculateAge(birthDate: Date | string): number {
  const birth = typeof birthDate === "string" ? new Date(birthDate) : birthDate;
  const today = new Date();
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  return age;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}
