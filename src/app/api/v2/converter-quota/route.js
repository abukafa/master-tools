import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { checkAndConsumeQuota } from "@/lib/rate-limit-mongo";

export async function POST(req) {
  try {
    const token = await getToken({ req });
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cek Quota
    const quota = await checkAndConsumeQuota(token.uid, "converter");
    if (!quota.allowed) {
      return NextResponse.json({ error: quota.error }, { status: quota.status });
    }

    return NextResponse.json({ 
      success: true, 
      quota_remaining: quota.remaining 
    });

  } catch (error) {
    console.error("[Converter Quota Error]:", error);
    return NextResponse.json({ error: "Internal Server Error", details: error.message }, { status: 500 });
  }
}
