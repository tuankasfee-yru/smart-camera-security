import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { getDevice, updateConfig } from "@/lib/memory-store";

const DEFAULT_DEVICE = "esp32cam-01";

function isOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  return (Date.now() - new Date(lastHeartbeat).getTime()) < 2 * 60 * 1000;
}

function buildResponse(deviceId: string, data: any, mem: any) {
  // Merge memory store (has device_ip, free_mem, events) with DB data
  return {
    ok: true,
    device_id: deviceId,
    is_armed: data?.is_armed ?? mem?.is_armed ?? true,
    is_muted: data?.is_muted ?? mem?.is_muted ?? false,
    trigger_distance_cm: data?.trigger_distance_cm ?? mem?.trigger_distance_cm ?? 50,
    online: isOnline(data?.last_heartbeat_at ?? mem?.last_heartbeat ?? null),
    last_heartbeat: data?.last_heartbeat_at ?? mem?.last_heartbeat ?? null,
    device_ip: data?.device_ip ?? mem?.device_ip ?? null,
    free_mem: mem?.free_mem ?? 0,
    events: mem?.events ?? [],
  };
}

export async function GET(request: NextRequest) {
  const supabase = getAdmin();
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE;
  const mem = getDevice(deviceId);

  if (supabase) {
    const { data } = await supabase
      .from("system_config").select("*").eq("device_id", deviceId).maybeSingle();
    return NextResponse.json(buildResponse(deviceId, data, mem));
  }

  return NextResponse.json(buildResponse(deviceId, null, mem));
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const deviceId = body.device_id || DEFAULT_DEVICE;
  const supabase = getAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("system_config")
      .upsert({ device_id: deviceId, is_armed: body.is_armed ?? true, is_muted: body.is_muted ?? false, trigger_distance_cm: body.trigger_distance_cm ?? 50, updated_at: new Date().toISOString() })
      .select().single();
    if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    updateConfig(deviceId, { is_armed: body.is_armed, is_muted: body.is_muted, trigger_distance_cm: body.trigger_distance_cm });
    return NextResponse.json({ ok: true, config: data });
  }

  updateConfig(deviceId, { is_armed: body.is_armed, is_muted: body.is_muted, trigger_distance_cm: body.trigger_distance_cm });
  return NextResponse.json({ ok: true, config: getDevice(deviceId) });
}
