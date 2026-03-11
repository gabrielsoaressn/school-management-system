export const GRADE_LEVELS = ["9", "10", "11", "12"] as const;
export const SECTIONS = ["A", "B", "C", "D"] as const;

export const GENDERS = {
  MALE: "Male",
  FEMALE: "Female",
  OTHER: "Other",
} as const;

export const USER_ROLES = {
  ADMIN: "Admin",
  PARENT: "Parent",
  STUDENT: "Student",
} as const;

export const PAYMENT_STATUSES = {
  PENDING: "Pending",
  PAID: "Paid",
  OVERDUE: "Overdue",
  CANCELLED: "Cancelled",
} as const;

export const ATTENDANCE_STATUSES = {
  PRESENT: "Present",
  ABSENT: "Absent",
  LATE: "Late",
  EXCUSED: "Excused",
} as const;

export const EMPLOYEE_TYPES = {
  TEACHER: "Teacher",
  STAFF: "Staff",
  ADMIN: "Admin",
} as const;

export const DISCOUNT_TYPES = {
  PERCENTAGE: "Percentage",
  FIXED_AMOUNT: "Fixed Amount",
} as const;

export const BILLING_CYCLES = {
  MONTHLY: "Monthly",
  QUARTERLY: "Quarterly",
  ANNUALLY: "Annually",
} as const;

export const TERMS = ["Term 1", "Term 2", "Term 3", "Term 4"] as const;

export const EXPENSE_CATEGORIES = [
  "Salaries",
  "Utilities",
  "Maintenance",
  "Supplies",
  "Equipment",
  "Transportation",
  "Other",
] as const;

export const SUBJECTS_BY_GRADE: Record<string, string[]> = {
  "9": ["Mathematics", "English", "Science", "History", "Geography", "Physical Education", "Art", "Computer Science"],
  "10": ["Mathematics", "English", "Physics", "Chemistry", "Biology", "History", "Geography", "Physical Education"],
  "11": ["Advanced Math", "English Literature", "Physics", "Chemistry", "Biology", "Economics", "Computer Science", "Physical Education"],
  "12": ["Calculus", "English Literature", "Physics", "Chemistry", "Biology", "Economics", "Computer Science", "Physical Education"],
};

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
] as const;
