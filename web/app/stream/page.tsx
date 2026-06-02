'use client';

import { useState } from 'react';

export default function StreamPage() {
  const [url, setUrl] = useState('');
  const [connected, setConnected] = useState(false);

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    setConnected(!!url);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">📷 Live Stream</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">ESP32-CAM ภาพสด</p>
        </div>
        <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← กลับ Dashboard</a>
      </div>

      {!connected ? (
        <form onSubmit={connect} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">เชื่อมต่อกล้อง</h2>
          <p className="mb-4 text-sm text-zinc-500">ใส่ URL ของ ESP32-CAM stream server:</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="http://192.168.x.x:8080"
              className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200"
            />
            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">เชื่อมต่อ</button>
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            วิธีตั้งค่า: ESP32 → run <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">import test_stream</code> → เปิด browser ที่ URL นี้
          </p>
        </form>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-700">
          <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
            <span className="flex items-center gap-2 text-xs text-zinc-400">
              <span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />
              LIVE
            </span>
            <button onClick={() => setConnected(false)} className="text-xs text-zinc-400 hover:text-white">ตัดการเชื่อมต่อ</button>
          </div>
          <div className="flex items-center justify-center">
            <img
              src={url + '/snapshot'}
              alt="ESP32-CAM Live"
              className="max-h-[70vh] w-full object-contain"
              onLoad={(e) => {
                const img = e.currentTarget;
                setTimeout(() => { img.src = url + '/snapshot?' + Date.now(); }, 500);
              }}
            />
          </div>
        </div>
      )}

      <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">วิธีตั้งค่า Remote Stream</h2>
        <ol className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>1. ESP32: รัน <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">import test_stream</code> ใน Thonny REPL</li>
          <li>2. เปิด browser → ใส่ URL <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">http://ESP_IP:8080/</code></li>
          <li>3. สำหรับดูนอกบ้าน: ติดตั้ง ngrok บน PC → <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">ngrok http http://ESP_IP:8080</code></li>
          <li>4. ใช้ ngrok URL แทน (รองรับ HTTPS)</li>
        </ol>
      </div>
    </div>
  );
}
