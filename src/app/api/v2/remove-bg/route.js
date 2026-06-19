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
    
    if (!file) {
      return NextResponse.json({ error: "Image file is required" }, { status: 400 });
    }

    // Cek Quota
    const quota = await checkAndConsumeQuota(token.uid, "remove-bg");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    // Forward ke Remove.bg API
    const removeBgFormData = new FormData();
    removeBgFormData.append("image_file", file);
    removeBgFormData.append("size", "auto");

    const apiKey = process.env.REMOVE_BG_API_KEY || "dummy_key";
    
    // SIMULASI LOKAL (jika tidak ada API Key asli)
    if (apiKey === "dummy_key") {
      // Mengembalikan file aslinya sebagai dummy jika API key tidak ada
      return new NextResponse(file, {
        headers: {
          "Content-Type": file.type,
          "X-Quota-Remaining": quota.remaining.toString(),
          "X-Simulated-Mode": "true"
        }
      });
    }

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": apiKey
      },
      body: removeBgFormData
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json({ error: "Remove.bg API failed", details: errorText }, { status: response.status });
    }

    const imageBlob = await response.blob();
    return new NextResponse(imageBlob, {
      headers: {
        "Content-Type": "image/png",
        "X-Quota-Remaining": quota.remaining.toString()
      }
    });

  } catch (error) {
    console.error("[Remove-BG Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
