import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkAndConsumeQuota } from "@/lib/rate-limit-mongo";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");
    const language = formData.get("language") || "id"; // Default Indonesian
    
    if (!file) {
      return NextResponse.json({ error: "Audio file is required" }, { status: 400 });
    }

    // Cek Quota
    const quota = await checkAndConsumeQuota(token.uid, "whisper");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    const provider = process.env.WHISPER_PROVIDER || "groq";
    
    let apiUrl, apiKey, modelName;
    if (provider === "groq") {
      apiUrl = "https://api.groq.com/openai/v1/audio/transcriptions";
      apiKey = process.env.GROQ_API_KEY;
      modelName = "whisper-large-v3-turbo"; // Model tercepat & gratis dari Groq
    } else {
      apiUrl = "https://api.openai.com/v1/audio/transcriptions";
      apiKey = process.env.OPENAI_API_KEY;
      modelName = "whisper-1";
    }
    
    // SIMULASI LOKAL (jika tidak ada API Key asli)
    if (!apiKey || apiKey === "dummy_key") {
      // Simulate transcription delay
      await new Promise(r => setTimeout(r, 2000));
      return NextResponse.json({ 
        text: `Ini adalah teks simulasi karena API Key untuk provider ${provider.toUpperCase()} belum disetel. Integrasi file Anda berhasil.`,
        quota_remaining: quota.remaining
      });
    }

    const requestedFormat = formData.get("response_format") || "json";
    
    // Groq hanya mendukung json, text, dan verbose_json
    // Jika user meminta srt/vtt, kita minta verbose_json dari Groq lalu kita ubah sendiri.
    const apiFormat = (requestedFormat === "srt" || requestedFormat === "vtt") ? "verbose_json" : requestedFormat;

    // Forward ke API Provider (Groq / OpenAI)
    const whisperFormData = new FormData();
    whisperFormData.append("file", file);
    whisperFormData.append("model", modelName);
    whisperFormData.append("language", language);
    whisperFormData.append("response_format", apiFormat);

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`
      },
      body: whisperFormData
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json({ error: `${provider.toUpperCase()} Whisper failed`, details: errorData }, { status: response.status });
    }

    const contentType = response.headers.get("content-type") || "";
    let resultText = "";
    
    if (contentType.includes("application/json")) {
      const data = await response.json();
      
      // Jika format yang direkues adalah srt atau vtt, kita konversi dari segments
      if ((requestedFormat === "srt" || requestedFormat === "vtt") && data.segments) {
        resultText = generateSubtitles(data.segments, requestedFormat);
      } else {
        resultText = data.text; // Format biasa (json / verbose_json tapi user minta json)
      }
    } else {
      resultText = await response.text();
    }

    return NextResponse.json({ 
      text: resultText,
      quota_remaining: quota.remaining 
    });

  } catch (error) {
    console.error("[Whisper Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Fungsi Bantuan: Konversi detik (2.5) menjadi format waktu (00:00:02,500)
function formatTime(seconds, isSrt = true) {
  const date = new Date(seconds * 1000);
  const hh = String(date.getUTCHours()).padStart(2, '0');
  const mm = String(date.getUTCMinutes()).padStart(2, '0');
  const ss = String(date.getUTCSeconds()).padStart(2, '0');
  const ms = String(date.getUTCMilliseconds()).padStart(3, '0');
  return isSrt ? `${hh}:${mm}:${ss},${ms}` : `${hh}:${mm}:${ss}.${ms}`;
}

// Fungsi Bantuan: Membuat string SRT atau VTT dari segments
function generateSubtitles(segments, format) {
  let output = format === "vtt" ? "WEBVTT\n\n" : "";
  const isSrt = format === "srt";

  segments.forEach((segment, index) => {
    const start = formatTime(segment.start, isSrt);
    const end = formatTime(segment.end, isSrt);
    
    if (isSrt) {
      output += `${index + 1}\n`;
    }
    output += `${start} --> ${end}\n`;
    output += `${segment.text.trim()}\n\n`;
  });

  return output.trim();
}
