"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, Image as ImageIcon, DownloadCloud, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function BgRemoverPage() {
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [resultUrl, setResultUrl] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected && selected.type.startsWith("image/")) {
      setFile(selected);
      setPreviewUrl(URL.createObjectURL(selected));
      setResultUrl(null);
      setError(null);
    }
  };

  const handleRemoveBg = async () => {
    if (!file) return;
    
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/v2/remove-bg", {
        method: "POST",
        body: formData
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Gagal menghapus background");
      }

      const imageBlob = await res.blob();
      const url = URL.createObjectURL(imageBlob);
      setResultUrl(url);

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
            AI Background <span className="text-primary text-glow">Remover</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Hapus latar belakang foto dalam hitungan detik menggunakan AI. (Premium Tool)
          </p>
        </div>

      {error && (
        <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center justify-center gap-3">
          <AlertCircle className="w-5 h-5" />
          <p className="font-sans font-medium">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Original Image */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-xl text-center">Foto Asli</h3>
          <div 
            className="aspect-square rounded-3xl border-2 border-dashed border-border bg-card/30 flex flex-col items-center justify-center cursor-pointer hover:bg-card/50 transition-colors overflow-hidden relative group"
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={handleFileChange}
            />
            
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Preview" className="w-full h-full object-cover group-hover:opacity-75 transition-opacity" />
            ) : (
              <div className="text-center space-y-4 p-8 text-muted-foreground">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto text-primary">
                  <Upload className="w-8 h-8" />
                </div>
                <p className="font-sans font-medium text-lg">Klik untuk unggah foto</p>
                <p className="text-sm">Maksimal resolusi direkomendasikan: 25 Megapixel</p>
              </div>
            )}
          </div>
        </div>

        {/* Result Image */}
        <div className="space-y-4">
          <h3 className="font-display font-semibold text-xl text-center">Hasil (Transparan)</h3>
          <div className="aspect-square rounded-3xl border border-border bg-gradient-to-br from-card/30 to-background flex flex-col items-center justify-center overflow-hidden relative"
               style={{ backgroundImage: 'radial-gradient(circle, #333 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
            
            {!resultUrl && !loading && (
              <div className="text-center space-y-4 p-8 text-muted-foreground/50">
                <ImageIcon className="w-16 h-16 mx-auto opacity-50" />
                <p className="font-sans">Hasil akan muncul di sini</p>
              </div>
            )}

            {loading && (
              <div className="text-center space-y-4 p-8 text-primary">
                <Loader2 className="w-12 h-12 animate-spin mx-auto" />
                <p className="font-sans font-medium animate-pulse">Memproses AI...</p>
              </div>
            )}

            {resultUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={resultUrl} alt="Result" className="w-full h-full object-contain drop-shadow-2xl animate-in zoom-in-95 duration-500" />
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-center gap-4 pt-4">
        <Button 
          size="lg"
          onClick={handleRemoveBg} 
          disabled={loading || !file}
          className="rounded-full px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform"
        >
          {loading ? "Menghapus..." : "Hapus Background"}
        </Button>

        {resultUrl && (
          <a 
            href={resultUrl} 
            download="lubna-bg-removed.png"
          >
            <Button size="lg" variant="secondary" className="rounded-full px-8 gap-2 hover:scale-105 transition-transform">
              <DownloadCloud className="w-5 h-5" />
              Download PNG
            </Button>
          </a>
        )}
      </div>
      </div>
    </main>
  );
}
