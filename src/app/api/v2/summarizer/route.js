import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkAndConsumeQuota } from "@/lib/rate-limit-mongo";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { text, type = "summary" } = await req.json();

    if (!text || text.trim() === "") {
      return NextResponse.json({ error: "Text is required" }, { status: 400 });
    }

    // Cek Quota
    const quota = await checkAndConsumeQuota(token.uid, "summarizer");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "GROQ API Key is missing. Please configure it in .env.local" }, { status: 500 });
    }

    let systemPrompt = "Anda adalah asisten AI profesional. Tugas Anda adalah merangkum dokumen atau teks yang diberikan oleh pengguna. Buatlah ringkasan dalam format poin-poin (bullet points) yang sangat rapi, jelas, dan mudah dibaca.";
    
    if (type === "translate") {
      systemPrompt = "Anda adalah penerjemah profesional. Terjemahkan teks yang diberikan ke dalam Bahasa Indonesia yang formal dan mudah dipahami. Jangan meringkasnya, terjemahkan secara utuh namun dengan bahasa yang natural.";
    } else if (type === "key-points") {
      systemPrompt = "Ekstrak 3-5 poin utama yang paling penting dari teks berikut. Sajikan dalam kalimat pendek yang langsung pada intinya.";
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Model Llama-3.1 terbaru yang didukung
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: text }
        ],
        temperature: 0.5,
        max_tokens: 1500
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error?.message || "Groq API failed");
    }

    return NextResponse.json({ 
      success: true, 
      result: data.choices[0].message.content,
      quota_remaining: quota.remaining 
    });

  } catch (error) {
    console.error("[Summarizer Error]:", error);
    // Kirim pesan error asli ke frontend agar user tahu penyebab pastinya
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
