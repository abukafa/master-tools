"use client";

import { useSession, signIn } from "next-auth/react";
import { useEffect, useRef } from "react";

export function AutoSignIn({ children }) {
  const { status } = useSession();
  const hasAttemptedSignIn = useRef(false);

  useEffect(() => {
    if (status === "unauthenticated" && !hasAttemptedSignIn.current) {
      // Mencegah loop jika ada error dari NextAuth di URL atau jika sedang di halaman login
      if (
        typeof window !== "undefined" &&
        (window.location.search.includes("error=") || window.location.pathname === "/login")
      ) {
        hasAttemptedSignIn.current = true;
        return;
      }

      hasAttemptedSignIn.current = true;
      // Otomatis login menggunakan credentials provider (Anonymous)
      signIn("anonymous", { redirect: false }).catch((err) => {
        console.error("Failed to auto sign in", err);
      });
    }
  }, [status]);

  return <>{children}</>;
}
