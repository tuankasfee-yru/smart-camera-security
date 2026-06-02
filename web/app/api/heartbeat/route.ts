import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";
import { updateHeartbeat } from "@/lib/memory-store";

export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  const body = await request.json().catch(() => ({}));
  const deviceId = body.device_id || "esp32cam-01";
  const deviceIp = body.device_ip || null;
  const now = new Date().toISOString();

  // Always update memory store (for extra fields like device_ip)
  updateHeartbeat(deviceId, deviceIp);

  if (supabase) {
    try {
      const payload: any = { device_id: deviceId, last_heartbeat_at: now, updated_at: now };
      if (deviceIp) payload.device_ip = deviceIp;
      await supabase.from("system_config").upsert(payload, { onConflict: "device_id" });
    } catch (e) {
      // Supabase failed, but memory store has it — continue
    }
  }

  return NextResponse.json({ ok: true, server_time: now, device_ip: deviceIp });
}
