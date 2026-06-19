import { NextResponse } from "next/server";
import crypto from "crypto";
import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";

export async function POST(req) {
  try {
    const body = await req.json();
    const { 
      order_id, 
      status_code, 
      gross_amount, 
      signature_key, 
      transaction_status 
    } = body;

    const serverKey = process.env.MIDTRANS_SERVER_KEY || "dummy_server_key";

    // 1. Validasi Signature Key dari Midtrans
    // Rumus: SHA512(order_id + status_code + gross_amount + ServerKey)
    const rawString = `${order_id}${status_code}${gross_amount}${serverKey}`;
    const generatedSignature = crypto.createHash('sha512').update(rawString).digest('hex');

    if (signature_key !== generatedSignature && serverKey !== "dummy_server_key") {
      console.warn("Invalid Midtrans Signature", { generatedSignature, signature_key });
      return NextResponse.json({ error: "Invalid Signature" }, { status: 403 });
    }

    // 2. Periksa status transaksi
    // Status sukses bisa berupa "settlement" atau "capture"
    if (transaction_status === 'settlement' || transaction_status === 'capture') {
      
      // order_id diasumsikan berformat: premium_uid_123456789
      // Kita ekstrak UID pengguna
      const parts = order_id.split('_');
      if (parts[0] !== 'premium' || !parts[1]) {
        return NextResponse.json({ error: "Invalid Order ID Format" }, { status: 400 });
      }

      const uid = parts[1];

      await connectToDatabase();
      const user = await User.findOneAndUpdate(
        { uid },
        { tier: "premium" },
        { new: true }
      );

      if (!user) {
        console.error("User not found for Webhook UID:", uid);
        return NextResponse.json({ error: "User Not Found" }, { status: 404 });
      }

      return NextResponse.json({ success: true, message: "User upgraded to premium" });
    }

    // Jika pending / failed
    return NextResponse.json({ success: true, message: `Status is ${transaction_status}, no action taken.` });

  } catch (error) {
    console.error("[Midtrans Webhook Error]:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
