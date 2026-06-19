import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export async function POST(req) {
  try {
    const pdfParse = require("pdf-parse");
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Limit file size to 5MB to prevent memory crash
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: "Ukuran file terlalu besar. Maksimal 5MB untuk memastikan kestabilan AI." }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = "";

    if (file.type === "application/pdf" || file.name.endsWith(".pdf")) {
      const data = await pdfParse(buffer);
      extractedText = data.text;
    } else {
      return NextResponse.json({ error: "Format file tidak didukung oleh parser ini" }, { status: 400 });
    }

    // Hanya ambil 50,000 karakter pertama agar sesuai limit text-area
    if (extractedText.length > 50000) {
      extractedText = extractedText.substring(0, 50000);
    }

    return NextResponse.json({ 
      success: true, 
      text: extractedText 
    });

  } catch (error) {
    console.error("[Doc Parser Error]:", error);
    return NextResponse.json({ error: "Gagal mengekstrak teks dari dokumen", details: error.message }, { status: 500 });
  }
}
