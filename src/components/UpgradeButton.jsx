"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Coffee, X, ExternalLink } from "lucide-react";

export default function UpgradeButton() {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <Button
        onClick={() => setShowModal(true)}
        className="w-full rounded-full bg-primary text-primary-foreground hover:scale-105 transition-transform gap-2"
      >
        <Coffee className="w-4 h-4" /> Dukung via Trakteer
      </Button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="relative w-full max-w-sm p-8 bg-card border border-border rounded-3xl shadow-2xl animate-in zoom-in-95 duration-300 overflow-hidden text-center">
            {/* Ambient Background for Modal */}
            <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-primary/20 to-transparent opacity-50 pointer-events-none" />

            <button
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mb-4 text-primary">
                <Coffee className="w-8 h-8" />
              </div>
              <h3 className="font-display text-2xl font-bold mb-2">
                Dukung Pengembangan
              </h3>
              <p className="text-muted-foreground font-sans text-sm mb-6">
                Bantu kami membayar biaya server AI agar aplikasi ini dapat terus dinikmati secara <strong>gratis</strong> oleh semua orang. Dukungan sekecil apapun sangat berarti! 💖
              </p>

              <div className="flex flex-col gap-3 w-full">
                <a href="https://trakteer.id/abukafa" target="_blank" rel="noopener noreferrer" className="w-full">
                  <Button className="w-full rounded-full bg-[#C12026] text-white hover:bg-[#a61a20] gap-2 hover:scale-105 transition-transform">
                    Traktir Kopi <ExternalLink className="w-4 h-4" />
                  </Button>
                </a>
                <Button
                  variant="ghost"
                  onClick={() => setShowModal(false)}
                  className="w-full rounded-full text-muted-foreground hover:text-foreground"
                >
                  Mungkin Nanti
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
