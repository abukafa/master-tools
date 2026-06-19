import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkAndConsumeQuota } from "@/lib/rate-limit-mongo";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { url } = await req.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Cek dan kurangi kuota di MongoDB
    const quota = await checkAndConsumeQuota(token.uid, "downloader");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    console.log("[Downloader] Extracting via youtube-dl-exec for URL:", url);
    const youtubedl = require('youtube-dl-exec');
    
    try {
      const output = await youtubedl(url, {
        dumpSingleJson: true,
        noCheckCertificates: true,
        noWarnings: true,
        preferFreeFormats: true,
        skipDownload: true
      });
      
      const result = {
        title: output.title,
        thumbnail: output.thumbnail,
        duration: output.duration,
        direct_url: output.url,
        ext: output.ext
      };

      return NextResponse.json({ 
        success: true, 
        data: result,
        quota_remaining: quota.remaining 
      });
    } catch (err) {
      console.error("[Downloader] youtube-dl-exec failed:", err.message || err);
      return NextResponse.json({ error: "Downloader failed", details: err.message }, { status: 500 });
    }

  } catch (error) {
    console.error("[Downloader Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
