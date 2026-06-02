import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";
import { addEvent } from "@/lib/memory-store";

export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  const body = await request.json().catch(() => ({}));
  const { device_id, detected_at, distance_cm, image_filename } = body;

  if (!device_id || !detected_at) {
    return NextResponse.json({ ok: false, error: "device_id and detected_at required" }, { status: 400 });
  }

  if (supabase) {
    const { data, error } = await supabase.from("event_logs").insert({ device_id, detected_at, distance_cm: distance_cm ?? null, image_filename: image_filename ?? null }).select("id").single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, event_id: data.id });
  }

  const id = addEvent(device_id, { detected_at, distance_cm, image_filename });
  return NextResponse.json({ ok: true, event_id: id });
}
