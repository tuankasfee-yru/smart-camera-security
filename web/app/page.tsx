'use client';

import { useState, useEffect, useCallback } from 'react';

interface DeviceStatus {
  device_id: string; is_armed: boolean; is_muted: boolean;
  trigger_distance_cm: number; online: boolean;
  last_heartbeat: string | null; device_ip: string | null;
}

export default function Dashboard() {
  const [status, setStatus] = useState<DeviceStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [apiErr, setApiErr] = useState(false);
  const [msg, setMsg] = useState('');
  const [busyCmd, setBusyCmd] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      const r = await (await globalThis.fetch('/api/status?device_id=esp32cam-01')).json();
      if (r.ok) { setStatus(r); setApiErr(false); }
    } catch { setApiErr(true); }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); const i = setInterval(fetch, 5000); return () => clearInterval(i); }, [fetch]);

  const cmd = async (t: string) => {
    setBusyCmd(t);
    try {
      await globalThis.fetch('/api/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ device_id: 'esp32cam-01', is_armed: t === 'arm' ? true : t === 'disarm' ? false : undefined, is_muted: t === 'mute' ? true : t === 'unmute' ? false : undefined }),
      });
      const r = await (await globalThis.fetch('/api/commands', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ device_id: 'esp32cam-01', command_type: t, payload: {} }) })).json();
      setMsg(r.ok ? 'ส่งคำสั่งแล้ว' : r.error);
      if (r.ok) setStatus((s: any) => s ? { ...s, is_armed: t === 'arm' ? true : t === 'disarm' ? false : s.is_armed, is_muted: t === 'mute' ? true : t === 'unmute' ? false : s.is_muted, trigger_distance_cm: t === 'enable_sensor' ? 50 : t === 'disable_sensor' ? 999 : s.trigger_distance_cm } : null);
    } catch (e) { setMsg('error'); }
    setBusyCmd(null);
  };

  const ago = (iso: string | null) => { if (!iso) return null; const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000); if (s < 60) return `${s}วิ`; return `${Math.floor(s / 60)}นาที`; };

  const streamUrl = status?.device_ip ? `http://${status.device_ip}:8080` : null;

  const sensorEnabled = (status?.trigger_distance_cm ?? 50) < 999;
  const sensorLabel = sensorEnabled ? '📡 เปิดเซ็นเซอร์' : '🔕 ปิดเซ็นเซอร์';

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">ระบบรักษาความปลอดภัย</h1>
          <p className="text-sm text-zinc-500">ESP32-CAM · {status?.device_ip || '—'}</p>
        </div>
        <div className="flex items-center gap-3">
          {apiErr && <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700 dark:bg-red-950 dark:text-red-400">API ไม่ตอบ</span>}
          <span className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${status?.online ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            <span className={`inline-block h-2 w-2 rounded-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-400'}`} />
            {loading ? '...' : status?.online ? 'ออนไลน์' : status?.last_heartbeat ? 'ออฟไลน์' : 'รอ heartbeat...'}
          </span>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Card label="สถานะ" value={status?.is_armed ? '🔓 เปิด' : '🔒 ปิด'} accent={status?.is_armed ? 'emerald' : 'red'} />
        <Card label="แจ้งเตือน" value={status?.is_muted ? '🔇 ปิด' : '🔊 เปิด'} accent={status?.is_muted ? 'amber' : 'emerald'} />
        <Card label="ระยะตรวจจับ" value={`${status?.trigger_distance_cm ?? 50} ซม.`} />
        <Card label="ตอบสนอง" value={status?.last_heartbeat ? (ago(status.last_heartbeat) ?? '—') : '—'} />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        <Pill onClick={() => cmd('arm')} active={status?.is_armed} color="emerald" busy={busyCmd === 'arm'}>🔓 เปิด</Pill>
        <Pill onClick={() => cmd('disarm')} active={!status?.is_armed} color="red" busy={busyCmd === 'disarm'}>🔒 ปิด</Pill>
        <Pill onClick={() => cmd('mute')} active={status?.is_muted} color="amber" busy={busyCmd === 'mute'}>🔇 เสียง</Pill>
        <Pill onClick={() => cmd('unmute')} active={!status?.is_muted} color="zinc" busy={busyCmd === 'unmute'}>🔊 เสียง</Pill>
      </div>

      {/* Ultrasonic sensor toggle + Snapshot */}
      <div className="mb-4 flex flex-wrap gap-2">
        <Pill onClick={() => cmd('enable_sensor')} active={sensorEnabled} color="emerald" busy={busyCmd === 'enable_sensor'}>
          📡 เปิดเซ็นเซอร์
        </Pill>
        <Pill onClick={() => cmd('disable_sensor')} active={!sensorEnabled} color="amber" busy={busyCmd === 'disable_sensor'}>
          🔕 ปิดเซ็นเซอร์
        </Pill>
        <Pill onClick={() => cmd('capture_snapshot')} active={false} color="zinc" busy={busyCmd === 'capture_snapshot'}>
          📸 ถ่ายภาพ
        </Pill>
      </div>

      {msg && <p className="-mt-2 mb-8 text-sm text-zinc-500">{msg}</p>}

      <div className="mb-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {streamUrl && (
          <a href={`/stream?url=${encodeURIComponent(streamUrl)}`} className="col-span-2 rounded-2xl border border-blue-200 bg-blue-50/50 p-5 text-center transition-colors hover:bg-blue-100 dark:border-blue-800 dark:bg-blue-950/30 dark:hover:bg-blue-950">
            <p className="text-lg">📷</p>
            <p className="mt-1 text-sm font-medium text-blue-700 dark:text-blue-400">ดูภาพสด</p>
            <p className="text-xs text-blue-500">{streamUrl}</p>
          </a>
        )}
        <a href="/gallery" className="rounded-2xl border border-zinc-200 bg-white p-5 text-center transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800">
          <p className="text-lg">🖼️</p>
          <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">คลังภาพ</p>
          <p className="text-xs text-zinc-500">ดูภาพที่บันทึกไว้</p>
        </a>
      </div>

      <footer className="flex justify-center gap-6 text-xs text-zinc-400">
        <a href="/stream" className="hover:text-zinc-600 dark:hover:text-zinc-300">📷 สด</a>
        <a href="/gallery" className="hover:text-zinc-600 dark:hover:text-zinc-300">🖼️ คลัง</a>
        <span>ESP32-CAM</span>
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

function Pill({ children, onClick, active, color, busy }: { children: React.ReactNode; onClick: () => void; active?: boolean; color: string; busy?: boolean }) {
  const ac: Record<string, string> = { emerald: 'border-emerald-300 text-emerald-800 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950', red: 'border-red-300 text-red-700 hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-950', amber: 'border-amber-300 text-amber-700 hover:bg-amber-50 dark:border-amber-700 dark:text-amber-400 dark:hover:bg-amber-950', zinc: 'border-zinc-300 text-zinc-600 hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800' };
  return (
    <button
      onClick={onClick}
      disabled={busy}
      className={`rounded-full border px-5 py-2 text-sm font-medium transition-all disabled:opacity-50 ${active ? 'ring-2 ring-offset-1' : ''} ${ac[color] || ac.zinc}`}
    >
      {busy ? '⏳' : ''} {children}
    </button>
  );
}
