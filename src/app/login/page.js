"use client";

import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LoginContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const [isLoading, setIsLoading] = useState(false);

  const handleGuestLogin = async () => {
    setIsLoading(true);
    const res = await signIn("anonymous", { redirect: false });

    if (res?.error) {
      setIsLoading(false);
      // Anda bisa mengganti ini dengan komponen Toast
      alert("Gagal masuk. Pastikan koneksi database MongoDB sudah benar.");
    } else if (res?.ok) {
      window.location.href = "/";
    }
  };

  return (
    <div className="z-10 w-full max-w-md p-8 relative overflow-hidden rounded-3xl border border-border bg-card/60 backdrop-blur-xl shadow-2xl">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

      <div className="flex flex-col items-center gap-6 relative z-10 text-center">
        <h1 className="font-display text-4xl font-bold text-foreground">
          Welcome to{" "}
          <span className="text-primary text-glow block mt-2">
            Lubna Tools Master
          </span>
        </h1>
        <p className="text-muted-foreground font-sans text-sm">
          Aesthetic and powerful suite of utilities designed for elegance and
          efficiency.
        </p>

        {error && (
          <div className="w-full p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-sans">
            Authentication failed. Please check your connection or database.
          </div>
        )}

        <div className="w-full mt-4 space-y-4">
          <Button
            onClick={handleGuestLogin}
            disabled={isLoading}
            className="w-full h-12 rounded-full font-sans font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-[1.02] hover:btn-glow cursor-pointer"
          >
            {isLoading ? "Entering..." : "Enter as Guest"}
          </Button>

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-border"></div>
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-widest font-sans">
              Or
            </span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button
            variant="outline"
            onClick={() => {
              setIsLoading(true);
              signIn("google", { callbackUrl: "/dashboard" });
            }}
            disabled={isLoading}
            className="w-full h-12 rounded-full font-sans font-medium border-border hover:bg-white/5 transition-all cursor-pointer flex items-center justify-center gap-3"
          >
            {/* Google Icon SVG (simplified) */}
            <svg viewBox="0 0 24 24" className="w-5 h-5">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Sign in with Google
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 bg-background relative overflow-hidden">
      {/* Ambient Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[150px] pointer-events-none" />

      <Suspense
        fallback={
          <div className="text-primary text-glow font-display text-2xl">
            Loading...
          </div>
        }
      >
        <LoginContent />
      </Suspense>
    </main>
  );
}
