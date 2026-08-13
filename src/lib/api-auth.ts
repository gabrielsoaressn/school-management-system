import { getServerSession } from "next-auth";
import type { UserRole } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { forbidden, serverError, unauthorized } from "@/lib/api-response";
import { can, type Permission } from "@/lib/permissions";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: UserRole;
}

interface AuthOptions {
  /** Allowed roles. Omit to accept any authenticated user. */
  roles?: UserRole[];
  /** Capability required, checked against the permission matrix. */
  permission?: Permission;
}

type AuthenticatedHandler<C extends object> = (
  request: Request,
  context: C & { user: AuthenticatedUser }
) => Promise<Response> | Response;

/**
 * Wraps a route handler with authentication and authorization.
 *
 *   export const GET = withAuth(async (request, { user }) => { ... },
 *                               { permission: "billing:read" });
 *
 * The handler only runs for an authenticated user who clears both `roles` and
 * `permission`. Unexpected exceptions become a 500 with a generic body, so no
 * route can leak internals by forgetting a try/catch.
 */
export function withAuth<C extends object = Record<string, never>>(
  handler: AuthenticatedHandler<C>,
  options: AuthOptions = {}
) {
  // `context` stays untyped here: Next's generated route types check the second
  // parameter, and its shape differs between static and dynamic routes.
  return async (request: Request, context: any) => {
    try {
      const session = await getServerSession(authOptions);

      if (!session?.user?.id) {
        return unauthorized();
      }

      const user: AuthenticatedUser = {
        id: session.user.id,
        email: session.user.email,
        role: session.user.role,
      };

      if (options.roles && !options.roles.includes(user.role)) {
        return forbidden();
      }

      if (options.permission && !can(user, options.permission)) {
        return forbidden();
      }

      return await handler(request, { ...(context ?? ({} as C)), user });
    } catch (error) {
      return serverError(error);
    }
  };
}

/**
 * For genuinely public handlers (the enrollment form). Explicit, so that a
 * route without any wrapper reads as an oversight.
 */
export function withoutAuth<C extends object = Record<string, never>>(
  handler: (request: Request, context: C) => Promise<Response> | Response
) {
  return async (request: Request, context: any) => {
    try {
      return await handler(request, context);
    } catch (error) {
      return serverError(error);
    }
  };
}
