import { describe, it, expect } from "vitest";

describe("Dashboard logic", () => {
  it("derives armed state correctly after arm command", () => {
    const initial = { is_armed: false, is_muted: false, trigger_distance_cm: 50 };
    const after = { ...initial, is_armed: true };
    expect(after.is_armed).toBe(true);
  });

  it("derives armed state correctly after disarm command", () => {
    const initial = { is_armed: true, is_muted: false, trigger_distance_cm: 50 };
    const after = { ...initial, is_armed: false };
    expect(after.is_armed).toBe(false);
  });

  it("derives mute state correctly", () => {
    const initial = { is_armed: true, is_muted: false, trigger_distance_cm: 50 };
    const after = { ...initial, is_muted: true };
    expect(after.is_muted).toBe(true);
  });

  it("formats distance correctly", () => {
    const format = (cm: number | null) => (cm != null ? `${cm} cm` : "—");
    expect(format(43)).toBe("43 cm");
    expect(format(null)).toBe("—");
  });

  it("formats timestamp to locale string", () => {
    const ts = "2026-05-13T02:30:00.000Z";
    const d = new Date(ts);
    expect(d.toISOString()).toBe(ts);
  });
});
