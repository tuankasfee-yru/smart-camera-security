'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemStatus {
  is_armed: boolean;
  is_muted: boolean;
  trigger_distance_cm: number;
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [commandMsg, setCommandMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status?device_id=esp32cam-01');
      const data = await res.json();
      if (data.ok) setStatus(data);
    } catch {
      setStatus({ is_armed: true, is_muted: false, trigger_distance_cm: 50 });
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          🛡️ Smart Cam Security
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          ระบบกล้องวงจรปิดอัจฉริยะ · ESP32-CAM
        </p>
      </div>

      {/* Status Card */}
      <div className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          สถานะระบบ
        </h2>

        {loading ? (
          <p className="text-sm text-zinc-400">กำลังโหลด...</p>
        ) : status ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatusCard
              label="สถานะ"
              value={status.is_armed ? '🟢 เปิด' : '🔴 ปิด'}
              color={status.is_armed ? 'green' : 'red'}
            />
            <StatusCard
              label="เสียงแจ้งเตือน"
              value={status.is_muted ? '🔇 ปิดเสียง' : '🔊 เปิดเสียง'}
              color={status.is_muted ? 'yellow' : 'green'}
            />
            <StatusCard
              label="ระยะตรวจจับ"
              value={`${status.trigger_distance_cm} ซม.`}
              color="neutral"
            />
            <StatusCard
              label="อุปกรณ์"
              value="ESP32-CAM"
              color="neutral"
            />
          </div>
        ) : (
          <p className="text-sm text-zinc-400">ไม่สามารถโหลดข้อมูล</p>
        )}

        {/* Buttons */}
        <div className="mt-6 flex flex-wrap gap-2">
          <ActionButton label="🔓 เปิดระบบ" color="green" onClick={() => sendCommand('arm')} />
          <ActionButton label="🔒 ปิดระบบ" color="red" onClick={() => sendCommand('disarm')} />
          <ActionButton label="🔇 ปิดเสียง" color="yellow" onClick={() => sendCommand('mute')} />
          <ActionButton label="🔊 เปิดเสียง" color="gray" onClick={() => sendCommand('unmute')} />
        </div>

        {commandMsg && (
          <p className="mt-3 text-sm text-zinc-500">{commandMsg}</p>
        )}
      </div>

      {/* Info Card */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-3 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          วิธีใช้งาน
        </h2>
        <ul className="space-y-2 text-sm text-zinc-600 dark:text-zinc-400">
          <li>• เซ็นเซอร์จะตรวจจับวัตถุภายในระยะ {status?.trigger_distance_cm ?? 50} ซม.</li>
          <li>• เมื่อตรวจจับได้ จะส่งข้อความแจ้งเตือนทาง Telegram</li>
          <li>• ภาพถ่ายจะถูกบันทึกลงในการ์ด MicroSD</li>
          <li>• กดปุ่มด้านบนเพื่อเปิด/ปิดระบบ หรือปิดเสียงแจ้งเตือน</li>
        </ul>
      </div>

      {/* Footer */}
      <p className="mt-8 text-center text-xs text-zinc-400">
        ESP32-CAM · MicroPython · Next.js · Supabase
      </p>
    </div>
  );
}

function StatusCard({ label, value, color }: { label: string; value: string; color: string }) {
  const bgMap: Record<string, string> = {
    green: 'bg-emerald-50 dark:bg-emerald-950/30',
    red: 'bg-red-50 dark:bg-red-950/30',
    yellow: 'bg-amber-50 dark:bg-amber-950/30',
    neutral: 'bg-zinc-50 dark:bg-zinc-800',
  };
  const textMap: Record<string, string> = {
    green: 'text-emerald-700 dark:text-emerald-400',
    red: 'text-red-700 dark:text-red-400',
    yellow: 'text-amber-700 dark:text-amber-400',
    neutral: 'text-zinc-700 dark:text-zinc-300',
  };

  return (
    <div className={`rounded-xl p-4 text-center ${bgMap[color] || bgMap.neutral}`}>
      <p className="mb-1 text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <p className={`text-lg font-bold ${textMap[color] || textMap.neutral}`}>{value}</p>
    </div>
  );
}

function ActionButton({ label, color, onClick }: { label: string; color: string; onClick: () => void }) {
  const colorMap: Record<string, string> = {
    green: 'bg-emerald-600 hover:bg-emerald-700 text-white',
    red: 'bg-red-600 hover:bg-red-700 text-white',
    yellow: 'bg-amber-500 hover:bg-amber-600 text-white',
    gray: 'bg-zinc-500 hover:bg-zinc-600 text-white',
  };
  return (
    <button
      onClick={onClick}
      className={`rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${colorMap[color] || colorMap.gray}`}
    >
      {label}
    </button>
  );
}
