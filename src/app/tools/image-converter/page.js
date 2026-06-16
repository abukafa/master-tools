"use client";

import { useState, useRef } from "react";
import imageCompression from "browser-image-compression";
import heic2any from "heic2any";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Upload, Download, RefreshCw, FileImage } from "lucide-react";

export default function ImageConverterPage() {
  const [originalFile, setOriginalFile] = useState(null);
  const [compressedFile, setCompressedFile] = useState(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [maxSizeMB, setMaxSizeMB] = useState([1]);
  const [targetFormat, setTargetFormat] = useState("auto"); // auto, jpeg, png, webp, ico
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setOriginalFile(file);
      setCompressedFile(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setOriginalFile(file);
      setCompressedFile(null);
    }
  };

  const processImage = async () => {
    if (!originalFile) return;
    setIsCompressing(true);

    try {
      let fileToProcess = originalFile;

      // 1. Jika HEIC, convert ke JPEG Blob terlebih dahulu di client-side
      const isHeic = originalFile.name.toLowerCase().endsWith(".heic") || originalFile.type === "image/heic";
      if (isHeic) {
        const heicBlob = await heic2any({
          blob: originalFile,
          toType: "image/jpeg",
          quality: 0.8,
        });
        // heic2any bisa mereturn array jika multi-frame, ambil yang pertama
        const blob = Array.isArray(heicBlob) ? heicBlob[0] : heicBlob;
        fileToProcess = new File([blob], originalFile.name.replace(/\.heic$/i, ".jpg"), { type: "image/jpeg" });
      }

      // 2. Jika target format ICO, proses via API Route (Server-side)
      if (targetFormat === "ico") {
        const formData = new FormData();
        formData.append("file", fileToProcess);

        const response = await fetch("/api/convert/ico", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) throw new Error("Failed to convert to ICO");
        
        const icoBlob = await response.blob();
        const finalFile = new File([icoBlob], originalFile.name.split('.')[0] + ".ico", { type: "image/x-icon" });
        setCompressedFile(finalFile);
        setIsCompressing(false);
        return;
      }

      // 3. Proses Kompresi dan Cross-Format (JPG, PNG, WEBP) di Client-side
      const options = {
        maxSizeMB: maxSizeMB[0],
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      if (targetFormat !== "auto") {
        options.fileType = `image/${targetFormat}`;
      }

      const compressedBlob = await imageCompression(fileToProcess, options);
      
      // 4. Fallback jika ukuran hasil kompresi malah lebih besar (terjadi jika gambar sudah sangat teroptimasi)
      let finalBlob = compressedBlob;
      let formatChanged = targetFormat !== "auto" || isHeic;
      
      if (!formatChanged && compressedBlob.size > originalFile.size) {
        finalBlob = originalFile;
      }
      
      // Update ekstensi nama file berdasarkan format target
      let finalName = originalFile.name;
      if (targetFormat !== "auto") {
         finalName = finalName.split('.')[0] + "." + (targetFormat === "jpeg" ? "jpg" : targetFormat);
      } else if (isHeic) {
         finalName = finalName.replace(/\.heic$/i, ".jpg");
      }

      const finalFile = new File([finalBlob], finalName, { type: finalBlob.type || originalFile.type });
      setCompressedFile(finalFile);

    } catch (error) {
      console.error(error);
      alert("Gagal memproses gambar. Pastikan file valid.");
    } finally {
      setIsCompressing(false);
    }
  };

  const downloadImage = () => {
    if (!compressedFile) return;
    const url = URL.createObjectURL(compressedFile);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lubna_${compressedFile.name}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatBytes = (bytes, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            <span className="text-primary text-glow">Image</span> Converter
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            Compress and convert your images (HEIC, JPG, PNG, WEBP, ICO).
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Uploader & Controls */}
          <div className="space-y-6">
            <div 
              className={`border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center text-center transition-all bg-card/40 backdrop-blur-sm min-h-[250px] cursor-pointer ${originalFile ? 'border-primary/50' : 'border-border hover:border-primary/50 hover:bg-card/60'}`}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                onChange={handleFileChange} 
                accept="image/*,.heic" 
                className="hidden" 
              />
              <Upload className={`w-10 h-10 mb-4 ${originalFile ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="font-sans text-sm text-foreground font-semibold">
                {originalFile ? originalFile.name : "Click or drag image to upload"}
              </p>
              <p className="font-sans text-xs text-muted-foreground mt-2">
                Supports HEIC, JPG, PNG, WEBP
              </p>
              {originalFile && (
                <div className="mt-4 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                  {formatBytes(originalFile.size)}
                </div>
              )}
            </div>

            {originalFile && (
              <div className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-3xl shadow-xl space-y-6">
                
                <div className="space-y-3">
                  <Label className="text-sm font-semibold tracking-wide text-foreground">Target Format</Label>
                  <Select value={targetFormat} onValueChange={setTargetFormat}>
                    <SelectTrigger className="w-full bg-background/50 border-border/50 h-12 rounded-xl">
                      <SelectValue placeholder="Select target format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="auto">Auto (Keep Original)</SelectItem>
                      <SelectItem value="jpeg">JPG / JPEG</SelectItem>
                      <SelectItem value="png">PNG</SelectItem>
                      <SelectItem value="webp">WEBP</SelectItem>
                      <SelectItem value="ico">ICO (Windows Icon)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {targetFormat !== "ico" && (
                  <div className="space-y-4 pt-2">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold tracking-wide text-foreground">Target Max Size (MB)</Label>
                      <span className="text-xs font-mono text-primary bg-primary/10 px-2 py-1 rounded">{maxSizeMB} MB</span>
                    </div>
                    <Slider 
                      value={maxSizeMB} 
                      onValueChange={setMaxSizeMB} 
                      max={10} 
                      min={0.1} 
                      step={0.1}
                      className="cursor-pointer"
                    />
                  </div>
                )}

                <Button 
                  onClick={processImage}
                  disabled={isCompressing}
                  className="w-full h-12 rounded-full font-sans font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-[1.02] hover:btn-glow mt-4"
                >
                  {isCompressing ? (
                    <RefreshCw className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <FileImage className="w-5 h-5 mr-2" />
                  )}
                  {isCompressing ? "Processing..." : "Process Image"}
                </Button>
              </div>
            )}
          </div>

          {/* Result */}
          <div className="flex flex-col items-center justify-center p-8 bg-card/40 backdrop-blur-md border border-border rounded-3xl shadow-xl min-h-[400px]">
            {!compressedFile ? (
              <div className="text-center space-y-4 opacity-50">
                <FileImage className="w-16 h-16 mx-auto text-muted-foreground" />
                <p className="text-sm font-sans text-muted-foreground">Result will appear here</p>
              </div>
            ) : (
              <div className="text-center w-full flex flex-col items-center space-y-6">
                <div className="relative p-2 rounded-2xl shadow-[0_0_30px_rgba(255,102,178,0.15)] bg-white/5 border border-primary/20 w-full max-w-[250px] aspect-square flex items-center justify-center overflow-hidden">
                   {/* eslint-disable-next-line @next/next/no-img-element */}
                   <img 
                      src={URL.createObjectURL(compressedFile)} 
                      alt="Compressed Preview" 
                      className="max-w-full max-h-full object-contain rounded-xl"
                   />
                </div>

                <div className="space-y-1">
                  <h3 className="font-display text-2xl font-semibold text-primary">Success!</h3>
                  <p className="text-sm text-muted-foreground font-sans">
                    Size: <span className={compressedFile.size > originalFile.size ? "text-destructive font-bold" : "text-primary font-bold"}>{formatBytes(compressedFile.size)}</span>
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Format: {compressedFile.name.split('.').pop().toUpperCase()}
                  </p>
                  {compressedFile.size > originalFile.size && (
                    <p className="text-xs text-muted-foreground/80 mt-2 bg-muted/50 p-2 rounded-lg border border-border">
                      Ukuran lebih besar karena Anda mengubah ekstensi (misal: JPG ke PNG yang bersifat lossless).
                    </p>
                  )}
                </div>

                <Button 
                  onClick={downloadImage}
                  className="rounded-full h-12 px-8 font-sans font-semibold tracking-wide border-primary text-primary hover:bg-primary hover:text-primary-foreground transition-all w-full md:w-auto cursor-pointer"
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Result
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
