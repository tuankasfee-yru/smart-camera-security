import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";

const DEFAULT_DEVICE = "esp32cam-01";

function isOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  const t = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  return (now - t) < 2 * 60 * 1000; // 2 minutes
}

export async function GET(request: NextRequest) {
  const supabase = getAdmin();
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE;

  if (!supabase) {
    return NextResponse.json({
      ok: true,
      device_id: deviceId,
      is_armed: true,
      is_muted: false,
      trigger_distance_cm: 50,
      online: false,
      last_heartbeat: null,
    });
  }

  const { data, error } = await supabase
    .from("system_config")
    .select("*")
    .eq("device_id", deviceId)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    device_id: deviceId,
    is_armed: data?.is_armed ?? true,
    is_muted: data?.is_muted ?? false,
    trigger_distance_cm: data?.trigger_distance_cm ?? 50,
    online: isOnline(data?.last_heartbeat_at ?? null),
    last_heartbeat: data?.last_heartbeat_at ?? null,
  });
}

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
    const deviceId = body.device_id || DEFAULT_DEVICE;

    const { data, error } = await supabase
      .from("system_config")
      .upsert({
        device_id: deviceId,
        is_armed: body.is_armed ?? true,
        is_muted: body.is_muted ?? false,
        trigger_distance_cm: body.trigger_distance_cm ?? 50,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, config: data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
