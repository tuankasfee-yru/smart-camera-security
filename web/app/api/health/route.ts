import { NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";

export async function GET() {
  const supabase = getAdmin();
  const dbOk = supabase !== null;

  return NextResponse.json({
    ok: true,
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: dbOk ? "connected" : "not configured",
    version: "1.0.0",
  });
}
