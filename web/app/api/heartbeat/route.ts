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

  if (supabase) {
    try {
      const now = new Date().toISOString();
      await supabase.from("system_config").upsert(
        { device_id: deviceId, last_heartbeat_at: now, updated_at: now },
        { onConflict: "device_id" }
      );
      return NextResponse.json({ ok: true, server_time: now });
    } catch (e: any) {
      return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
    }
  }

  // Fallback: in-memory store.
  updateHeartbeat(deviceId, deviceIp);
  return NextResponse.json({ ok: true, server_time: new Date().toISOString(), note: "memory-store" });
}
