'use client';

import { useState, useEffect, useCallback } from 'react';

interface SystemStatus {
  is_armed: boolean;
  is_muted: boolean;
  trigger_distance_cm: number;
}

interface EventLog {
  id: string;
  device_id: string;
  detected_at: string;
  distance_cm: number | null;
  image_filename: string | null;
  created_at: string;
}

export default function Dashboard() {
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [events, setEvents] = useState<EventLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commandMsg, setCommandMsg] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/status?device_id=esp32cam-01');
      const data = await res.json();
      if (data.ok) setStatus(data);
    } catch {
      // API not available yet — use defaults
      setStatus({ is_armed: true, is_muted: false, trigger_distance_cm: 50 });
    }
  }, []);

  const fetchEvents = useCallback(async () => {
    try {
      const res = await fetch('/api/log');
      if (res.ok) {
        const data = await res.json();
        if (data.events) setEvents(data.events);
      }
    } catch {
      // API not available yet — show empty
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchEvents();
  }, [fetchStatus, fetchEvents]);

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
        setCommandMsg(`Command "${command_type}" queued.`);
        if (command_type === 'arm') setStatus((s) => s ? { ...s, is_armed: true } : null);
        if (command_type === 'disarm') setStatus((s) => s ? { ...s, is_armed: false } : null);
        if (command_type === 'mute') setStatus((s) => s ? { ...s, is_muted: true } : null);
        if (command_type === 'unmute') setStatus((s) => s ? { ...s, is_muted: false } : null);
      } else {
        setCommandMsg(`Failed: ${data.error}`);
      }
    } catch {
      setCommandMsg('API not reachable.');
    }
  };

  const refresh = () => {
    setLoading(true);
    setError(null);
    fetchStatus();
    fetchEvents();
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Header */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
            Smart Cam Security
          </h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            ESP32-CAM · Device: esp32cam-01
          </p>
        </div>
        <button
          onClick={refresh}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Refresh
        </button>
      </div>

      {/* Status Card */}
      <div className="mb-8 rounded-xl border border-zinc-200 bg-white p-6 dark:border-zinc-700 dark:bg-zinc-900">
        <h2 className="mb-4 text-lg font-semibold text-zinc-800 dark:text-zinc-200">
          System Status
        </h2>
        {status ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <StatusBadge label="Armed" active={status.is_armed} activeColor="green" inactiveText="Disarmed" />
            <StatusBadge label="Muted" active={status.is_muted} activeColor="yellow" inactiveText="Unmuted" />
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Threshold</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {status.trigger_distance_cm} cm
              </p>
            </div>
            <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Events</p>
              <p className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                {events.length}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-zinc-400">Loading status...</p>
        )}

        {/* Commands */}
        <div className="mt-6 flex flex-wrap gap-2">
          <button
            onClick={() => sendCommand('arm')}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700"
          >
            Arm
          </button>
          <button
            onClick={() => sendCommand('disarm')}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700"
          >
            Disarm
          </button>
          <button
            onClick={() => sendCommand('mute')}
            className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-600"
          >
            Mute
          </button>
          <button
            onClick={() => sendCommand('unmute')}
            className="rounded-lg bg-zinc-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-600"
          >
            Unmute
          </button>
        </div>

        {commandMsg && (
          <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{commandMsg}</p>
        )}
      </div>

      {/* Event Log */}
      <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-900">
        <div className="border-b border-zinc-200 px-6 py-4 dark:border-zinc-700">
          <h2 className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
            Event Logs
          </h2>
        </div>

        {loading ? (
          <p className="px-6 py-8 text-center text-sm text-zinc-400">Loading events...</p>
        ) : error ? (
          <div className="px-6 py-8 text-center">
            <p className="text-sm text-red-500">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 text-sm text-blue-600 hover:underline dark:text-blue-400"
            >
              Retry
            </button>
          </div>
        ) : events.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">No detection events yet.</p>
            <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
              Events will appear here when ESP32-CAM detects motion.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800">
                <tr>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Time</th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">Distance</th>
                  <th className="px-6 py-3 font-medium text-zinc-500 dark:text-zinc-400">File</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {events.map((ev) => (
                  <tr key={ev.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <td className="px-6 py-3 text-zinc-700 dark:text-zinc-300">
                      {new Date(ev.detected_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-3">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                        {ev.distance_cm != null ? `${ev.distance_cm} cm` : '—'}
                      </span>
                    </td>
                    <td className="px-6 py-3 font-mono text-xs text-zinc-500 dark:text-zinc-400">
                      {ev.image_filename || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatusBadge({
  label,
  active,
  activeColor,
  inactiveText,
}: {
  label: string;
  active: boolean;
  activeColor: 'green' | 'yellow';
  inactiveText: string;
}) {
  const colors = {
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    yellow: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  };
  const activeClass = colors[activeColor];
  const inactiveClass = 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400';

  return (
    <div className="rounded-lg bg-zinc-50 p-3 text-center dark:bg-zinc-800">
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{label}</p>
      <span
        className={`mt-1 inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${
          active ? activeClass : inactiveClass
        }`}
      >
        {active ? label : inactiveText}
      </span>
    </div>
  );
}
