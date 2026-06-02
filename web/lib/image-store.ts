// In-memory image store — stores JPEG bytes with metadata
// Production would use Cloudinary or Supabase Storage

interface StoredImage {
  id: string;
  jpeg: Uint8Array;
  device_id: string;
  detected_at: string;
  distance_cm: number | null;
  filename: string;
  size: number;
}

const images: Record<string, StoredImage> = {};

export function saveImage(data: {
  device_id: string;
  detected_at: string;
  distance_cm: number | null;
  filename: string;
  jpeg: Buffer;
}): { id: string } {
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  images[id] = { ...data, id, size: data.jpeg.length, jpeg: new Uint8Array(data.jpeg) };
  return { id };
}

export function getImage(id: string): StoredImage | null {
  return images[id] || null;
}

export function getImages(): StoredImage[] {
  return Object.values(images).sort((a, b) => b.detected_at.localeCompare(a.detected_at));
}

export function deleteImage(id: string): boolean {
  if (images[id]) { delete images[id]; return true; }
  return false;
}

export function deleteImages(ids: string[]): number {
  let n = 0;
  for (const id of ids) { if (deleteImage(id)) n++; }
  return n;
}
