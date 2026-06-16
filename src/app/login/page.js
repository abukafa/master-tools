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
          Welcome to <span className="text-primary text-glow block mt-2">Lubna</span>
        </h1>
        <p className="text-muted-foreground font-sans text-sm">
          Aesthetic and powerful suite of utilities designed for elegance and efficiency.
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
            <span className="flex-shrink-0 mx-4 text-muted-foreground text-xs uppercase tracking-widest font-sans">Or</span>
            <div className="flex-grow border-t border-border"></div>
          </div>

          <Button 
            variant="outline" 
            disabled
            className="w-full h-12 rounded-full font-sans font-medium border-border hover:bg-white/5 transition-all cursor-pointer"
          >
            Sign in with Google (Coming Soon)
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
      
      <Suspense fallback={<div className="text-primary text-glow font-display text-2xl">Loading...</div>}>
        <LoginContent />
      </Suspense>
    </main>
  );
}
