import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";

export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const { device_id, detected_at, distance_cm, image_filename, video_filename } = body;

    if (!device_id || !detected_at) {
      return NextResponse.json({ ok: false, error: "device_id and detected_at required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("event_logs")
      .insert({
        device_id,
        detected_at,
        distance_cm: distance_cm ?? null,
        image_filename: image_filename ?? null,
        video_filename: video_filename ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, event_id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
