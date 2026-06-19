import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkAndConsumeQuota } from "@/lib/rate-limit-mongo";
import * as googleTTS from "google-tts-api";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { text, language = "id", speed = "normal" } = body;

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Cek Quota
    const quota = await checkAndConsumeQuota(token.uid, "voiceover");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    // Menggunakan google-tts-api (Gratis)
    // getAllAudioBase64 otomatis memotong teks panjang (>200 karakter)
    const results = await googleTTS.getAllAudioBase64(text.trim(), {
      lang: language,
      slow: speed === "slow",
      host: 'https://translate.google.com',
      splitPunct: ',.?'
    });

    // Karena text panjang dipecah jadi beberapa bagian, kita gabungkan base64-nya
    // Tapi base64 audio mp3 tidak bisa digabung begitu saja. 
    // Oleh karena itu, kita kembalikan array dari base64, lalu biarkan frontend memutarnya secara berurutan,
    // ATAU kita konversi ke binary buffer lalu gabungkan.
    
    // Gabungkan binary buffer dari semua potongan base64
    const buffers = results.map(result => Buffer.from(result.base64, 'base64'));
    const finalBuffer = Buffer.concat(buffers);

    const base64Audio = finalBuffer.toString('base64');
    const dataUrl = `data:audio/mp3;base64,${base64Audio}`;

    return NextResponse.json({ 
      success: true,
      audio_url: dataUrl,
      quota_remaining: quota.remaining 
    });

  } catch (error) {
    console.error("[Voiceover Error]:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
