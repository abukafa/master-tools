"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DownloadCloud, Loader2, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VideoDownloaderPage() {
  const [url, setUrl] = null || useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDownload = async () => {
    if (!url) return;
    
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v2/downloader", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ url })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal mengambil data video");
      }

      setResult(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10 space-y-8">
        <div className="mb-8 text-center md:text-left">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Media <span className="text-primary text-glow">Downloader</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Unduh video dari YouTube, TikTok, atau Instagram dengan mudah. (Premium Tool)
          </p>
        </div>

      <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-6">
        <div className="flex gap-4">
          <Input 
            type="url" 
            placeholder="Masukkan URL Video (Contoh: https://youtube.com/...)" 
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="flex-grow h-12 text-lg"
          />
          <Button 
            onClick={handleDownload} 
            disabled={loading || !url}
            className="h-12 px-8 bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Ekstrak"}
          </Button>
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <p className="font-sans font-medium">{error}</p>
          </div>
        )}

        {result && (
          <div className="p-6 rounded-2xl bg-background border border-border space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex gap-6 items-center">
              {result.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={result.thumbnail} alt="Thumbnail" className="w-48 rounded-xl object-cover shadow-md" />
              )}
              <div className="space-y-2">
                <h3 className="font-display font-semibold text-lg line-clamp-2">{result.title}</h3>
                <p className="text-sm text-muted-foreground">Durasi: {result.duration} detik | Format: {result.ext}</p>
                <a 
                  href={result.direct_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-6 py-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full font-medium transition-colors"
                >
                  <DownloadCloud className="w-4 h-4" />
                  Download Media
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </main>
  );
}
