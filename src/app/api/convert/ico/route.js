import { NextResponse } from "next/server";
import pngToIco from "png-to-ico";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const file = formData.get("file");

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Konversi PNG ke ICO
    const icoBuffer = await pngToIco(buffer);

    return new NextResponse(icoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "image/x-icon",
        "Content-Disposition": `attachment; filename="converted.ico"`,
      },
    });
  } catch (error) {
    console.error("ICO Conversion Error:", error);
    return NextResponse.json({ error: "Failed to convert to ICO" }, { status: 500 });
  }
}
