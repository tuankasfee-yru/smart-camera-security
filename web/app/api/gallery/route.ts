import { NextRequest, NextResponse } from "next/server";
import { getAdmin } from "@/lib/supabase";
import { validateDeviceSecret } from "@/lib/auth";
import {
  getDevice,
  getGalleryImages,
  addGalleryImage,
  deleteGalleryImage,
  deleteGalleryImages,
  type GalleryImage,
} from "@/lib/memory-store";

const DEFAULT_DEVICE = "esp32cam-01";

function mergeGallery(memGallery: GalleryImage[], memEvents: any[]): any[] {
  const seen = new Set<string>(memGallery.map((g) => g.public_id));

  const eventImages = memEvents
    .filter((e) => e.image_filename && !seen.has(e.image_filename))
    .map((e) => ({
      id: e.id,
      url: e.image_filename.startsWith("http")
        ? e.image_filename
        : `/captures/${e.image_filename}`,
      public_id: e.image_filename,
      device_id: e.device_id,
      detected_at: e.detected_at,
      distance_cm: e.distance_cm,
      created_at: e.detected_at,
      source: "event",
    }));

  const cloudImages = memGallery.map((g) => ({ ...g, source: "cloudinary" }));

  return [...cloudImages, ...eventImages].sort(
    (a, b) =>
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
  );
}

/**
 * GET /api/gallery
 *
 * Returns gallery images merged from Cloudinary references and memory-store events.
 * Query params: device_id (default esp32cam-01)
 */
export async function GET(request: NextRequest) {
  const supabase = getAdmin();
  const { searchParams } = new URL(request.url);
  const deviceId = searchParams.get("device_id") || DEFAULT_DEVICE;

  const mem = getDevice(deviceId);
  const memGallery = getGalleryImages(deviceId);

  if (supabase) {
    let dbEvents: any[] | null = null;
    try {
      const { data } = await supabase
        .from("event_logs")
        .select("*")
        .eq("device_id", deviceId)
        .order("detected_at", { ascending: false })
        .limit(200);
      dbEvents = data;
    } catch {
      dbEvents = null;
    }

    const merged = dbEvents
      ? [
          ...memGallery.map((g) => ({ ...g, source: "cloudinary" })),
          ...(dbEvents
            .filter((e: any) => e.image_filename)
            .map((e: any) => ({
              id: e.id,
              url: e.image_filename?.startsWith("http")
                ? e.image_filename
                : `/captures/${e.image_filename}`,
              public_id: e.image_filename,
              device_id: e.device_id,
              detected_at: e.detected_at,
              distance_cm: e.distance_cm,
              created_at: e.detected_at,
              source: "event",
            })) || []),
        ].sort(
          (a: any, b: any) =>
            new Date(b.detected_at).getTime() -
            new Date(a.detected_at).getTime()
        )
      : mergeGallery(memGallery, mem.events);

    return NextResponse.json({ ok: true, images: merged });
  }

  const merged = mergeGallery(memGallery, mem.events);
  return NextResponse.json({ ok: true, images: merged });
}

/**
 * POST /api/gallery
 *
 * Saves a Cloudinary image reference. Requires device secret.
 */
export async function POST(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json().catch(() => ({}));
  const { url, public_id, device_id, detected_at, distance_cm } = body;

  if (!url || !public_id || !device_id) {
    return NextResponse.json(
      { ok: false, error: "url, public_id, and device_id required" },
      { status: 400 }
    );
  }

  if (!detected_at) {
    return NextResponse.json(
      { ok: false, error: "detected_at required" },
      { status: 400 }
    );
  }

  const supabase = getAdmin();

  if (supabase) {
    const { data, error } = await supabase
      .from("event_logs")
      .insert({
        device_id,
        detected_at,
        distance_cm: distance_cm ?? null,
        image_filename: url,
      })
      .select("id")
      .single();

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, image_id: data.id });
  }

  const img = addGalleryImage({
    url,
    public_id,
    device_id,
    detected_at,
    distance_cm: distance_cm ?? null,
  });

  return NextResponse.json({ ok: true, image_id: img.id });
}

/**
 * DELETE /api/gallery
 *
 * Deletes one or more images by id. Body: { ids: string[] }
 * Query param alternative: ?id=<single-id>
 */
export async function DELETE(request: NextRequest) {
  if (!validateDeviceSecret(request)) {
    return NextResponse.json(
      { ok: false, error: "unauthorized" },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const singleId = searchParams.get("id");

  if (singleId) {
    const ok = deleteGalleryImage(singleId);
    return NextResponse.json({ ok, deleted: ok ? 1 : 0 });
  }

  const body = await request.json().catch(() => ({}));
  const { ids } = body;

  if (!ids || !Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json(
      { ok: false, error: "ids array required" },
      { status: 400 }
    );
  }

  const deleted = deleteGalleryImages(ids);
  return NextResponse.json({ ok: true, deleted });
}
