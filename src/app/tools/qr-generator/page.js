"use client";

import { useState, useRef } from "react";
import { QRCodeCanvas } from "qrcode.react";
import { Scanner } from "@yudiel/react-qr-scanner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { ArrowLeft, Download, Scan, QrCode } from "lucide-react";

export default function QRPage() {
  // Generator State
  const [text, setText] = useState("https://lubna.app");
  const [size, setSize] = useState([200]);
  const [fgColor, setFgColor] = useState("#FF66B2");
  const [bgColor, setBgColor] = useState("#0B070A");
  const qrRef = useRef(null);

  // Scanner State
  const [scanResult, setScanResult] = useState("");
  const [isScanning, setIsScanning] = useState(true);

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector("canvas");
    if (!canvas) return;

    const pngUrl = canvas
      .toDataURL("image/png")
      .replace("image/png", "image/octet-stream");
    let downloadLink = document.createElement("a");
    downloadLink.href = pngUrl;
    downloadLink.download = `Lubna_QR_${Date.now()}.png`;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);
  };

  const handleScan = (detectedCodes) => {
    if (detectedCodes && detectedCodes.length > 0) {
      setScanResult(detectedCodes[0].rawValue);
      setIsScanning(false);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-4xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            <span className="text-primary text-glow">QR</span> Master
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            Generate elegant QR codes or scan them instantly using your camera.
          </p>
        </div>

        <Tabs defaultValue="generate" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border mb-8">
            <TabsTrigger
              value="generate"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <QrCode className="w-4 h-4 mr-2" /> Generate
            </TabsTrigger>
            <TabsTrigger
              value="scan"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
              onClick={() => setIsScanning(true)}
            >
              <Scan className="w-4 h-4 mr-2" /> Scan
            </TabsTrigger>
          </TabsList>

          {/* GENERATOR TAB */}
          <TabsContent value="generate">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              {/* Controls */}
              <div className="space-y-6 bg-card/50 backdrop-blur-md border border-border p-6 rounded-3xl shadow-xl">
                <div className="space-y-3">
                  <Label
                    htmlFor="content"
                    className="text-sm font-semibold tracking-wide text-foreground"
                  >
                    Content (URL or Text)
                  </Label>
                  <Input
                    id="content"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Enter link or text here..."
                    className="font-sans border-border/50 bg-background/50 focus-visible:ring-primary h-12 rounded-xl"
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between">
                    <Label className="text-sm font-semibold tracking-wide text-foreground">
                      QR Size
                    </Label>
                    <span className="text-xs text-muted-foreground">
                      {size}px
                    </span>
                  </div>
                  <Slider
                    value={size}
                    onValueChange={setSize}
                    max={400}
                    min={100}
                    step={10}
                    className="cursor-pointer"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold tracking-wide text-foreground">
                      Pattern Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={fgColor}
                        onChange={(e) => setFgColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="text-xs text-muted-foreground font-mono uppercase">
                        {fgColor}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold tracking-wide text-foreground">
                      Background Color
                    </Label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={bgColor}
                        onChange={(e) => setBgColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer border-0 p-0 bg-transparent"
                      />
                      <span className="text-xs text-muted-foreground font-mono uppercase">
                        {bgColor}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="flex flex-col items-center justify-center p-8 bg-card/40 backdrop-blur-md border border-border rounded-3xl shadow-xl min-h-[400px]">
                <div
                  ref={qrRef}
                  className="p-4 rounded-2xl shadow-[0_0_30px_rgba(255,102,178,0.15)] bg-white/5 transition-all"
                >
                  <QRCodeCanvas
                    value={text || " "}
                    size={size[0]}
                    bgColor={bgColor}
                    fgColor={fgColor}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <Button
                  onClick={downloadQR}
                  className="mt-8 rounded-full h-12 px-8 font-sans font-semibold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-105 hover:btn-glow"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download QR
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* SCANNER TAB */}
          <TabsContent value="scan">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-full md:w-1/2 bg-card/50 backdrop-blur-md border border-border p-6 rounded-3xl shadow-xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden">
                {isScanning ? (
                  <div className="w-full max-w-sm rounded-xl overflow-hidden border-2 border-primary/50 shadow-[0_0_20px_rgba(255,102,178,0.2)]">
                    <Scanner
                      onScan={handleScan}
                      onError={(err) => console.error(err)}
                    />
                  </div>
                ) : (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                      <Scan className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-display text-2xl font-semibold text-foreground">
                      Scan Complete
                    </h3>
                    <Button
                      onClick={() => {
                        setScanResult("");
                        setIsScanning(true);
                      }}
                      variant="outline"
                      className="rounded-full mt-4"
                    >
                      Scan Another
                    </Button>
                  </div>
                )}
              </div>

              <div className="w-full md:w-1/2 bg-card/40 backdrop-blur-md border border-border p-8 rounded-3xl shadow-xl min-h-[400px] flex flex-col">
                <Label className="text-sm font-semibold tracking-wide text-primary uppercase mb-4 block">
                  Scanned Result
                </Label>

                {scanResult ? (
                  <div className="flex-1 flex flex-col">
                    <div className="bg-background/50 border border-border rounded-xl p-4 flex-1 mb-6 break-all font-sans text-lg text-foreground">
                      {scanResult}
                    </div>

                    {scanResult.startsWith("http") ? (
                      <a
                        href={scanResult}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button className="w-full rounded-full h-12 bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-[1.02] hover:btn-glow">
                          Open Link
                        </Button>
                      </a>
                    ) : (
                      <Button
                        onClick={() =>
                          navigator.clipboard.writeText(scanResult)
                        }
                        className="w-full rounded-full h-12 bg-card hover:bg-card/80 text-foreground border border-border transition-all"
                      >
                        Copy Text
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <Scan className="w-12 h-12 mb-4" />
                    <p className="font-sans text-sm">
                      Point your camera at a QR code to see the result here.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
