"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Upload, FileAudio, AlertCircle, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function VideoToTextPage() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [format, setFormat] = useState("json");
  const [progress, setProgress] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);
  const ffmpegRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setResult("");
      setError(null);
    }
  };

  const processVideoWithFFmpeg = async (videoFile) => {
    // Dynamic import to prevent Next.js SSR crashes
    const { FFmpeg } = await import("@ffmpeg/ffmpeg");
    const { fetchFile } = await import("@ffmpeg/util");

    if (!ffmpegRef.current) {
      ffmpegRef.current = new FFmpeg();
    }
    
    const ffmpeg = ffmpegRef.current;
    
    if (!ffmpeg.loaded) {
      setProgress("Memuat modul kompresi AI lokal...");
      await ffmpeg.load({
        coreURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.js",
        wasmURL: "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd/ffmpeg-core.wasm"
      });
    }

    setProgress("Mengekstrak audio dari video (Di browser Anda, menghemat kuota server)...");
    
    // Write the video file to FFmpeg's virtual filesystem
    await ffmpeg.writeFile("input.mp4", await fetchFile(videoFile));

    // Run the extraction command (convert to low quality MP3 for Whisper to save payload size)
    await ffmpeg.exec(["-i", "input.mp4", "-q:a", "0", "-map", "a", "output.mp3"]);

    setProgress("Audio berhasil diekstrak. Bersiap mengirim ke server...");
    
    // Read the result
    const data = await ffmpeg.readFile("output.mp3");
    
    // Clean up
    await ffmpeg.deleteFile("input.mp4");
    await ffmpeg.deleteFile("output.mp3");

    return new Blob([data.buffer], { type: "audio/mp3" });
  };

  const handleTranscribe = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);

    try {
      let audioBlob = file;

      // Jika file adalah video, kita ekstrak audionya secara lokal dengan FFmpeg
      if (file.type.startsWith("video/")) {
        audioBlob = await processVideoWithFFmpeg(file);
      }

      setProgress("Mengunggah dan Menganalisa Audio dengan OpenAI Whisper...");

      const formData = new FormData();
      formData.append("file", audioBlob, "audio.mp3");
      formData.append("language", "id");
      formData.append("response_format", format);

      const res = await fetch("/api/v2/whisper", {
        method: "POST",
        body: formData
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan transkripsi AI");
      }

      setResult(data.text);
      setProgress("");

    } catch (err) {
      setError(err.message);
      setProgress("");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8 text-center md:text-left">
          <Link
            href="/dashboard"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            Video to <span className="text-primary text-glow">Text</span>
          </h1>
          <p className="text-muted-foreground mt-2 font-sans max-w-xl">
            Transkrip video atau audio secara akurat menggunakan AI OpenAI Whisper. Pemrosesan awal dilakukan di browser Anda untuk menghemat kuota!
          </p>
        </div>

      <div className="p-8 rounded-3xl border border-border bg-card/50 backdrop-blur-sm space-y-8">
        
        {/* Upload Area */}
        <div 
          className="w-full h-48 border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 hover:border-primary/50 transition-all group"
          onClick={() => fileInputRef.current?.click()}
        >
          <input 
            type="file" 
            accept="video/*,audio/*" 
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          {file ? (
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mx-auto">
                <FileAudio className="w-8 h-8" />
              </div>
              <p className="font-semibold text-primary">{file.name}</p>
              <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <Upload className="w-10 h-10 mx-auto text-muted-foreground group-hover:text-primary transition-colors" />
              <div>
                <p className="font-semibold font-sans text-lg">Pilih Video / Audio</p>
                <p className="text-sm text-muted-foreground">Format didukung: MP4, MOV, MP3, WAV</p>
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="p-4 rounded-xl bg-destructive/10 text-destructive flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="font-sans font-medium text-sm">{error}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Select value={format} onValueChange={setFormat} disabled={loading}>
            <SelectTrigger className="w-[200px] h-12 rounded-full border-border bg-background">
              <SelectValue placeholder="Pilih Format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="json">Teks Biasa (Paragraf)</SelectItem>
              <SelectItem value="srt">Subtitle (.srt)</SelectItem>
              <SelectItem value="vtt">Subtitle Web (.vtt)</SelectItem>
            </SelectContent>
          </Select>

          <Button 
            size="lg"
            onClick={handleTranscribe} 
            disabled={loading || !file}
            className="rounded-full h-12 px-8 bg-primary text-primary-foreground hover:scale-105 transition-transform"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : "Mulai Transkrip AI"}
          </Button>
        </div>

        {loading && progress && (
          <p className="text-sm text-primary animate-pulse text-center mx-auto max-w-md">{progress}</p>
        )}

        {result && (
          <div className="pt-8 border-t border-border space-y-4 animate-in fade-in slide-in-from-bottom-4">
            <h3 className="text-xl font-display font-semibold text-primary">Hasil Transkrip:</h3>
            <div className="p-6 rounded-2xl bg-background border border-border">
              <p className="font-sans text-foreground leading-relaxed whitespace-pre-wrap">{result}</p>
            </div>
            <Button 
              variant="outline" 
              className="rounded-full"
              onClick={() => {
                navigator.clipboard.writeText(result);
                alert("Teks berhasil disalin!");
              }}
            >
              Salin Teks
            </Button>
          </div>
        )}

      </div>
      </div>
    </main>
  );
}
