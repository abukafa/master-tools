"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Globe,
  Mic,
  Volume2,
  Download,
  Copy,
  Play,
  Square,
  Loader2,
  FileType,
} from "lucide-react";

export default function TextExtractorPage() {
  // Web to Text State
  const [url, setUrl] = useState("");
  const [format, setFormat] = useState("plain");
  const [extractedText, setExtractedText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);

  // Text to Audio (TTS) State
  const [ttsText, setTtsText] = useState(
    "Hello! Welcome to Lubna Text Extractor. You can type anything here and I will read it for you.",
  );
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  // Audio to Text (STT) State
  const [sttText, setSttText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    // Load TTS Voices
    const loadVoices = () => {
      const availableVoices = window.speechSynthesis.getVoices();
      setVoices(availableVoices);
      if (availableVoices.length > 0 && !selectedVoiceName) {
        // Set default voice automatically if not set
        setSelectedVoiceName(availableVoices[0].name);
      }
    };
    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    // Setup STT (SpeechRecognition)
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "id-ID"; // Default ke Bahasa Indonesia

      recognition.onresult = (event) => {
        let finalTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript + " ";
          }
        }
        if (finalTranscript) {
          setSttText((prev) => prev + finalTranscript);
        }
      };

      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      window.speechSynthesis.cancel();
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [selectedVoiceName]);

  // Handlers
  const handleExtractWeb = async () => {
    if (!url) return;
    setIsExtracting(true);
    setExtractedText("");
    try {
      const res = await fetch("/api/extract/web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, format }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setExtractedText(data.content);
    } catch (err) {
      alert(err.message || "Gagal mengekstrak web.");
    } finally {
      setIsExtracting(false);
    }
  };

  const handleSpeak = () => {
    if (!ttsText) return;
    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(ttsText);
    const voice = voices.find(v => v.name === selectedVoiceName);
    if (voice) {
      utterance.voice = voice;
    }

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const toggleListen = () => {
    if (!recognitionRef.current) {
      alert(
        "Browser Anda tidak mendukung Web Speech API (Microphone). Gunakan Chrome atau Edge.",
      );
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
    } else {
      setSttText("");
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const copyText = (text) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    alert("Teks disalin ke clipboard!");
  };

  return (
    <main className="min-h-screen bg-background text-foreground p-6 md:p-12 relative overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[20%] right-[10%] w-[400px] h-[400px] bg-secondary/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[10%] left-[5%] w-[500px] h-[500px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

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
            <span className="text-primary text-glow">Text</span> Extractor Suite
          </h1>
          <p className="text-muted-foreground mt-2 font-sans">
            Extract text from web pages, convert text to speech, or dictate
            voice to text.
          </p>
        </div>

        <Tabs defaultValue="web2text" className="w-full">
          <TabsList className="grid w-full max-w-2xl grid-cols-3 bg-card border border-border mb-8 h-12">
            <TabsTrigger
              value="web2text"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Globe className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Web to Text</span>
            </TabsTrigger>
            <TabsTrigger
              value="tts"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Volume2 className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Text to Audio</span>
            </TabsTrigger>
            <TabsTrigger
              value="stt"
              className="font-sans font-semibold data-[state=active]:bg-primary/20 data-[state=active]:text-primary"
            >
              <Mic className="w-4 h-4 mr-2" />{" "}
              <span className="hidden sm:inline">Audio to Text</span>
            </TabsTrigger>
          </TabsList>

          {/* WEB TO TEXT */}
          <TabsContent value="web2text">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row gap-4 items-end">
                <div className="w-full md:flex-1 space-y-2">
                  <Label className="text-sm font-semibold tracking-wide">
                    Target Article URL
                  </Label>
                  <Input
                    placeholder="https://en.wikipedia.org/wiki/Artificial_intelligence"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="h-12 rounded-xl bg-background/50"
                  />
                </div>
                <div className="w-full md:w-56 space-y-2">
                  <Label className="text-sm font-semibold tracking-wide">
                    Format Output
                  </Label>
                  <Select value={format} onValueChange={setFormat}>
                    <SelectTrigger className="h-12 rounded-xl bg-background/50 border-border">
                      <FileType className="w-4 h-4 mr-2 text-muted-foreground" />
                      <SelectValue placeholder="Format" />
                    </SelectTrigger>
                    <SelectContent position="popper" sideOffset={5}>
                      <SelectItem value="plain">Plain Text (Clean)</SelectItem>
                      <SelectItem value="markdown">Markdown</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  onClick={handleExtractWeb}
                  disabled={isExtracting || !url}
                  className="h-12 px-8 rounded-xl font-sans font-semibold w-full md:w-auto bg-primary hover:bg-primary/80 text-primary-foreground transition-all hover:btn-glow shrink-0"
                >
                  {isExtracting ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Globe className="w-4 h-4 mr-2" />
                  )}
                  Extract Text
                </Button>
              </div>

              <div className="relative">
                <textarea
                  readOnly
                  value={extractedText}
                  placeholder="Hasil ekstraksi teks akan muncul di sini (bersih dari iklan dan elemen web lainnya)..."
                  className="w-full h-[400px] rounded-2xl bg-background/50 border border-border p-6 font-sans text-sm resize-none focus:outline-none"
                />
                {extractedText && (
                  <Button
                    size="sm"
                    onClick={() => copyText(extractedText)}
                    className="absolute top-4 right-4 rounded-lg bg-card/80 hover:bg-card border border-border"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy All
                  </Button>
                )}
              </div>
            </div>
          </TabsContent>

          {/* TEXT TO AUDIO */}
          <TabsContent value="tts">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl space-y-6">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 relative">
                  <Label className="text-sm font-semibold tracking-wide mb-2 block">
                    Text to Speak
                  </Label>
                  <textarea
                    value={ttsText}
                    onChange={(e) => setTtsText(e.target.value)}
                    className="w-full h-[300px] rounded-2xl bg-background/50 border border-border p-6 font-sans text-lg leading-relaxed resize-none focus:outline-none focus:border-primary/50"
                  />
                </div>
                <div className="w-full md:w-72 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold tracking-wide">
                      Voice Profile
                    </Label>
                    <Select 
                      value={selectedVoiceName} 
                      onValueChange={setSelectedVoiceName}
                    >
                      <SelectTrigger className="w-full h-12 rounded-xl bg-background/50 border-border">
                        <SelectValue placeholder="Select a voice..." />
                      </SelectTrigger>
                      <SelectContent position="popper" className="max-h-[300px]">
                        {voices.length === 0 ? (
                          <SelectItem value="loading" disabled>Loading voices...</SelectItem>
                        ) : (
                          voices.map((v, i) => (
                            <SelectItem key={i} value={v.name}>
                              {v.name} ({v.lang})
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                  <Button
                    onClick={handleSpeak}
                    disabled={!ttsText}
                    className={`w-full h-16 rounded-2xl font-sans font-bold text-lg transition-all ${isSpeaking ? "bg-destructive hover:bg-destructive/80 text-white" : "bg-gradient-to-r from-primary to-secondary text-primary-foreground hover:scale-[1.02] hover:btn-glow"}`}
                  >
                    {isSpeaking ? (
                      <Square className="w-6 h-6 mr-2" />
                    ) : (
                      <Play className="w-6 h-6 mr-2" />
                    )}
                    {isSpeaking ? "Stop Speaking" : "Play Audio"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    Uses your browser's built-in speech synthesis engine.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* AUDIO TO TEXT */}
          <TabsContent value="stt">
            <div className="bg-card/50 backdrop-blur-md border border-border p-6 md:p-8 rounded-3xl shadow-xl flex flex-col items-center">
              <div className="relative w-full max-w-3xl mb-8">
                <textarea
                  readOnly
                  value={sttText}
                  placeholder="Klik tombol mikrofon dan mulailah berbicara..."
                  className="w-full h-[300px] rounded-2xl bg-background/50 border border-border p-6 font-sans text-xl leading-relaxed resize-none focus:outline-none text-center flex items-center justify-center placeholder:text-center"
                />
                {sttText && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(sttText)}
                    className="absolute top-4 right-4 rounded-lg bg-card/80 hover:bg-card"
                  >
                    <Copy className="w-4 h-4 mr-2" /> Copy
                  </Button>
                )}
              </div>

              <div className="flex flex-col items-center">
                <button
                  onClick={toggleListen}
                  className={`relative w-24 h-24 rounded-full flex items-center justify-center transition-all ${isListening ? "bg-destructive text-white animate-pulse shadow-[0_0_50px_rgba(255,0,0,0.5)]" : "bg-primary/20 text-primary hover:bg-primary/30 border-2 border-primary/50"}`}
                >
                  <Mic
                    className={`w-10 h-10 ${isListening ? "scale-110" : ""} transition-transform`}
                  />
                </button>
                <p className="mt-6 font-sans font-semibold tracking-wide text-foreground">
                  {isListening
                    ? "Listening... Speak now"
                    : "Click to Start Dictation"}
                </p>
                <p className="text-xs text-muted-foreground mt-2 max-w-sm text-center">
                  Allow microphone access. Works best on Chrome or Edge desktop
                  browsers. Speaks continuously until you stop.
                </p>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
