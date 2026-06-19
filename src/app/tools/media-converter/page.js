"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileVideo, AlertCircle, ArrowLeft, Download, Settings2 } from "lucide-react";
import Link from "next/link";

export default function MediaConverterPage() {
  const [file, setFile] = useState(null);
  const [format, setFormat] = useState("mp3");
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [resultUrl, setResultUrl] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResultUrl(null);
      setError(null);
      setProgressPercentage(0);
      setProgress("");
    }
  };

  const checkQuota = async () => {
    const res = await fetch("/api/v2/converter-quota", {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Gagal memeriksa kuota");
    }
  };

  const handleConvert = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResultUrl(null);
    setProgressPercentage(0);

    try {
      // 1. Check Quota FIRST before doing heavy client-side processing
      setProgress("Memeriksa Kuota...");
      await checkQuota();

      // 2. Load FFmpeg
      const { FFmpeg } = await import("@ffmpeg/ffmpeg");
      const { fetchFile } = await import("@ffmpeg/util");

      if (!ffmpegRef.current) {
        ffmpegRef.current = new FFmpeg();
      }
      
      const ffmpeg = ffmpegRef.current;

      ffmpeg.on("progress", ({ progress: ratio }) => {
        // Ratio is between 0 and 1
        const percent = Math.round(ratio * 100);
        setProgressPercentage(percent > 100 ? 100 : percent);
      });
      
      if (!ffmpeg.loaded) {
        setProgress("Mengunduh AI Engine (Satu kali saja)...");
        await ffmpeg.load({
          coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
          wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm"
        });
      }

      setProgress("Menyiapkan file...");
      const inputName = `input_${file.name.replace(/\s/g, '_')}`;
      let outputName = "output.mp4";
      let mimeType = "video/mp4";
      let command = [];

      await ffmpeg.writeFile(inputName, await fetchFile(file));

      if (format === "mp3") {
        outputName = "output.mp3";
        mimeType = "audio/mp3";
        setProgress("Mengonversi Video ke MP3...");
        command = ["-i", inputName, "-q:a", "0", "-map", "a", outputName];
      } else if (format === "mp4-720") {
        setProgress("Mengompres Video ke 720p HD...");
        command = ["-i", inputName, "-vf", "scale=-2:720", "-c:v", "libx264", "-crf", "28", "-preset", "ultrafast", "-c:a", "copy", outputName];
      } else if (format === "mp4-480") {
        setProgress("Mengompres Video ke 480p SD...");
        command = ["-i", inputName, "-vf", "scale=-2:480", "-c:v", "libx264", "-crf", "28", "-preset", "ultrafast", "-c:a", "copy", outputName];
      }

      await ffmpeg.exec(command);

      setProgress("Menyelesaikan file akhir...");
      const data = await ffmpeg.readFile(outputName);
      
      // Clean up memory
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(outputName);

      const blob = new Blob([data.buffer], { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      setResultUrl(url);
      setProgress("Konversi Selesai!");

    } catch (err) {
      console.error(err);
      setError(err.message || "Terjadi kesalahan saat konversi");
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
            Media <span className="text-primary text-glow">Converter</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Ubah video ke MP3 atau kompres ukurannya dengan kualitas super. Proses berjalan 100% di browser Anda untuk menjamin privasi maksimal.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          {/* Panel Kiri: Input */}
          <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-6 flex flex-col h-full">
            <h3 className="font-display font-semibold text-lg flex items-center gap-2">
              <Upload className="w-5 h-5 text-primary" /> Upload Media
            </h3>
            
            <div 
              className={`w-full flex-grow min-h-[200px] border-2 border-dashed rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-primary bg-primary/5' : 'border-border hover:bg-white/5 hover:border-primary/50'}`}
              onClick={() => !loading && fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                accept="video/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                disabled={loading}
              />
              {file ? (
                <div className="text-center space-y-3">
                  <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                    <FileVideo className="w-8 h-8" />
                  </div>
                  <div>
                    <p className="font-semibold text-primary truncate max-w-[200px]">{file.name}</p>
                    <p className="text-xs text-muted-foreground mt-1">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3 p-6">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto group-hover:bg-primary/20 group-hover:text-primary transition-colors">
                    <Upload className="w-6 h-6 text-muted-foreground group-hover:text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold font-sans text-sm md:text-base">Pilih File Video</p>
                    <p className="text-xs text-muted-foreground mt-1">Hanya mendukung file Video</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Panel Kanan: Setting & Output */}
          <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-6 flex flex-col justify-between">
            
            <div className="space-y-6">
              <h3 className="font-display font-semibold text-lg flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" /> Pengaturan Format
              </h3>
              
              <div className="space-y-3">
                <label className="text-sm font-medium text-foreground">Target Format</label>
                <Select value={format} onValueChange={setFormat} disabled={loading || !file}>
                  <SelectTrigger className="w-full h-12 rounded-xl bg-background border-input">
                    <SelectValue placeholder="Pilih Format" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3">🎵 Konversi ke MP3 (Audio Saja)</SelectItem>
                    <SelectItem value="mp4-720">🎬 Kompres Video HD (720p)</SelectItem>
                    <SelectItem value="mp4-480">📱 Kompres Video SD (480p)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {error && (
                <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex gap-3 text-sm">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-6">
              {loading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium text-primary">
                    <span>{progress}</span>
                    <span>{progressPercentage}%</span>
                  </div>
                  <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full transition-all duration-300" 
                      style={{ width: `${progressPercentage}%` }}
                    />
                  </div>
                </div>
              )}

              <Button 
                className="w-full h-12 rounded-full font-semibold" 
                size="lg"
                disabled={loading || !file}
                onClick={handleConvert}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" /> Memproses...
                  </>
                ) : (
                  "Mulai Konversi"
                )}
              </Button>

              {resultUrl && !loading && (
                <a 
                  href={resultUrl} 
                  download={`converted-${Date.now()}.${format === "mp3" ? "mp3" : "mp4"}`}
                  className="w-full"
                >
                  <Button variant="outline" className="w-full h-12 rounded-full mt-2 gap-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground">
                    <Download className="w-4 h-4" /> Download Hasil ({format.toUpperCase()})
                  </Button>
                </a>
              )}
            </div>

          </div>

        </div>
      </div>
    </main>
  );
}
