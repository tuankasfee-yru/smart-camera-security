import { describe, it, expect } from "vitest";

function isOnline(lastHeartbeat: string | null): boolean {
  if (!lastHeartbeat) return false;
  const t = new Date(lastHeartbeat).getTime();
  const now = Date.now();
  return (now - t) < 2 * 60 * 1000;
}

function formatHeartbeat(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = Date.now();
  const diff = Math.floor((now - d.getTime()) / 1000);
  if (diff < 60) return `${diff}s`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  return d.toLocaleString();
}

describe("Heartbeat logic", () => {
  it("null heartbeat → offline", () => {
    expect(isOnline(null)).toBe(false);
  });

  it("recent heartbeat → online", () => {
    const recent = new Date(Date.now() - 30000).toISOString();
    expect(isOnline(recent)).toBe(true);
  });

  it("old heartbeat → offline", () => {
    const old = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    expect(isOnline(old)).toBe(false);
  });

  it("formats recent time as seconds", () => {
    const recent = new Date(Date.now() - 30000).toISOString();
    expect(formatHeartbeat(recent)).toMatch(/^\d+s$/);
  });

  it("formats older time as minutes", () => {
    const old = new Date(Date.now() - 90000).toISOString();
    expect(formatHeartbeat(old)).toBe("1m");
  });

  it("formats null as dash", () => {
    expect(formatHeartbeat(null)).toBe("—");
  });
});
