"use client";

import { SessionProvider } from "next-auth/react";
import { ReactNode } from "react";

/**
 * Client boundary for NextAuth's SessionProvider.
 *
 * Required by every component calling `useSession()`. Server components are
 * unaffected: they keep reading the session through `getCurrentUser()`.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}

export default AuthProvider;
