import { NextResponse } from "next/server";
import { parseHTML } from "linkedom";
import { Readability } from "@mozilla/readability";
import TurndownService from "turndown";
import { convert } from "html-to-text";

export async function POST(req) {
  try {
    const { url, format = "plain" } = await req.json();

    if (!url) {
      return NextResponse.json({ error: "Missing URL parameter" }, { status: 400 });
    }

    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Gagal mengakses URL: ${response.statusText}` }, { status: response.status });
    }

    const html = await response.text();
    const { document } = parseHTML(html);
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json({ error: "Gagal mengekstrak artikel dari URL ini" }, { status: 500 });
    }

    let finalContent = "";

    if (format === "markdown") {
      const turndownService = new TurndownService({
        headingStyle: "atx",
        codeBlockStyle: "fenced"
      });
      finalContent = turndownService.turndown(article.content);
    } else {
      // Plain text yang diformat dengan baik tanpa simbol markdown
      finalContent = convert(article.content, {
        wordwrap: false, // jangan potong baris berdasarkan karakter
        preserveNewlines: true,
        selectors: [
          { selector: 'a', options: { ignoreHref: true } }, // Jangan tampilkan URL link
          { selector: 'img', format: 'skip' }, // Abaikan gambar
        ]
      });
    }

    return NextResponse.json({
      title: article.title,
      content: finalContent,
      length: article.length,
      excerpt: article.excerpt,
    });

  } catch (error) {
    console.error("Web Extraction Error:", error);
    return NextResponse.json({ error: "Terjadi kesalahan internal saat mengekstrak halaman" }, { status: 500 });
  }
}
