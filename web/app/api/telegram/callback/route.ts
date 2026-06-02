import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  const supabase = getAdmin();
  if (!supabase) {
    return NextResponse.json({ ok: false, error: "Supabase not configured" }, { status: 500 });
  }

  try {
    const body = await request.json();
    const callback = body.callback_query ?? body;

    const data = callback.data;
    if (!data) {
      return NextResponse.json({ ok: false, error: "no callback data" }, { status: 400 });
    }

    const [device_id, command_type] = data.split(":", 2);
    if (!device_id || !command_type) {
      return NextResponse.json({ ok: false, error: "invalid callback format" }, { status: 400 });
    }

    const ALLOWED = ["arm", "disarm", "mute", "unmute", "delete_latest_file"];
    if (!ALLOWED.includes(command_type)) {
      return NextResponse.json({ ok: false, error: "invalid command" }, { status: 400 });
    }

    const { data: cmd, error } = await supabase
      .from("device_commands")
      .insert({
        device_id,
        command_type,
        payload: {},
        status: "pending",
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      command_id: cmd.id,
      message: "Command queued. ESP32-CAM will execute on next poll.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
