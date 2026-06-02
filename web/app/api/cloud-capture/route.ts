import { NextRequest, NextResponse } from "next/server";
import { validateDeviceSecret } from "@/lib/auth";
import { addEvent } from "@/lib/memory-store";
import { getAdmin } from "@/lib/supabase";

interface CloudCapture {
  id: string; device_id: string; detected_at: string;
  distance_cm: number | null; filename: string;
  cloudinary_url: string; created_at: string;
}

const store: CloudCapture[] = [];

export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { device_id, detected_at, distance_cm, filename, cloudinary_url } = body;

    if (!cloudinary_url) {
      return NextResponse.json({ ok: false, error: "cloudinary_url required" }, { status: 400 });
    }

    const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
    store.unshift({
      id, device_id: device_id || "esp32cam-01",
      detected_at: detected_at || new Date().toISOString(),
      distance_cm: distance_cm ?? null,
      filename: filename || "capture.jpg",
      cloudinary_url, created_at: new Date().toISOString(),
    });

    // Also log to memory store + Supabase
    addEvent(device_id || "esp32cam-01", {
      detected_at: detected_at || new Date().toISOString(),
      distance_cm: distance_cm ?? null,
      image_filename: filename,
    });

    const supabase = getAdmin();
    if (supabase) {
      try {
        await supabase.from("event_logs").insert({
          device_id: device_id || "esp32cam-01",
          detected_at: detected_at || new Date().toISOString(),
          distance_cm: distance_cm ?? null,
          image_filename: filename,
        });
      } catch {}
    }

    return NextResponse.json({ ok: true, id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ ok: true, images: store });
}
