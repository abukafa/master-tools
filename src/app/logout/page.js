"use client";

import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { LogOut, ArrowLeft, HeartCrack } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export default function LogoutPage() {
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    await signOut({ callbackUrl: "/" });
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-background relative overflow-hidden">
      {/* Ambient Background Blur */}
      <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-secondary/15 rounded-full blur-[150px] pointer-events-none" />
      
      <div className="z-10 w-full max-w-md">
        <div className="bg-card/60 backdrop-blur-xl border border-border p-10 rounded-3xl shadow-2xl flex flex-col items-center text-center space-y-6">
          
          <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center text-destructive mb-2 relative">
            <HeartCrack className="w-10 h-10" />
            <div className="absolute inset-0 rounded-full border border-destructive/30 animate-ping opacity-20" />
          </div>

          <div>
            <h1 className="font-display text-3xl font-bold text-foreground mb-2">Leaving so soon?</h1>
            <p className="text-muted-foreground font-sans">
              Anda akan keluar dari sesi Anda. Alat-alat premium akan merindukan kreativitas Anda.
            </p>
          </div>

          <div className="w-full flex flex-col gap-3 mt-4">
            <Button 
              onClick={handleSignOut} 
              disabled={isLoggingOut}
              variant="destructive"
              className="w-full h-12 rounded-full font-sans font-semibold tracking-wide"
            >
              <LogOut className="w-4 h-4 mr-2" />
              {isLoggingOut ? "Signing out..." : "Yes, Sign me out"}
            </Button>
            
            <Link href="/dashboard" className="w-full">
              <Button 
                variant="outline" 
                className="w-full h-12 rounded-full font-sans font-medium border-border hover:bg-white/5 transition-all"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                No, take me back
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
