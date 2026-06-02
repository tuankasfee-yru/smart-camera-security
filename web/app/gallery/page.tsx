"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";

interface GalleryImage {
  id: string;
  url: string;
  public_id: string;
  device_id: string;
  detected_at: string;
  distance_cm: number | null;
  created_at: string;
  source?: string;
}

function GalleryContent() {
  const searchParams = useSearchParams();
  const deviceId = searchParams.get("device_id") || "esp32cam-01";

  const [images, setImages] = useState<GalleryImage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [msg, setMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchImages = useCallback(async () => {
    setLoading(true);
    try {
      const r = await (
        await fetch(`/api/gallery?device_id=${encodeURIComponent(deviceId)}`)
      ).json();
      if (r.ok) setImages(r.images);
    } catch {
      setImages([]);
    }
    setLoading(false);
  }, [deviceId]);

  useEffect(() => {
    fetchImages();
  }, [fetchImages]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === images.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(images.map((img) => img.id)));
    }
  };

  const deleteSelected = async () => {
    if (selected.size === 0) return;
    setDeleting(true);
    setMsg("");
    try {
      const r = await (
        await fetch("/api/gallery", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: [...selected] }),
        })
      ).json();
      if (r.ok) {
        setMsg(`ลบแล้ว ${r.deleted} รายการ`);
        setSelected(new Set());
        fetchImages();
      } else {
        setMsg(r.error || "ลบไม่สำเร็จ");
      }
    } catch {
      setMsg("เกิดข้อผิดพลาด");
    }
    setDeleting(false);
  };

  const deleteSingle = async (id: string) => {
    setDeleting(true);
    setMsg("");
    try {
      const r = await (
        await fetch(`/api/gallery?id=${encodeURIComponent(id)}`, {
          method: "DELETE",
        })
      ).json();
      if (r.ok) {
        setMsg("ลบแล้ว");
        setImages((prev) => prev.filter((img) => img.id !== id));
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      } else {
        setMsg("ลบไม่สำเร็จ");
      }
    } catch {
      setMsg("เกิดข้อผิดพลาด");
    }
    setDeleting(false);
  };

  const shareImage = async (img: GalleryImage) => {
    try {
      await navigator.clipboard.writeText(img.url);
      setMsg("คัดลอกลิงก์แล้ว");
    } catch {
      setMsg("ไม่สามารถคัดลอกได้");
    }
    setTimeout(() => setMsg(""), 2000);
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            🖼️ คลังภาพ
          </h1>
          <p className="text-sm text-zinc-500">
            ภาพที่บันทึกจากการตรวจจับ · {deviceId}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <button
              onClick={deleteSelected}
              disabled={deleting}
              className="rounded-full border border-red-300 bg-red-50 px-4 py-1.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950"
            >
              {deleting ? "กำลังลบ..." : `ลบ (${selected.size})`}
            </button>
          )}
          {images.length > 0 && (
            <button
              onClick={toggleAll}
              className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              {selected.size === images.length ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
            </button>
          )}
          <a
            href="/"
            className="rounded-full border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            ← กลับ
          </a>
        </div>
      </div>

      {/* Feedback message */}
      {msg && (
        <p className="mb-4 text-sm text-zinc-500 rounded-xl border border-zinc-200 bg-white px-4 py-2 dark:border-zinc-700 dark:bg-zinc-900">
          {msg}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600 dark:border-zinc-600 dark:border-t-zinc-300" />
            <p className="text-sm text-zinc-400">กำลังโหลด...</p>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && images.length === 0 && (
        <div className="rounded-2xl border border-zinc-200 bg-white p-16 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="mb-3 text-5xl">📸</p>
          <p className="text-lg font-medium text-zinc-600 dark:text-zinc-300">
            ยังไม่มีภาพ
          </p>
          <p className="mt-1 text-sm text-zinc-400">
            ภาพจะปรากฏที่นี่เมื่อ ESP32-CAM ตรวจจับวัตถุและอัปโหลดภาพ
          </p>
        </div>
      )}

      {/* Image grid */}
      {!loading && images.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {images.map((img) => {
            const isSelected = selected.has(img.id);
            return (
              <div
                key={img.id}
                className={`group relative rounded-2xl border bg-white shadow-sm transition-all dark:bg-zinc-900 ${
                  isSelected
                    ? "border-blue-400 ring-2 ring-blue-400/30 dark:border-blue-500 dark:ring-blue-500/30"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
              >
                {/* Image thumbnail */}
                <div className="relative aspect-square overflow-hidden rounded-t-2xl bg-zinc-100 dark:bg-zinc-800">
                  <img
                    src={img.url}
                    alt={`ภาพ ${formatDate(img.detected_at)}`}
                    className="h-full w-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const parent = (e.target as HTMLImageElement).parentElement;
                      if (parent) {
                        parent.innerHTML =
                          '<div class="flex h-full w-full items-center justify-center text-4xl">📷</div>';
                      }
                    }}
                  />

                  {/* Hover overlay with actions */}
                  <div className="absolute inset-0 flex items-end justify-end gap-1 p-2 opacity-0 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => shareImage(img)}
                      className="rounded-full bg-black/60 p-2 text-white/90 transition-colors hover:bg-black/80"
                      title="คัดลอกลิงก์"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3.002 3.002 0 110-2.684m0 2.684l3.632 3.632m-3.632-6.316l3.632 3.632M12 15V9m0 0l3 3m-3-3L9 9"
                        />
                      </svg>
                    </button>
                  </div>

                  {/* Selection checkbox */}
                  <label className="absolute left-2 top-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelect(img.id)}
                      className="peer sr-only"
                    />
                    <div
                      className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors ${
                        isSelected
                          ? "border-blue-500 bg-blue-500"
                          : "border-white/70 bg-black/30"
                      }`}
                    >
                      {isSelected && (
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-3 w-3 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={3}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>

                {/* Info footer */}
                <div className="p-2.5">
                  <p className="text-xs font-medium text-zinc-700 dark:text-zinc-200">
                    {formatDate(img.detected_at)}
                  </p>
                  <div className="mt-0.5 flex items-center justify-between">
                    <p className="text-xs text-zinc-400">
                      {img.distance_cm != null
                        ? `${img.distance_cm} ซม.`
                        : "—"}
                    </p>
                    <button
                      onClick={() => deleteSingle(img.id)}
                      disabled={deleting}
                      className="rounded-full p-1 text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 disabled:opacity-50 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                      title="ลบ"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-3.5 w-3.5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                  {img.source === "cloudinary" && (
                    <p className="mt-0.5 text-[10px] text-blue-400/70">
                      ☁ Cloudinary
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function GalleryPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20">
          <p className="text-sm text-zinc-400">กำลังโหลด...</p>
        </div>
      }
    >
      <GalleryContent />
    </Suspense>
  );
}
