"use client";

import { useState } from "react";
import prettier from "prettier/standalone";
import * as parserBabel from "prettier/plugins/babel";
import * as parserEstree from "prettier/plugins/estree";
import * as parserHtml from "prettier/plugins/html";
import * as parserCss from "prettier/plugins/postcss";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { ArrowLeft, Code, Copy, Check, Sparkles } from "lucide-react";

export default function CodeFormatterPage() {
  const [code, setCode] = useState("");
  const [language, setLanguage] = useState("babel"); // default to js/ts
  const [isFormatting, setIsFormatting] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const formatCode = async () => {
    if (!code.trim()) return;
    setIsFormatting(true);
    setErrorMsg(null);

    try {
      let plugins = [parserEstree];
      if (language === "babel" || language === "json") plugins.push(parserBabel);
      if (language === "html") plugins.push(parserHtml);
      if (language === "css") plugins.push(parserCss);

      const formatted = await prettier.format(code, {
        parser: language,
        plugins: plugins,
        semi: true,
        singleQuote: false,
        trailingComma: "es5",
        tabWidth: 2,
      });

      setCode(formatted);
    } catch (err) {
      console.error(err);
      let msg = err.message || "Failed to format code.";
      // Tambahkan petunjuk bahasa jika kemungkinan salah pilih parser
      if (msg.includes("SyntaxError") || msg.includes("Unexpected token")) {
        msg = `[Syntax Error] Format gagal. Pastikan Anda telah memilih bahasa (Language) yang tepat di menu Dropdown atas (Saat ini: ${language.toUpperCase()}).\n\nDetail:\n${msg}`;
      }
      setErrorMsg(msg);
    } finally {
      setIsFormatting(false);
    }
  };

  const copyToClipboard = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy", err);
    }
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden flex flex-col">
      {/* Ambient Background */}
      <div className="absolute top-[10%] right-[20%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[20%] left-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto w-full relative z-10 flex-1 flex flex-col">
        <div className="mb-8 flex-shrink-0">
          <Link href="/" className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors text-sm font-sans mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-4xl md:text-5xl font-bold">
                <span className="text-primary text-glow">Code</span> Formatter
              </h1>
              <p className="text-muted-foreground mt-2 font-sans">
                Instantly beautify your messy code snippets.
              </p>
            </div>
            <div className="w-full md:w-64">
              <Label className="text-sm font-semibold tracking-wide text-foreground mb-2 block">Language</Label>
              <Select value={language} onValueChange={setLanguage}>
                <SelectTrigger className="w-full bg-background/50 border-border/50 h-10 rounded-lg">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="babel">JavaScript / TypeScript</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="css">CSS / SCSS</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm font-mono font-medium flex-shrink-0 break-all whitespace-pre-wrap max-h-[300px] overflow-auto">
            {errorMsg}
          </div>
        )}

        {/* Editor Area */}
        <div className="flex-1 min-h-[400px] relative rounded-3xl overflow-hidden border border-border bg-card/40 backdrop-blur-md shadow-xl flex flex-col">
          <div className="h-12 bg-card/80 border-b border-border flex items-center justify-between px-4 flex-shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-destructive/80"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
              <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={copyToClipboard}
                className="text-muted-foreground hover:text-foreground h-8 px-3 rounded-md"
              >
                {isCopied ? <Check className="w-4 h-4 mr-2 text-green-400" /> : <Copy className="w-4 h-4 mr-2" />}
                {isCopied ? "Copied!" : "Copy"}
              </Button>
            </div>
          </div>
          
          <textarea
            value={code}
            onChange={(e) => setCode(e.target.value)}
            spellCheck={false}
            placeholder="// Paste your messy code here..."
            className="flex-1 w-full bg-transparent resize-none p-6 text-sm font-mono text-foreground/90 focus:outline-none placeholder:text-muted-foreground/50 leading-relaxed"
          />
        </div>

        <div className="mt-8 flex justify-end flex-shrink-0">
          <Button 
            onClick={formatCode}
            disabled={isFormatting || !code.trim()}
            className="h-12 px-8 rounded-full font-sans font-bold tracking-wide bg-gradient-to-r from-primary to-secondary text-primary-foreground border-0 transition-all hover:scale-105 hover:btn-glow cursor-pointer shadow-lg"
          >
            {isFormatting ? (
              <Code className="w-5 h-5 mr-2 animate-pulse" />
            ) : (
              <Sparkles className="w-5 h-5 mr-2" />
            )}
            {isFormatting ? "Formatting..." : "Format Code"}
          </Button>
        </div>
      </div>
    </main>
  );
}
