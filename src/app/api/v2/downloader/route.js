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

    const engine = process.env.DOWNLOADER_ENGINE || "ytdl"; // Default to ytdl
    let result = null;

    try {
      if (engine === "rapidapi") {
        console.log("[Downloader] Extracting via RapidAPI (or Node fallback) for URL:", url);
        
        // --- RAPID API UNTUK SEMUA PLATFORM ---
        const apiKey = process.env.RAPIDAPI_KEY;
        if (!apiKey) {
          throw new Error("RAPIDAPI_KEY is not configured in environment variables.");
        }

        let apiUrl = "";
        let params = new URLSearchParams();

        if (url.includes("youtube.com") || url.includes("youtu.be")) {
          apiUrl = "https://social-media-video-downloader.p.rapidapi.com/youtube/v3/video/details";
          params.append("urlAccess", "normal");
          params.append("renderableFormats", "720p,highres");
          params.append("getTranscript", "false");
          
          const ytMatch = url.match(/(?:v=|shorts\/|youtu\.be\/|embed\/)([\w-]{11})/i);
          if (ytMatch && ytMatch[1]) {
            params.append("videoId", ytMatch[1]);
          } else {
            throw new Error("Invalid YouTube URL. Could not extract videoId.");
          }
        } else if (url.includes("tiktok.com")) {
          apiUrl = "https://social-media-video-downloader.p.rapidapi.com/tiktok/v3/post/details";
          params.append("url", url);
        } else if (url.includes("instagram.com")) {
          apiUrl = "https://social-media-video-downloader.p.rapidapi.com/instagram/v3/media/post/details";
          params.append("renderableFormats", "720p,highres");
          const igMatch = url.match(/instagram\.com\/(?:p|reel|tv)\/([^/?#&]+)/);
          if (igMatch && igMatch[1]) {
            params.append("shortcode", igMatch[1]);
          } else {
            throw new Error("Invalid Instagram URL. Could not extract shortcode.");
          }
        } else if (url.includes("facebook.com") || url.includes("fb.watch")) {
          apiUrl = "https://social-media-video-downloader.p.rapidapi.com/facebook/v3/post/details";
          params.append("renderableFormats", "720p,highres");
          params.append("url", url);
        } else {
          // Fallback generic endpoint
          apiUrl = "https://social-media-video-downloader.p.rapidapi.com/smvd/get/all";
          params.append("url", url);
        }

          const response = await fetch(`${apiUrl}?${params.toString()}`, {
            method: 'GET',
            headers: {
              'x-rapidapi-key': apiKey,
              'x-rapidapi-host': 'social-media-video-downloader.p.rapidapi.com',
              'Content-Type': 'application/json'
            }
          });

          if (!response.ok) {
            throw new Error(`RapidAPI responded with status: ${response.status} (Endpoint: ${apiUrl})`);
          }

          const rawData = await response.json();
          if (rawData.error) {
            throw new Error(rawData.error.message || "RapidAPI returned an error");
          }
          
          // Parsing response secara generik karena struktur tiap platform bisa beda
          let direct_url = null;
          let title = rawData.title || rawData.caption || rawData.description || "Video Download";
          let thumbnail = rawData.thumbnail || rawData.coverUrl || rawData.displayUrl || null;
          
          // 1. Cek struktur khusus TikTok dari emmanueldavidyou
          if (rawData.contents && rawData.contents[0]?.videos && rawData.contents[0].videos.length > 0) {
            // Ambil kualitas tertinggi atau video pertama
            const videoObj = rawData.contents[0].videos[0];
            direct_url = videoObj.url || videoObj.videoUrl || videoObj.link || null;
          }
          
          // 2. Jika belum ketemu, cek berbagai variasi key lainnya
          if (!direct_url) {
            if (rawData.videoUrl) {
              direct_url = rawData.videoUrl;
            } else if (rawData.downloadUrl) {
              direct_url = rawData.downloadUrl;
            } else if (rawData.data?.video_url) {
              direct_url = rawData.data.video_url;
            } else if (rawData.data?.play) {
              direct_url = rawData.data.play;
            }
          }

          // 3. Jika belum ketemu juga, gunakan regex brutal untuk mencari link mp4 (Berguna untuk IG/FB)
          if (!direct_url) {
            const jsonString = JSON.stringify(rawData);
            // Mencari .mp4 ATAU link dari googlevideo.com (YouTube)
            const videoUrlMatches = jsonString.match(/"(https?:\/\/[^"]+(?:\.mp4|googlevideo\.com\/videoplayback)[^"]*)"/i);
            if (videoUrlMatches && videoUrlMatches[1]) {
              direct_url = videoUrlMatches[1];
            } else {
              // Jika semua gagal, kirim pesan error dengan cuplikan data untuk debugging
              throw new Error("Tidak dapat menemukan link video dari respon API: " + jsonString.substring(0, 150));
            }
          }

          result = {
            title,
            thumbnail,
            duration: null,
            direct_url,
            ext: "mp4"
          };
      } else {
        console.log("[Downloader] Extracting via youtube-dl-exec for URL:", url);
        const youtubedl = require('youtube-dl-exec');
        const output = await youtubedl(url, {
          dumpSingleJson: true,
          noCheckCertificates: true,
          noWarnings: true,
          preferFreeFormats: true,
          skipDownload: true
        });
        
        result = {
          title: output.title,
          thumbnail: output.thumbnail,
          duration: output.duration,
          direct_url: output.url,
          ext: output.ext
        };
      }

      return NextResponse.json({ 
        success: true, 
        data: result,
        quota_remaining: quota.remaining 
      });
    } catch (err) {
      console.error(`[Downloader] Engine '${engine}' failed:`, err.message || err);
      return NextResponse.json({ error: "Downloader failed", details: err.message }, { status: 500 });
    }

  } catch (error) {
    console.error("[Downloader Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
