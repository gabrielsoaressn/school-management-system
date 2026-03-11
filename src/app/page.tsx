import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Redirect based on role
  switch (user.role) {
    case "ADMIN":
      redirect("/admin/dashboard");
    case "PARENT":
      redirect("/parent/dashboard");
    case "STUDENT":
      redirect("/student/dashboard");
    default:
      redirect("/login");
  }
}
