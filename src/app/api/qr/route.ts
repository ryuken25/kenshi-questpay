import { NextRequest, NextResponse } from "next/server";
import { generateQrSvg } from "@/lib/qr";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const data = req.nextUrl.searchParams.get("data");
  if (!data) {
    return NextResponse.json({ error: "Missing 'data' parameter." }, { status: 400 });
  }
  try {
    const svg = await generateQrSvg(data);
    return new NextResponse(svg, {
      headers: {
        "content-type": "image/svg+xml",
        "cache-control": "public, max-age=86400, s-maxage=86400",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "QR generation failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
