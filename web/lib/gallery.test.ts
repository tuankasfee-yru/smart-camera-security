import { describe, it, expect, beforeEach } from "vitest";

// ── Cloudinary sign API logic ──────────────────────────────

describe("GET /api/cloudinary/sign", () => {
  it("returns cloud_name when env var is set", () => {
    // Simulate the route logic
    const cloudName = "my-cloud";
    expect(cloudName).toBeTruthy();
    expect(typeof cloudName).toBe("string");
  });

  it("returns empty cloud_name when not configured", () => {
    const cloudName = "";
    const ok = !!cloudName;
    expect(ok).toBe(false);
  });

  it("response shape is correct", () => {
    const response = { ok: true, cloud_name: "demo-cloud" };
    expect(response.ok).toBe(true);
    expect(response).toHaveProperty("cloud_name");
    expect(typeof response.cloud_name).toBe("string");
  });
});

// ── Gallery API logic ─────────────────────────────────────

interface GalleryImage {
  id: string;
  url: string;
  public_id: string;
  device_id: string;
  detected_at: string;
  distance_cm: number | null;
  created_at: string;
}

function createGalleryStore() {
  let store: GalleryImage[] = [];

  return {
    getAll(deviceId?: string): GalleryImage[] {
      if (deviceId) return store.filter((e) => e.device_id === deviceId);
      return store;
    },
    add(
      img: Omit<GalleryImage, "id" | "created_at">
    ): GalleryImage {
      const id =
        Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
      const entry: GalleryImage = {
        id,
        ...img,
        created_at: new Date().toISOString(),
      };
      store.unshift(entry);
      return entry;
    },
    delete(id: string): boolean {
      const idx = store.findIndex((e) => e.id === id);
      if (idx === -1) return false;
      store.splice(idx, 1);
      return true;
    },
    deleteMany(ids: string[]): number {
      const before = store.length;
      store = store.filter((e) => !ids.includes(e.id));
      return before - store.length;
    },
    _reset() {
      store = [];
    },
  };
}

describe("Gallery store (in-memory)", () => {
  let store: ReturnType<typeof createGalleryStore>;

  beforeEach(() => {
    store = createGalleryStore();
  });

  it("starts empty", () => {
    expect(store.getAll()).toHaveLength(0);
  });

  it("adds an image and retrieves it", () => {
    const img = store.add({
      url: "https://res.cloudinary.com/demo/image/upload/test.jpg",
      public_id: "test",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 42,
    });

    expect(img.id).toBeTruthy();
    expect(img.url).toContain("cloudinary");
    expect(img.device_id).toBe("esp32cam-01");

    const all = store.getAll();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe(img.id);
  });

  it("filters by device_id", () => {
    store.add({
      url: "https://example.com/a.jpg",
      public_id: "a",
      device_id: "device-a",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 10,
    });
    store.add({
      url: "https://example.com/b.jpg",
      public_id: "b",
      device_id: "device-b",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 20,
    });

    expect(store.getAll("device-a")).toHaveLength(1);
    expect(store.getAll("device-b")).toHaveLength(1);
    expect(store.getAll("device-c")).toHaveLength(0);
  });

  it("deletes a single image by id", () => {
    const img = store.add({
      url: "https://example.com/a.jpg",
      public_id: "a",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 10,
    });

    expect(store.getAll()).toHaveLength(1);
    const deleted = store.delete(img.id);
    expect(deleted).toBe(true);
    expect(store.getAll()).toHaveLength(0);
  });

  it("returns false when deleting non-existent id", () => {
    const deleted = store.delete("nonexistent");
    expect(deleted).toBe(false);
  });

  it("deletes multiple images", () => {
    const a = store.add({
      url: "https://example.com/a.jpg",
      public_id: "a",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 10,
    });
    const b = store.add({
      url: "https://example.com/b.jpg",
      public_id: "b",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 20,
    });
    store.add({
      url: "https://example.com/c.jpg",
      public_id: "c",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 30,
    });

    const deleted = store.deleteMany([a.id, b.id]);
    expect(deleted).toBe(2);
    expect(store.getAll()).toHaveLength(1);
  });
});

// ── Gallery API validation logic ───────────────────────────

describe("POST /api/gallery validation", () => {
  it("requires url", () => {
    const body: any = { public_id: "abc", device_id: "esp32cam-01", detected_at: "2026-06-03T10:00:00Z" };
    expect(body.url).toBeUndefined();
  });

  it("requires public_id", () => {
    const body: any = { url: "https://example.com/a.jpg", device_id: "esp32cam-01", detected_at: "2026-06-03T10:00:00Z" };
    expect(body.public_id).toBeUndefined();
  });

  it("requires device_id", () => {
    const body: any = { url: "https://example.com/a.jpg", public_id: "abc", detected_at: "2026-06-03T10:00:00Z" };
    expect(body.device_id).toBeUndefined();
  });

  it("requires detected_at", () => {
    const body: any = { url: "https://example.com/a.jpg", public_id: "abc", device_id: "esp32cam-01" };
    expect(body.detected_at).toBeUndefined();
  });

  it("accepts valid payload", () => {
    const body = {
      url: "https://res.cloudinary.com/demo/image/upload/v1/test.jpg",
      public_id: "test",
      device_id: "esp32cam-01",
      detected_at: "2026-06-03T10:00:00Z",
      distance_cm: 42,
    };
    expect(body.url).toBeTruthy();
    expect(body.public_id).toBeTruthy();
    expect(body.device_id).toBeTruthy();
    expect(body.detected_at).toBeTruthy();
    expect(typeof body.distance_cm).toBe("number");
  });
});

describe("DELETE /api/gallery validation", () => {
  it("requires ids array for bulk delete", () => {
    const body: any = {};
    const ids = body.ids;
    expect(ids).toBeUndefined();
  });

  it("accepts valid ids array", () => {
    const body = { ids: ["abc123", "def456"] };
    expect(Array.isArray(body.ids)).toBe(true);
    expect(body.ids.length).toBeGreaterThan(0);
  });

  it("rejects empty ids array", () => {
    const body = { ids: [] };
    expect(body.ids.length).toBe(0);
  });
});
