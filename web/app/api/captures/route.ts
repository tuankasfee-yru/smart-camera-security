import { NextRequest, NextResponse } from "next/server";
import { validateDeviceSecret } from "@/lib/auth";
import { saveImage, getImages } from "@/lib/image-store";
import { addEvent } from "@/lib/memory-store";
import { getAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const jpeg = Buffer.from(await request.arrayBuffer());
    const deviceId = request.headers.get("x-device-id") || "esp32cam-01";
    const detectedAt = request.headers.get("x-detected-at") || new Date().toISOString();
    const distance = request.headers.get("x-distance-cm");
    const filename = request.headers.get("x-filename") || "capture.jpg";

    const { id } = saveImage({
      device_id: deviceId,
      detected_at: detectedAt,
      distance_cm: distance ? parseFloat(distance) : null,
      filename,
      jpeg,
    });

    // Also log to memory store / Supabase
    addEvent(deviceId, { detected_at: detectedAt, distance_cm: distance ? parseFloat(distance) : null, image_filename: filename });
    const supabase = getAdmin();
    if (supabase) {
      try {
        await supabase.from("event_logs").insert({
          device_id: deviceId, detected_at: detectedAt,
          distance_cm: distance ? parseFloat(distance) : null,
          image_filename: filename,
        });
      } catch {}
    }

    return NextResponse.json({ ok: true, id, filename, size: jpeg.length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  const imgs = getImages();
  return NextResponse.json({
    ok: true,
    images: imgs.map(({ jpeg, ...rest }) => ({ ...rest, url: `/api/captures/view/${rest.id}` })),
  });
}
