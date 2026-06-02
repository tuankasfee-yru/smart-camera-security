import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/image-store";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const img = getImage(id);
  if (!img) return NextResponse.json({ ok: false }, { status: 404 });
  return new NextResponse(img.jpeg, {
    headers: { "Content-Type": "image/jpeg", "Cache-Control": "public, max-age=3600" },
  });
}
