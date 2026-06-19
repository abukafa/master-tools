import connectToDatabase from "./mongodb";
import User from "@/models/User";

export const TIER_LIMITS = {
  free: {
    "whisper": 20,      // 20x konversi video/audio ke text per hari
    "remove-bg": 30,    // 30x hapus background per hari
    "downloader": 50,   // 50x unduhan video sosmed per hari
    "voiceover": 20,    // 20x Text to Speech per hari
    "summarizer": 15,   // 15x Ringkas Dokumen per hari
    "converter": 30,    // 30x Convert/Compress Media per hari
  },
  premium: {
    "whisper": 1000,
    "remove-bg": 2000,
    "downloader": 5000,
    "voiceover": 1000,
    "summarizer": 1000,
    "converter": 2000,
  }
};

export async function checkAndConsumeQuota(uid, toolId) {
  try {
    await connectToDatabase();
    const today = new Date().toISOString().split("T")[0]; // Format: YYYY-MM-DD

    const user = await User.findOne({ uid });
    if (!user) {
      return { allowed: false, error: "User not found", status: 401 };
    }

    const limit = TIER_LIMITS[user.tier]?.[toolId] || 0;

    // Cari rekaman hari ini
    let dailyRecord = user.dailyUsage.find((d) => d.date === today);
    
    // Jika belum ada data untuk hari ini, buat baru
    if (!dailyRecord) {
      user.dailyUsage.push({ date: today, tools: [{ toolId, count: 0 }] });
      dailyRecord = user.dailyUsage[user.dailyUsage.length - 1];
    }

    // Cari rekaman penggunaan tool spesifik
    let toolUsage = dailyRecord.tools.find((t) => t.toolId === toolId);
    
    // Jika tool belum pernah digunakan hari ini
    if (!toolUsage) {
      dailyRecord.tools.push({ toolId, count: 0 });
      toolUsage = dailyRecord.tools[dailyRecord.tools.length - 1];
    }

    // Validasi Limit
    if (toolUsage.count >= limit) {
      return { 
        allowed: false, 
        error: `Batas harian Anda untuk alat ini (${limit}x) telah habis. Silakan tingkatkan ke Premium atau kembali besok.`,
        status: 403 
      };
    }

    // Atomic increment via Mongoose save()
    toolUsage.count += 1;
    await user.save();

    return { 
      allowed: true, 
      remaining: limit - toolUsage.count,
      limit: limit
    };
  } catch (error) {
    console.error("[Quota Check Error]:", error);
    return { allowed: false, error: "Internal Server Error", status: 500 };
  }
}
