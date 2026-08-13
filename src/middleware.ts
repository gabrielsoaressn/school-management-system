import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import type { UserRole } from "@prisma/client";
import {
  DEFAULT_ROUTE_BY_ROLE,
  can,
  requiredPermissionFor,
} from "@/lib/permissions";

/**
 * Page-level access control.
 *
 * Authorization is decided by the permission matrix, not by hardcoded role
 * comparisons, so adding a staff role is a change in src/lib/permissions.ts
 * alone. A user who lacks the permission is sent to their own landing page —
 * never to /login, which would look like a session problem.
 */
export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role as UserRole | undefined;
    const { pathname } = req.nextUrl;

    if (!role) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Accounts created with a temporary password cannot go anywhere else.
    if (token?.mustChangePassword === true) {
      return NextResponse.redirect(new URL("/trocar-senha", req.url));
    }

    const permission = requiredPermissionFor(pathname);

    if (permission && !can({ role }, permission)) {
      const fallback = DEFAULT_ROUTE_BY_ROLE[role] ?? "/login";
      // Avoid a redirect loop when the landing page itself is not allowed.
      if (pathname.startsWith(fallback)) {
        return NextResponse.redirect(new URL("/login", req.url));
      }
      return NextResponse.redirect(new URL(fallback, req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: [
    "/admin/:path*",
    "/teacher/:path*",
    "/parent/:path*",
    "/student/:path*",
  ],
};
