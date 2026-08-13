import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import {
  DEFAULT_ROUTE_BY_ROLE,
  can,
  type Permission,
} from "@/lib/permissions";

/**
 * Server-component guards.
 *
 * The middleware already blocks unauthorized page loads; these run again in the
 * page itself so that a direct render (or a future route added outside the
 * middleware matcher) is never left unprotected.
 */

export async function requireUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return user;
}

export async function requirePermission(permission: Permission) {
  const user = await requireUser();

  if (!can(user, permission)) {
    redirect(DEFAULT_ROUTE_BY_ROLE[user.role] ?? "/login");
  }

  return user;
}
