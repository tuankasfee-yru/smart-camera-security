'use client';

import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function StreamContent() {
  const params = useSearchParams();
  const urlParam = params.get('url') || '';
  const [url, setUrl] = useState(urlParam);
  const [connected, setConnected] = useState(false);

  // Fetch device IP from status if no URL provided
  useEffect(() => {
    if (!urlParam) {
      fetch('/api/status?device_id=esp32cam-01')
        .then(r => r.json())
        .then(d => { if (d.ok && d.device_ip) setUrl(`http://${d.device_ip}:8080`); });
    }
  }, [urlParam]);

  const connect = (e: React.FormEvent) => {
    e.preventDefault();
    if (url) setConnected(true);
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">📷 ภาพสด</h1>
          <p className="text-sm text-zinc-500">ESP32-CAM Live Stream</p>
        </div>
        <a href="/" className="text-sm text-blue-600 hover:underline dark:text-blue-400">← กลับ</a>
      </div>

      {!connected ? (
        <form onSubmit={connect} className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
          <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">เชื่อมต่อ</h2>
          <p className="mb-4 text-sm text-zinc-500">ESP32: รัน <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">import test_stream</code> ใน Thonny</p>
          <div className="flex gap-2">
            <input type="text" value={url} onChange={e => setUrl(e.target.value)} placeholder="http://192.168.x.x:8080" className="flex-1 rounded-xl border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200" />
            <button type="submit" className="rounded-xl bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700">เชื่อมต่อ</button>
          </div>
        </form>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-black shadow-sm dark:border-zinc-700">
          <div className="flex items-center justify-between border-b border-zinc-700 px-4 py-2">
            <span className="flex items-center gap-2 text-xs text-zinc-400"><span className="inline-block h-2 w-2 rounded-full bg-red-500 animate-pulse" />LIVE</span>
            <button onClick={() => setConnected(false)} className="text-xs text-zinc-400 hover:text-white">ตัดการเชื่อมต่อ</button>
          </div>
          <img src={url + '/snapshot'} alt="Live" className="w-full max-h-[70vh] object-contain" onLoad={e => { const i = e.currentTarget; setTimeout(() => { i.src = url + '/snapshot?' + Date.now(); }, 500); }} onError={() => setConnected(false)} />
        </div>
      )}
    </div>
  );
}

export default function StreamPage() {
  return <Suspense fallback={<div className="p-8 text-center text-zinc-400">กำลังโหลด...</div>}><StreamContent /></Suspense>;
}
