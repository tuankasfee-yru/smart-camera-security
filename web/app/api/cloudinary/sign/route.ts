import { NextResponse } from "next/server";

/**
 * GET /api/cloudinary/sign
 *
 * Returns the Cloudinary cloud_name for the frontend widget.
 * MVP: no signature generation — unsigned uploads use an upload preset.
 */
export async function GET() {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || "";

  if (!cloudName) {
    return NextResponse.json(
      { ok: false, error: "Cloudinary not configured", cloud_name: "" },
      { status: 200 }
    );
  }

  return NextResponse.json({ ok: true, cloud_name: cloudName });
}
