import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { DEFAULT_ROUTE_BY_ROLE } from "@/lib/permissions";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  // Every role has a landing page, including the staff roles; falling through
  // to /login used to strand TEACHER on a valid session.
  redirect(DEFAULT_ROUTE_BY_ROLE[user.role] ?? "/login");
}
