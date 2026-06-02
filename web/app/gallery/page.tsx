'use client';

import { useState, useEffect } from 'react';

interface GalleryItem {
  id: string; detected_at: string; distance_cm: number | null; image_filename: string | null;
}

export default function GalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/status?device_id=esp32cam-01')
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.events) setItems(d.events);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">🖼️ คลังภาพ</h1>
          <p className="text-sm text-zinc-500">ภาพที่บันทึกจากการตรวจจับ</p>
        </div>
        <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← กลับ</a>
      </div>

      {loading ? (
        <p className="text-center text-zinc-400 py-12">กำลังโหลด...</p>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white p-12 text-center dark:border-zinc-700 dark:bg-zinc-900">
          <p className="text-4xl mb-4">📸</p>
          <p className="text-zinc-500">ยังไม่มีภาพบันทึก</p>
          <p className="text-sm text-zinc-400 mt-1">ภาพจะปรากฏที่นี่เมื่อ ESP32-CAM ตรวจจับวัตถุ</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {items.map((item, i) => (
            <div key={item.id || i} className="rounded-2xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
              <div className="mb-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center h-40 text-6xl">
                📷
              </div>
              <p className="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {new Date(item.detected_at).toLocaleString('th-TH')}
              </p>
              <p className="text-xs text-zinc-400">
                {item.distance_cm != null ? `${item.distance_cm} ซม.` : '—'}
                {item.image_filename ? ` · ${item.image_filename}` : ''}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
