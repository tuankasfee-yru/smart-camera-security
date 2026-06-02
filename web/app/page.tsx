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
  const [commandMsg, setCommandMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status?device_id=esp32cam-01');
      const data = await res.json();
      if (data.ok) setStatus(data);
    } catch {
      setStatus({ device_id: 'esp32cam-01', is_armed: true, is_muted: false, trigger_distance_cm: 50, online: false, last_heartbeat: null });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000);
    return () => clearInterval(interval);
  }, [fetchStatus]);

  const sendCommand = async (command_type: string) => {
    setCommandMsg(null);
    try {
      const res = await fetch('/api/commands', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-Device-Secret': 'placeholder' },
        body: JSON.stringify({ device_id: 'esp32cam-01', command_type, payload: {} }),
      });
      const data = await res.json();
      if (data.ok) {
        const labels: Record<string, string> = { arm: 'เปิด', disarm: 'ปิด', mute: 'เงียบ', unmute: 'เลิกเงียบ' };
        setCommandMsg(`ส่งคำสั่ง "${labels[command_type] || command_type}" แล้ว`);
        if (command_type === 'arm') setStatus((s) => s ? { ...s, is_armed: true } : null);
        if (command_type === 'disarm') setStatus((s) => s ? { ...s, is_armed: false } : null);
        if (command_type === 'mute') setStatus((s) => s ? { ...s, is_muted: true } : null);
        if (command_type === 'unmute') setStatus((s) => s ? { ...s, is_muted: false } : null);
      } else {
        setCommandMsg(`ล้มเหลว: ${data.error}`);
      }
    } catch {
      setCommandMsg('API ยังไม่พร้อมใช้งาน');
    }
  };

  const formatHeartbeat = (iso: string | null) => {
    if (!iso) return '—';
    const d = new Date(iso);
    const now = Date.now();
    const diff = Math.floor((now - d.getTime()) / 1000);
    if (diff < 60) return `${diff} วินาทีที่แล้ว`;
    if (diff < 3600) return `${Math.floor(diff / 60)} นาทีที่แล้ว`;
    return d.toLocaleString('th-TH');
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            🛡️ Smart Cam Security
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            ระบบกล้องวงจรปิดอัจฉริยะ · ESP32-CAM
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`inline-block h-2.5 w-2.5 rounded-full ${status?.online ? 'bg-emerald-500 animate-pulse' : 'bg-red-400'}`} />
          <span className={`text-sm font-medium ${status?.online ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
            {status?.online ? 'ออนไลน์' : 'ออฟไลน์'}
          </span>
        </div>
      </div>

      {/* Status Card */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">สถานะระบบ</h2>
          {status?.last_heartbeat && (
            <p className="text-xs text-zinc-400">อัปเดตล่าสุด: {formatHeartbeat(status.last_heartbeat)}</p>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-zinc-400">กำลังโหลด...</p>
        ) : status ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusCard label="ระบบ" value={status.is_armed ? '🟢 เปิด' : '🔴 ปิด'} color={status.is_armed ? 'green' : 'red'} />
            <StatusCard label="เสียง" value={status.is_muted ? '🔇 ปิด' : '🔊 เปิด'} color={status.is_muted ? 'yellow' : 'green'} />
            <StatusCard label="ระยะตรวจจับ" value={`${status.trigger_distance_cm} ซม.`} color="neutral" />
            <StatusCard label="อุปกรณ์" value={status.device_id} color="neutral" />
          </div>
        ) : null}

        <div className="mt-6 flex flex-wrap gap-2">
          <Btn label="🔓 เปิดระบบ" color="green" onClick={() => sendCommand('arm')} />
          <Btn label="🔒 ปิดระบบ" color="red" onClick={() => sendCommand('disarm')} />
          <Btn label="🔇 ปิดเสียง" color="yellow" onClick={() => sendCommand('mute')} />
          <Btn label="🔊 เปิดเสียง" color="gray" onClick={() => sendCommand('unmute')} />
        </div>

        {commandMsg && <p className="mt-3 text-sm text-zinc-500">{commandMsg}</p>}
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">วิธีใช้งาน</h2>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>• จุดสีเขียวกระพริบ = อุปกรณ์ออนไลน์ และส่ง heartbeat ทุก 60 วิ</li>
          <li>• เซ็นเซอร์ตรวจจับวัตถุภายใน {status?.trigger_distance_cm ?? 50} ซม.</li>
          <li>• แจ้งเตือนทาง Telegram พร้อมรูปถ่าย</li>
          <li>• บันทึกภาพลง MicroSD</li>
        </ul>
      </div>

      <p className="mt-8 text-center text-xs text-zinc-400">
        <a href="/stream" className="hover:underline">📷 Live Stream</a> · ESP32-CAM · MicroPython · Next.js · Supabase
      </p>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bg: Record<string, string> = { green: 'bg-emerald-50 dark:bg-emerald-950/30', red: 'bg-red-50 dark:bg-red-950/30', yellow: 'bg-amber-50 dark:bg-amber-950/30', neutral: 'bg-zinc-50 dark:bg-zinc-800' };
  const tx: Record<string, string> = { green: 'text-emerald-700 dark:text-emerald-400', red: 'text-red-700 dark:text-red-400', yellow: 'text-amber-700 dark:text-amber-400', neutral: 'text-zinc-700 dark:text-zinc-300' };
  return (
    <div className={`rounded-xl p-4 text-center ${bg[color] || bg.neutral}`}>
      <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-lg font-bold ${tx[color] || tx.neutral}`}>{value}</p>
    </div>
  );
}

function Btn({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const c: Record<string, string> = { green: 'bg-emerald-600 hover:bg-emerald-700', red: 'bg-red-600 hover:bg-red-700', yellow: 'bg-amber-500 hover:bg-amber-600', gray: 'bg-zinc-500 hover:bg-zinc-600' };
  return <button onClick={onClick} className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${c[color] || c.gray}`}>{label}</button>;
}
