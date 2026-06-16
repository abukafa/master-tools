"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import chroma from "chroma-js";
import * as htmlToImage from "html-to-image";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import {
  ArrowLeft,
  Lock,
  Unlock,
  Copy,
  Palette,
  PaintBucket,
  RefreshCw,
  Plus,
  Trash2,
  Download,
  Dices,
} from "lucide-react";

export default function ColorGeneratorPage() {
  // === PALETTE STATE ===
  const [palette, setPalette] = useState(
    Array(5).fill({ hex: "#000000", locked: false }),
  );
  const paletteRef = useRef(null);

  // === GRADIENT STATE ===
  const [gradientColors, setGradientColors] = useState(["#ff00ff", "#00ffff"]);
  const [gradientAngle, setGradientAngle] = useState(45);
  const [gradientType, setGradientType] = useState("linear"); // "linear", "radial", "conic"
  const gradientRef = useRef(null);

  // INIT PALETTE
  const generatePalette = useCallback(() => {
    setPalette((prev) =>
      prev.map((color) => {
        if (color.locked) return color;
        // Generate bright/neon colors
        const h = Math.floor(Math.random() * 360);
        const s = 0.8 + Math.random() * 0.2;
        const l = 0.5 + Math.random() * 0.2;
        return { hex: chroma(h, s, l, "hsl").hex(), locked: false };
      }),
    );
  }, []);

  useEffect(() => {
    generatePalette();
  }, [generatePalette]);

  // Handle Spacebar to generate
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Hanya berjalan jika tidak sedang mengetik di dalam input
      if (e.code === "Space" && e.target.tagName !== "INPUT") {
        e.preventDefault();
        generatePalette();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [generatePalette]);

  // PALETTE HANDLERS
  const toggleLock = (index) => {
    setPalette((prev) => {
      const newPalette = [...prev];
      newPalette[index] = {
        ...newPalette[index],
        locked: !newPalette[index].locked,
      };
      return newPalette;
    });
  };

  const updatePaletteColor = (index, newHex) => {
    setPalette((prev) => {
      const newPalette = [...prev];
      newPalette[index] = { ...newPalette[index], hex: newHex };
      return newPalette;
    });
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const downloadPalette = async () => {
    if (!paletteRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(paletteRef.current, {
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = `Lubna_Palette_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh palet.");
    }
  };

  // GRADIENT HANDLERS
  const addGradientColor = () => {
    if (gradientColors.length >= 7) return alert("Maksimal 7 warna.");
    setGradientColors([...gradientColors, chroma.random().hex()]);
  };

  const removeGradientColor = (index) => {
    if (gradientColors.length <= 2) return alert("Minimal 2 warna.");
    setGradientColors(gradientColors.filter((_, i) => i !== index));
  };

  const updateGradientColor = (index, newHex) => {
    const newColors = [...gradientColors];
    newColors[index] = newHex;
    setGradientColors(newColors);
  };

  const randomizeGradient = () => {
    const newColors = gradientColors.map(() => {
      const h = Math.floor(Math.random() * 360);
      const s = 0.8 + Math.random() * 0.2;
      const l = 0.5 + Math.random() * 0.2;
      return chroma(h, s, l, "hsl").hex();
    });
    setGradientColors(newColors);
  };

  const getGradientCSS = () => {
    if (gradientType === "linear") {
      return `linear-gradient(${gradientAngle}deg, ${gradientColors.join(", ")})`;
    } else if (gradientType === "radial") {
      return `radial-gradient(circle, ${gradientColors.join(", ")})`;
    } else if (gradientType === "conic") {
      return `conic-gradient(from ${gradientAngle}deg, ${gradientColors.join(", ")})`;
    }
  };

  const downloadGradient = async () => {
    if (!gradientRef.current) return;
    try {
      const dataUrl = await htmlToImage.toPng(gradientRef.current, {
        quality: 1.0,
      });
      const link = document.createElement("a");
      link.download = `Lubna_Gradient_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error(err);
      alert("Gagal mengunduh gradasi.");
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <h1 className="font-display text-4xl md:text-5xl font-bold">
            <span className="text-primary text-glow">Color</span> Generator
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            Create elegant palettes and beautiful CSS gradients. Press{" "}
            <kbd className="bg-muted px-2 py-0.5 rounded-md border border-border">
              Spacebar
            </kbd>{" "}
            to generate palettes.
          </p>
        </div>

        <Tabs defaultValue="palette" className="w-full">
          <TabsList className="grid w-full max-w-md grid-cols-2 bg-card border border-border mb-8 h-12">
            <TabsTrigger
              value="palette"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Palette className="w-4 h-4 mr-2" /> Palette
            </TabsTrigger>
            <TabsTrigger
              value="gradient"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <PaintBucket className="w-4 h-4 mr-2" /> Gradient
            </TabsTrigger>
          </TabsList>

          {/* === PALETTE TAB === */}
          <TabsContent value="palette">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl flex flex-col h-[70vh] min-h-[500px]">
              {/* Header Actions */}
              <div className="flex justify-end gap-4 mb-4">
                <Button
                  variant="outline"
                  onClick={generatePalette}
                  className="hover:text-primary border-border"
                >
                  <RefreshCw className="w-4 h-4 mr-2" /> Randomize
                </Button>
                <Button
                  onClick={downloadPalette}
                  className="bg-primary hover:bg-primary/80 text-white btn-glow"
                >
                  <Download className="w-4 h-4 mr-2" /> Download
                </Button>
              </div>

              {/* Palette Container */}
              <div
                ref={paletteRef}
                className="flex-1 flex flex-col md:flex-row w-full rounded-2xl overflow-hidden border border-border shadow-inner"
              >
                {palette.map((color, idx) => {
                  const hexStr = color.hex.toUpperCase();
                  const rgbStr = chroma(color.hex).css();
                  const textColor =
                    chroma(color.hex).luminance() > 0.5 ? "#000000" : "#ffffff";

                  return (
                    <div
                      key={idx}
                      className="flex-1 flex flex-col md:flex-col items-center justify-center p-4 md:p-6 transition-colors duration-500 ease-out group relative min-h-[80px] md:min-h-[100px]"
                      style={{ backgroundColor: color.hex, color: textColor }}
                    >
                      {/* Hidden Color Picker mapped to the entire block */}
                      <input
                        type="color"
                        value={color.hex}
                        onChange={(e) =>
                          updatePaletteColor(idx, e.target.value)
                        }
                        className="absolute inset-0 w-full h-full opacity-0 cursor-crosshair z-0"
                        title="Click to pick a color"
                      />

                      <div className="flex flex-row md:flex-col items-center justify-between md:justify-center w-full opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 transform translate-y-0 md:translate-y-4 md:group-hover:translate-y-0 relative z-10 pointer-events-none">
                        <div className="flex flex-col items-start md:items-center">
                          {/* HEX Copy */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(hexStr);
                            }}
                            className="font-display text-xl md:text-2xl font-bold tracking-wider hover:scale-110 transition-transform active:scale-95 pointer-events-auto"
                          >
                            {hexStr}
                          </button>

                          {/* RGB Copy */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              copyToClipboard(rgbStr);
                            }}
                            className="font-mono text-xs md:text-sm opacity-80 hover:opacity-100 transition-opacity pointer-events-auto hidden sm:block md:block"
                          >
                            {rgbStr}
                          </button>
                        </div>

                        {/* Lock Button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleLock(idx);
                          }}
                          className="p-2 md:p-3 rounded-full hover:bg-black/10 transition-colors pointer-events-auto"
                        >
                          {color.locked ? (
                            <Lock className="w-5 h-5 md:w-6 md:h-6" />
                          ) : (
                            <Unlock className="w-5 h-5 md:w-6 md:h-6 opacity-50" />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>

          {/* === GRADIENT TAB === */}
          <TabsContent value="gradient">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Preview Area */}
                <div className="flex-[2] flex flex-col space-y-4">
                  <div
                    ref={gradientRef}
                    className="w-full aspect-[16/9] lg:aspect-auto lg:h-[500px] rounded-2xl border border-border shadow-inner transition-all duration-300"
                    style={{ background: getGradientCSS() }}
                  />
                  <div className="flex gap-4">
                    <Button
                      onClick={downloadGradient}
                      className="flex-1 bg-primary hover:bg-primary/80 text-white btn-glow h-12 rounded-xl"
                    >
                      <Download className="w-4 h-4 mr-2" /> Download
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() =>
                        copyToClipboard(`background: ${getGradientCSS()};`)
                      }
                      className="flex-1 border-border hover:text-primary h-12 rounded-xl"
                    >
                      <Copy className="w-4 h-4 mr-2" /> Copy CSS
                    </Button>
                  </div>
                </div>

                {/* Control Panel */}
                <div className="flex-1 space-y-8 bg-background/50 p-6 rounded-2xl border border-border h-fit">
                  {/* Type Selection */}
                  <div className="space-y-3">
                    <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                      Gradient Type
                    </Label>
                    <Select
                      value={gradientType}
                      onValueChange={setGradientType}
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl bg-background border-border">
                        <SelectValue placeholder="Select Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linear">Linear Gradient</SelectItem>
                        <SelectItem value="radial">Radial (Circle)</SelectItem>
                        <SelectItem value="conic">
                          Conic (Diamond / Sweep)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Angle (Only for Linear & Conic) */}
                  {(gradientType === "linear" || gradientType === "conic") && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                          Angle
                        </Label>
                        <span className="font-mono text-sm bg-background px-2 py-1 rounded-md border border-border">
                          {gradientAngle}°
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="360"
                        value={gradientAngle}
                        onChange={(e) => setGradientAngle(e.target.value)}
                        className="w-full accent-primary"
                      />
                    </div>
                  )}

                  {/* Color Stops */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                        Color Stops
                      </Label>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={randomizeGradient}
                          className="text-muted-foreground hover:text-primary p-2"
                        >
                          <Dices className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={addGradientColor}
                          disabled={gradientColors.length >= 7}
                          className="text-primary hover:bg-primary/10"
                        >
                          <Plus className="w-4 h-4 mr-1" /> Add
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2">
                      {gradientColors.map((col, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          {/* Color Picker Native */}
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden shadow-sm flex-shrink-0 cursor-pointer border border-border">
                            <input
                              type="color"
                              value={col}
                              onChange={(e) =>
                                updateGradientColor(idx, e.target.value)
                              }
                              className="absolute -top-2 -left-2 w-16 h-16 cursor-pointer"
                            />
                          </div>

                          {/* Hex Input */}
                          <Input
                            value={col}
                            onChange={(e) =>
                              updateGradientColor(idx, e.target.value)
                            }
                            className="font-mono uppercase h-12 bg-background border-border"
                          />

                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => removeGradientColor(idx)}
                            disabled={gradientColors.length <= 2}
                            className="text-destructive hover:bg-destructive/10 hover:text-destructive h-12 w-12 shrink-0"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
