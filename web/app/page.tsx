'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceStatus {
  device_id: string;
  is_armed: boolean;
  is_muted: boolean;
  trigger_distance_cm: number;
  online: boolean;
  last_heartbeat: string | null;
}

export default function Dashboard() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState(false);
  const [commandMsg, setCommandMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status?device_id=esp32cam-01');
      const data = await res.json();
      if (data.ok) { setStatus(data); setApiError(false); }
    } catch {
      setApiError(true);
      if (!status) setStatus({ device_id: 'esp32cam-01', is_armed: true, is_muted: false, trigger_distance_cm: 50, online: false, last_heartbeat: null });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); const i = setInterval(fetchStatus, 8000); return () => clearInterval(i); }, [fetchStatus]);

  const sendCommand = async (t: string) => {
    setCommandMsg(null);
    try {
      const r = await fetch('/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: 'esp32cam-01', command_type: t, payload: {} }) });
      const d = await r.json();
      setCommandMsg(d.ok ? `ส่งคำสั่งแล้ว` : `ล้มเหลว: ${d.error}`);
      if (d.ok && t === 'arm') setStatus(s => s ? { ...s, is_armed: true } : null);
      if (d.ok && t === 'disarm') setStatus(s => s ? { ...s, is_armed: false } : null);
      if (d.ok && t === 'mute') setStatus(s => s ? { ...s, is_muted: true } : null);
      if (d.ok && t === 'unmute') setStatus(s => s ? { ...s, is_muted: false } : null);
    } catch { setCommandMsg('API ยังไม่พร้อม'); }
  };

  const ago = (iso: string | null) => { if (!iso) return null; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return `${s}วิ`; if (s < 3600) return `${Math.floor(s/60)}นาที`; return null; };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header bar */}
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">ระบบรักษาความปลอดภัย</h1>
          <p className="mt-1 text-sm text-zinc-500">ESP32-CAM · esp32cam-01</p>
        </div>
        <div className="flex items-center gap-3">
          {apiError && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">API ไม่ตอบสนอง</span>}
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status?.online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {status?.online ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </header>

      {/* Status grid */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="สถานะ" value={status?.is_armed ? '🔓 เปิด' : '🔒 ปิด'} accent={status?.is_armed ? 'emerald' : 'red'} />
        <Card label="แจ้งเตือน" value={status?.is_muted ? '🔇 ปิด' : '🔊 เปิด'} accent={status?.is_muted ? 'amber' : 'emerald'} />
        <Card label="ระยะตรวจจับ" value={`${status?.trigger_distance_cm ?? 50} ซม.`} />
        <Card label="ตอบสนองล่าสุด" value={status?.last_heartbeat ? (ago(status.last_heartbeat) ?? '—') : '—'} />
      </div>

      {/* Controls */}
      <div className="mb-10 flex flex-wrap gap-2">
        <Pill onClick={() => sendCommand('arm')} active={status?.is_armed} color="emerald">🔓 เปิดระบบ</Pill>
        <Pill onClick={() => sendCommand('disarm')} active={!status?.is_armed} color="red">🔒 ปิดระบบ</Pill>
        <Pill onClick={() => sendCommand('mute')} active={status?.is_muted} color="amber">🔇 ปิดเสียง</Pill>
        <Pill onClick={() => sendCommand('unmute')} active={!status?.is_muted} color="zinc">🔊 เปิดเสียง</Pill>
      </div>

      {commandMsg && <p className="-mt-8 mb-8 text-sm text-zinc-500 animate-in fade-in">{commandMsg}</p>}

      {/* Bottom nav */}
      <footer className="flex justify-center gap-6 text-sm text-zinc-400">
        <a href="/stream" className="hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">📷 ดูสด</a>
        <span>ESP32-CAM</span>
        <span>MicroPython</span>
        <span>Next.js</span>
      </footer>
    </div>
  );
}

function Card({ label, value, accent }: { label: string; value: string; accent?: string }) {
  const ac: Record<string, string> = { emerald: 'border-emerald-200 bg-emerald-50/50 dark:border-emerald-800 dark:bg-emerald-950/30', red: 'border-red-200 bg-red-50/50 dark:border-red-800 dark:bg-red-950/30', amber: 'border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-950/30' };
  return (
    <div className={`rounded-2xl border p-5 ${accent ? ac[accent] : 'border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'}`}>
      <p className="mb-1 text-xs font-medium uppercase tracking-wider text-zinc-400">{label}</p>
      <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{value}</p>
    </div>
  );
}

function Pill({ children, onClick, active, color }: { children: React.ReactNode; onClick: () => void; active?: boolean; color: string }) {
  const ac: Record<string, string> = { emerald: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950', red: 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950', amber: 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950', zinc: 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800' };
  const activeCls = active ? 'ring-2 ring-offset-1' : '';
  return <button onClick={onClick} className={`rounded-full border px-5 py-2 text-sm font-medium transition-all ${activeCls} ${ac[color] || ac.zinc}`}>{children}</button>;
}
