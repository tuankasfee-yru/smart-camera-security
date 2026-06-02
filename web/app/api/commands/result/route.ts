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
    const { command_id, device_id, success, message } = body;

    if (!command_id || !device_id) {
      return NextResponse.json({ ok: false, error: "command_id and device_id required" }, { status: 400 });
    }

    await supabase
      .from("device_commands")
      .update({
        status: success ? "done" : "failed",
        executed_at: new Date().toISOString(),
      })
      .eq("id", command_id);

    const { data, error } = await supabase
      .from("command_results")
      .insert({
        command_id,
        device_id,
        success: success ?? true,
        message: message ?? null,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, result_id: data.id });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
