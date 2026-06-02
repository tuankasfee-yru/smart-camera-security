import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";

const ALLOWED_COMMANDS = ["arm", "disarm", "mute", "unmute", "delete_latest_file", "cleanup_sd", "capture_snapshot"];

export async function GET(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const supabase = getAdmin();
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id");

  if (!deviceId) {
    return NextResponse.json({ ok: false, error: "device_id required" }, { status: 400 });
  }

  if (!supabase) {
    return NextResponse.json({ ok: true, commands: [] });
  }

  const { data, error } = await supabase
    .from("device_commands")
    .select("*")
    .eq("device_id", deviceId)
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(5);

  if (error) {
    return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true, commands: data });
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
    const { device_id, command_type, payload } = body;

    if (!device_id || !command_type) {
      return NextResponse.json({ ok: false, error: "device_id and command_type required" }, { status: 400 });
    }

    if (!ALLOWED_COMMANDS.includes(command_type)) {
      return NextResponse.json({ ok: false, error: `invalid command_type: ${command_type}` }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("device_commands")
      .insert({
        device_id,
        command_type,
        payload: payload ?? {},
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, command_id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
