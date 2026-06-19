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
  FileText,
  CheckCircle2,
  AlertCircle,
  ArrowLeft,
  Copy,
  UploadCloud,
} from "lucide-react";
import Link from "next/link";
import { useRef } from "react";

export default function SmartSummarizerPage() {
  const [text, setText] = useState("");
  const [type, setType] = useState("summary");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);

  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setLoading(true);
    setError(null);

    try {
      if (
        uploadedFile.type === "text/plain" ||
        uploadedFile.name.endsWith(".txt")
      ) {
        const reader = new FileReader();
        reader.onload = (event) => {
          let content = event.target.result;
          if (content.length > 50000) content = content.substring(0, 50000);
          setText(content);
          setLoading(false);
        };
        reader.readAsText(uploadedFile);
      } else if (
        uploadedFile.type === "application/pdf" ||
        uploadedFile.name.endsWith(".pdf")
      ) {
        const formData = new FormData();
        formData.append("file", uploadedFile);

        const res = await fetch("/api/v2/parse-doc", {
          method: "POST",
          body: formData,
        });

        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Gagal membaca PDF");

        setText(data.text);
        setLoading(false);
      } else {
        throw new Error("Hanya mendukung file .txt dan .pdf");
      }
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/v2/summarizer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, type }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal memproses dokumen");
      }

      setResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (result) {
      navigator.clipboard.writeText(result);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10 space-y-8">
        <div className="mb-8 text-center md:text-left">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Smart <span className="text-primary text-glow">Summarizer</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Ringkas jurnal panjang, ekstrak poin penting, atau terjemahkan
            dokumen hanya dalam hitungan detik.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="p-6 md:p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm flex flex-col h-full">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-4">
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <label className="font-display font-semibold text-lg text-foreground flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Teks Dokumen
                </label>
                <input
                  type="file"
                  accept=".txt,.pdf"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="rounded-full bg-background border-primary/20 hover:bg-primary/10 hover:text-primary gap-2"
                >
                  <UploadCloud className="w-4 h-4" />
                </Button>
              </div>

              <Select value={type} onValueChange={setType} disabled={loading}>
                <SelectTrigger className="w-full sm:w-48 bg-background border-input rounded-xl h-10">
                  <SelectValue placeholder="Mode AI" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="summary">📝 Ringkasan Detail</SelectItem>
                  <SelectItem value="key-points">🎯 Poin Utama Saja</SelectItem>
                  <SelectItem value="translate">
                    🌐 Terjemahkan ke ID
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste (Tempelkan) isi teks dokumen/PDF/jurnal Anda di sini..."
              className="w-full flex-grow min-h-[300px] p-4 rounded-xl border border-input bg-background text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none resize-none mb-4"
              maxLength={50000}
            />
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">
                {text.length} / 50.000 karakter
              </span>
              <Button
                onClick={handleGenerate}
                disabled={loading || !text.trim()}
                className="rounded-full px-6 bg-primary text-primary-foreground hover:scale-105 transition-transform"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Memproses...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Proses Sekarang
                  </>
                )}
              </Button>
            </div>

            {error && (
              <div className="mt-4 p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="font-sans font-medium text-sm">{error}</p>
              </div>
            )}
          </div>

          {/* Output Panel */}
          <div className="p-6 md:p-8 rounded-3xl border border-primary/20 bg-primary/5 flex flex-col h-full min-h-[400px]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-semibold text-lg text-primary flex items-center gap-2">
                ✨ Hasil AI
              </h3>
              {result && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCopy}
                  className="rounded-full bg-background hover:bg-primary/10"
                >
                  {copied ? (
                    <CheckCircle2 className="w-4 h-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 mr-2" />
                  )}
                  {copied ? "Tersalin!" : "Salin Teks"}
                </Button>
              )}
            </div>

            <div className="flex-grow p-4 rounded-xl bg-background border border-border overflow-y-auto">
              {result ? (
                <div className="prose prose-sm dark:prose-invert max-w-none font-sans whitespace-pre-wrap leading-relaxed">
                  {result}
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-muted-foreground/50 text-sm space-y-4">
                  <FileText className="w-12 h-12 opacity-20" />
                  <p>Hasil ringkasan akan muncul di sini</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
