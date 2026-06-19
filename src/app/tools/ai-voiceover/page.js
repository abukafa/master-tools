"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  Mic,
  Play,
  Download,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

export default function VoiceoverPage() {
  const [text, setText] = useState("");
  const [language, setLanguage] = useState("id");
  const [speed, setSpeed] = useState("normal");

  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState(null);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setAudioUrl(null);

    try {
      const res = await fetch("/api/v2/voiceover", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, language, speed }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal membuat voiceover");
      }

      setAudioUrl(data.audio_url);
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
            AI Voiceover <span className="text-primary text-glow">Studio</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Ubah naskah atau teks Anda menjadi suara narasi (Voiceover) secara
            otomatis dalam hitungan detik.
          </p>
        </div>

        <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">
              Skrip / Teks Narasi
            </label>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Ketik teks yang ingin disuarakan di sini..."
              className="w-full min-h-[200px] p-4 rounded-xl border border-input bg-background text-foreground text-base focus:ring-2 focus:ring-primary focus:outline-none resize-y"
              maxLength={2000}
            />
            <div className="text-right text-xs text-muted-foreground">
              {text.length} / 2000 karakter
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Bahasa & Aksen
              </label>
              <Select
                value={language}
                onValueChange={setLanguage}
                disabled={loading}
              >
                <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl">
                  <SelectValue placeholder="Pilih Bahasa" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id">🇮🇩 Bahasa Indonesia</SelectItem>
                  <SelectItem value="en">🇺🇸 English (US)</SelectItem>
                  <SelectItem value="ja">🇯🇵 Japanese</SelectItem>
                  <SelectItem value="ko">🇰🇷 Korean</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Kecepatan Suara
              </label>
              <Select value={speed} onValueChange={setSpeed} disabled={loading}>
                <SelectTrigger className="w-full h-12 bg-background border-input rounded-xl">
                  <SelectValue placeholder="Pilih Kecepatan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">▶️ Normal</SelectItem>
                  <SelectItem value="slow">🐌 Lambat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="font-sans font-medium text-sm">{error}</p>
            </div>
          )}

          <div className="pt-4 border-t border-border flex justify-end">
            <Button
              size="lg"
              onClick={handleGenerate}
              disabled={loading || !text.trim()}
              className="rounded-full px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform h-12"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  Memproses Suara...
                </>
              ) : (
                <>
                  <Mic className="w-5 h-5 mr-2" />
                  Buat Suara (Generate)
                </>
              )}
            </Button>
          </div>

          {audioUrl && (
            <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4 animate-in fade-in slide-in-from-bottom-4">
              <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2">
                <Play className="w-5 h-5" /> Hasil Voiceover
              </h3>

              <audio controls className="w-full" src={audioUrl}>
                Browser Anda tidak mendukung elemen audio.
              </audio>

              <div className="flex justify-end pt-2">
                <a
                  href={audioUrl}
                  download={`voiceover-${new Date().getTime()}.mp3`}
                >
                  <Button
                    variant="outline"
                    className="rounded-full gap-2 hover:bg-primary hover:text-primary-foreground"
                  >
                    <Download className="w-4 h-4" /> Unduh MP3
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
