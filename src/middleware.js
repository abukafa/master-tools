import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

// Cache in-memory sederhana untuk Rate Limiting di Edge Runtime
const rateLimitMap = new Map();
const RATE_LIMIT = 20; // 20 requests
const WINDOW_MS = 60 * 1000; // per 1 menit

const authMiddleware = withAuth(
  function middleware(req) {
    const res = NextResponse.next();
    const url = req.nextUrl;
    
    // === 1. SECURITY HEADERS ===
    res.headers.set("X-Frame-Options", "DENY");
    res.headers.set("X-Content-Type-Options", "nosniff");
    res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

    // === 2. RATE LIMITING UNTUK API ROUTE ===
    if (url.pathname.startsWith('/api/') && !url.pathname.startsWith('/api/auth')) {
      const ip = req.ip ?? req.headers.get("x-forwarded-for") ?? "127.0.0.1";
      const now = Date.now();
      
      // Mencegah memory leak ringan
      if (rateLimitMap.size > 10000) {
        rateLimitMap.clear();
      }

      let tokenData = rateLimitMap.get(ip);
      
      if (!tokenData || now - tokenData.timestamp > WINDOW_MS) {
        // Reset atau inisialisasi baru
        tokenData = { count: 1, timestamp: now };
      } else {
        tokenData.count++;
      }
      
      rateLimitMap.set(ip, tokenData);
      
      // Blokir jika melebihi batas
      if (tokenData.count > RATE_LIMIT) {
        return new NextResponse(
          JSON.stringify({ 
            error: "Terlalu banyak request. Anda telah dibatasi oleh sistem pelindung. Harap tunggu 1 menit." 
          }),
          {
            status: 429, // Too Many Requests
            headers: {
              "Content-Type": "application/json",
              "X-RateLimit-Limit": RATE_LIMIT.toString(),
              "X-RateLimit-Remaining": "0",
              "X-RateLimit-Reset": new Date(tokenData.timestamp + WINDOW_MS).toISOString()
            },
          }
        );
      }
      
      res.headers.set("X-RateLimit-Limit", RATE_LIMIT.toString());
      res.headers.set("X-RateLimit-Remaining", (RATE_LIMIT - tokenData.count).toString());
    }

    return res;
  },
  {
    callbacks: {
      authorized: ({ req, token }) => {
        const { pathname } = req.nextUrl;
        
        // API v1, Login, Static Assets, dan Webhooks diizinkan tanpa NextAuth
        // Namun /api/v2 (layanan AI berbayar) WAJIB menggunakan Token Sesi
        if (
          (pathname.startsWith('/api') && !pathname.startsWith('/api/v2')) || 
          pathname.startsWith('/api/webhooks') ||
          pathname.startsWith('/login') || 
          pathname.startsWith('/_next') ||
          pathname === '/favicon.ico'
        ) {
          return true; 
        }
        
        // Halaman Tools & Dashboard Wajib Login
        return !!token;
      },
    },
  }
);

export default function middleware(req, event) {
  return authMiddleware(req, event);
}

export const config = {
  // Eksekusi middleware pada SELURUH route (kecuali static murni _next)
  // Ini agar semua halaman mendapatkan perlindungan Security Headers
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
