"use client";

import { useState, useRef, useEffect } from "react";
import { PDFDocument } from "pdf-lib";
import JSZip from "jszip";
import SignatureCanvas from "react-signature-canvas";
import { Document, Page, pdfjs } from "react-pdf";
import { Rnd } from "react-rnd";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import {
  ArrowLeft,
  FileText,
  Download,
  Scissors,
  Layers,
  Loader2,
  Plus,
  Trash2,
  PenTool,
  Eraser,
  CheckCircle2,
} from "lucide-react";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";

// Konfigurasi Worker untuk react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

export default function PDFStudioPage() {
  // === MERGER STATE ===
  const [mergeFiles, setMergeFiles] = useState([]);
  const [isMerging, setIsMerging] = useState(false);
  const mergeFileInputRef = useRef(null);

  // === SPLITTER STATE ===
  const [splitFile, setSplitFile] = useState(null);
  const [splitPages, setSplitPages] = useState("");
  const [isSplitting, setIsSplitting] = useState(false);
  const splitFileInputRef = useRef(null);

  // === SIGNER STATE (VISUAL EDITOR) ===
  const [signFile, setSignFile] = useState(null);
  const [signFileUrl, setSignFileUrl] = useState(null);
  const [signPageNum, setSignPageNum] = useState(1);
  const [numPages, setNumPages] = useState(null);
  const [isSigning, setIsSigning] = useState(false);

  // State untuk tanda tangan
  const sigCanvas = useRef(null);
  const signFileInputRef = useRef(null);
  const [signatureImage, setSignatureImage] = useState(null); // Data URL

  // State untuk Editor Visual
  const [showEditor, setShowEditor] = useState(false);
  const [pdfDims, setPdfDims] = useState({ width: 0, height: 0 }); // Ukuran layar
  const [signPos, setSignPos] = useState({ x: 50, y: 50 });
  const [signSize, setSignSize] = useState({ width: 150, height: 80 });

  const [isMounted, setIsMounted] = useState(false);
  useEffect(() => setIsMounted(true), []);

  // === Handlers for Merger ===
  const handleAddMergeFiles = (e) => {
    const files = Array.from(e.target.files).filter(
      (f) => f.type === "application/pdf",
    );
    if (files.length > 0) {
      setMergeFiles((prev) => [...prev, ...files]);
    }
  };

  const removeMergeFile = (index) => {
    setMergeFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const executeMerge = async () => {
    if (mergeFiles.length < 2)
      return alert("Pilih minimal 2 file PDF untuk digabungkan.");
    setIsMerging(true);
    try {
      const mergedPdf = await PDFDocument.create();
      for (const file of mergeFiles) {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await PDFDocument.load(arrayBuffer);
        const copiedPages = await mergedPdf.copyPages(
          pdf,
          pdf.getPageIndices(),
        );
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }
      const pdfBytes = await mergedPdf.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Lubna_Merged_${Date.now()}.pdf`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal menggabungkan PDF.");
    } finally {
      setIsMerging(false);
    }
  };

  // === Handlers for Splitter ===
  const executeSplit = async (mode) => {
    if (!splitFile) return;
    setIsSplitting(true);
    try {
      const arrayBuffer = await splitFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();
      const zip = new JSZip();

      if (mode === "all") {
        for (let i = 0; i < totalPages; i++) {
          const newPdf = await PDFDocument.create();
          const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
          newPdf.addPage(copiedPage);
          const pdfBytes = await newPdf.save();
          zip.file(`Page_${i + 1}.pdf`, pdfBytes);
        }
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(zipBlob);
        link.download = `Lubna_Split_${splitFile.name.replace(".pdf", "")}.zip`;
        link.click();
      } else if (mode === "custom") {
        if (!splitPages.trim()) return alert("Masukkan nomor halaman!");
        const pageNumbers = splitPages
          .split(",")
          .map((n) => parseInt(n.trim()) - 1)
          .filter((n) => !isNaN(n) && n >= 0 && n < totalPages);
        if (pageNumbers.length === 0)
          return alert("Nomor halaman tidak valid.");

        const newPdf = await PDFDocument.create();
        const copiedPages = await newPdf.copyPages(pdfDoc, pageNumbers);
        copiedPages.forEach((page) => newPdf.addPage(page));
        const pdfBytes = await newPdf.save();
        const blob = new Blob([pdfBytes], { type: "application/pdf" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = `Lubna_Extracted_${splitFile.name}`;
        link.click();
      }
    } catch (err) {
      alert("Gagal memproses PDF.");
    } finally {
      setIsSplitting(false);
    }
  };

  // === Handlers for Signer (Visual Editor) ===
  const handleSignFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSignFile(file);
      setSignFileUrl(URL.createObjectURL(file));
      setShowEditor(false);
      setSignatureImage(null);
    }
  };

  const handleSaveSignature = () => {
    if (sigCanvas.current.isEmpty())
      return alert("Silakan gambar tanda tangan Anda dulu.");
    const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL("image/png");
    setSignatureImage(dataUrl);
    setShowEditor(true);
  };

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages);
  };

  const onPageLoadSuccess = (page) => {
    // Ambil ukuran canvas halaman yang dirender oleh react-pdf di layar
    setPdfDims({ width: page.width, height: page.height });
  };

  const executeApplySignature = async () => {
    if (!signFile || !signatureImage) return;
    setIsSigning(true);
    try {
      const signatureImageBytes = await fetch(signatureImage).then((res) =>
        res.arrayBuffer(),
      );

      const arrayBuffer = await signFile.arrayBuffer();
      const pdfDoc = await PDFDocument.load(arrayBuffer);
      const totalPages = pdfDoc.getPageCount();

      const targetPageNum = parseInt(signPageNum) - 1;
      if (targetPageNum < 0 || targetPageNum >= totalPages)
        throw new Error("Halaman tidak valid.");

      const page = pdfDoc.getPage(targetPageNum);
      const { width: originalWidth, height: originalHeight } = page.getSize();

      const pngImage = await pdfDoc.embedPng(signatureImageBytes);

      // Gunakan SATU skala (scaleX) agar rasio aspek (lonjong/melebar) tidak terdistorsi
      const scale = originalWidth / pdfDims.width;

      // Konversi ukuran tanda tangan
      const finalWidth = signSize.width * scale;
      const finalHeight = signSize.height * scale;

      // Konversi koordinat (Ingat: pdf-lib (0,0) adalah di KIRI BAWAH)
      const finalX = signPos.x * scale;
      const finalY = originalHeight - (signPos.y + signSize.height) * scale;

      page.drawImage(pngImage, {
        x: finalX,
        y: finalY,
        width: finalWidth,
        height: finalHeight,
      });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = `Signed_${signFile.name}`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal menerapkan tanda tangan.");
    } finally {
      setIsSigning(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[10%] left-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            <span className="text-primary text-glow">PDF</span> Studio
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            Securely merge, split, and visually sign your PDF documents.
          </p>
        </div>

        <Tabs defaultValue="sign" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-card border border-border mb-8 h-12">
            <TabsTrigger
              value="merge"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Layers className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Merger</span>
            </TabsTrigger>
            <TabsTrigger
              value="split"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Scissors className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Splitter</span>
            </TabsTrigger>
            <TabsTrigger
              value="sign"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <PenTool className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Signer</span>
            </TabsTrigger>
          </TabsList>

          {/* MERGER TAB */}
          <TabsContent value="merge">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6 min-h-[400px]">
              <div
                className="border-2 border-dashed border-border hover:border-primary/50 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-background/50"
                onClick={() => mergeFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  multiple
                  accept="application/pdf"
                  ref={mergeFileInputRef}
                  className="hidden"
                  onChange={handleAddMergeFiles}
                />
                <Plus className="w-10 h-10 text-primary mb-2" />
                <p className="font-sans font-semibold text-foreground">
                  PDF files to Merge (min 2)
                </p>
              </div>

              {mergeFiles.length > 0 && (
                <div className="space-y-4">
                  <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                    {mergeFiles.map((f, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3 rounded-xl bg-background/50 border border-border/50"
                      >
                        <span className="font-sans text-sm truncate">
                          {f.name}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMergeFile(i)}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <Button
                    onClick={executeMerge}
                    disabled={isMerging || mergeFiles.length < 2}
                    className="w-full bg-primary text-primary-foreground hover:btn-glow"
                  >
                    {isMerging ? "Merging..." : "Merge PDFs"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SPLITTER TAB */}
          <TabsContent value="split">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6 min-h-[400px]">
              <div
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-background/50 ${splitFile ? "border-primary/50" : "border-border"}`}
                onClick={() => splitFileInputRef.current?.click()}
              >
                <input
                  type="file"
                  accept="application/pdf"
                  ref={splitFileInputRef}
                  className="hidden"
                  onChange={(e) => setSplitFile(e.target.files?.[0])}
                />
                <FileText className="w-10 h-10 mb-2 text-primary" />
                <p className="font-sans font-semibold text-foreground">
                  {splitFile ? splitFile.name : "Single PDF file to Split"}
                </p>
              </div>

              {splitFile && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                  <div className="p-6 rounded-2xl border border-border bg-background/30 flex flex-col items-center space-y-4">
                    <Button
                      onClick={() => executeSplit("all")}
                      disabled={isSplitting}
                      className="w-full bg-primary hover:bg-primary/80"
                    >
                      Download All as ZIP
                    </Button>
                  </div>
                  <div className="p-6 rounded-2xl border border-border bg-background/30 flex flex-col items-center space-y-4">
                    <Input
                      placeholder="e.g. 1, 3, 5"
                      value={splitPages}
                      onChange={(e) => setSplitPages(e.target.value)}
                    />
                    <Button
                      onClick={() => executeSplit("custom")}
                      disabled={isSplitting || !splitPages}
                      variant="outline"
                      className="w-full text-primary border-primary"
                    >
                      Extract to PDF
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SIGNER TAB (VISUAL EDITOR) */}
          <TabsContent value="sign">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6 min-h-[400px]">
              {!showEditor && (
                <>
                  <div
                    className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-background/50 ${signFile ? "border-primary/50" : "border-border hover:border-primary/50"}`}
                    onClick={() => signFileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      ref={signFileInputRef}
                      className="hidden"
                      onChange={handleSignFileSelect}
                    />
                    <FileText
                      className={`w-10 h-10 mb-2 ${signFile ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className="font-sans font-semibold text-foreground">
                      {signFile ? signFile.name : "1. Select PDF to Sign"}
                    </p>
                  </div>

                  {signFile && (
                    <div className="space-y-4 pt-4 max-w-xl mx-auto">
                      <Label className="text-sm font-semibold tracking-wide text-foreground">
                        2. Draw Your Signature
                      </Label>
                      <div className="border border-border rounded-2xl bg-white overflow-hidden shadow-inner relative">
                        {isMounted && (
                          <SignatureCanvas
                            ref={sigCanvas}
                            penColor="black"
                            canvasProps={{
                              className: "w-full h-48 cursor-crosshair",
                            }}
                          />
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => sigCanvas.current?.clear()}
                          className="absolute top-2 right-2 text-destructive hover:bg-destructive/10 h-8"
                        >
                          <Eraser className="w-4 h-4 mr-2" /> Clear
                        </Button>
                      </div>
                      <Button
                        onClick={handleSaveSignature}
                        className="w-full bg-primary text-primary-foreground font-bold h-12 rounded-xl"
                      >
                        Proceed to Editor{" "}
                        <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                      </Button>
                    </div>
                  )}
                </>
              )}

              {/* VISUAL EDITOR MODE */}
              {showEditor && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-background/50 p-4 rounded-2xl border border-border">
                    <div className="flex items-center space-x-4">
                      <Label className="text-sm font-semibold">Page:</Label>
                      <Input
                        type="number"
                        min="1"
                        max={numPages || 1}
                        value={signPageNum}
                        onChange={(e) => setSignPageNum(e.target.value)}
                        className="w-20"
                      />
                      <span className="text-sm text-muted-foreground">
                        of {numPages}
                      </span>
                    </div>

                    <div className="flex space-x-4 w-full md:w-auto">
                      <Button
                        variant="outline"
                        onClick={() => setShowEditor(false)}
                      >
                        Back
                      </Button>
                      <Button
                        onClick={executeApplySignature}
                        disabled={isSigning}
                        className="w-full md:w-auto bg-gradient-to-r from-primary to-secondary text-white font-bold btn-glow"
                      >
                        {isSigning ? (
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                        )}
                        Apply & Download
                      </Button>
                    </div>
                  </div>

                  <div className="relative border-2 border-border rounded-xl overflow-hidden bg-muted/20 flex justify-center p-4">
                    {/* Pembungkus relatif agar drag-and-drop bounding berfungsi dengan baik */}
                    <div
                      className="relative shadow-2xl"
                      style={{
                        width: pdfDims.width > 0 ? pdfDims.width : "auto",
                        minHeight: 400,
                      }}
                    >
                      <Document
                        file={signFileUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                        loading={
                          <div className="p-10 flex items-center justify-center">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                          </div>
                        }
                      >
                        <Page
                          pageNumber={parseInt(signPageNum) || 1}
                          renderTextLayer={false}
                          renderAnnotationLayer={false}
                          onLoadSuccess={onPageLoadSuccess}
                          width={Math.min(window.innerWidth - 100, 800)} // Responsif max 800px
                        />
                      </Document>

                      {/* Komponen Signature Draggable */}
                      {pdfDims.width > 0 && signatureImage && (
                        <Rnd
                          position={{ x: signPos.x, y: signPos.y }}
                          size={{
                            width: signSize.width,
                            height: signSize.height,
                          }}
                          onDragStop={(e, d) => {
                            setSignPos({ x: d.x, y: d.y });
                          }}
                          onResizeStop={(
                            e,
                            direction,
                            ref,
                            delta,
                            position,
                          ) => {
                            setSignSize({
                              width: ref.offsetWidth,
                              height: ref.offsetHeight,
                            });
                            setSignPos(position);
                          }}
                          bounds="parent"
                          className="border-2 border-primary/50 border-dashed rounded-lg group bg-black/5 hover:bg-primary/10 transition-colors"
                        >
                          <img
                            src={signatureImage}
                            alt="Signature"
                            className="w-full h-full object-contain pointer-events-none"
                          />
                          <div className="absolute -top-6 left-0 bg-primary text-primary-foreground text-[10px] px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                            Drag or Resize Me
                          </div>
                        </Rnd>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-center text-muted-foreground">
                    Drag and resize your signature. It will be permanently
                    stamped when you click "Apply & Download".
                  </p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
