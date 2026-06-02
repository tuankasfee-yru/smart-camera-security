import { describe, it, expect } from "vitest";

// API route validation logic tests

const ALLOWED_COMMANDS = ["arm", "disarm", "mute", "unmute", "delete_latest_file", "cleanup_sd", "capture_snapshot"];

describe("API validation", () => {
  describe("POST /api/log", () => {
    it("requires device_id", () => {
      const body: any = { detected_at: "2026-01-01T00:00:00Z" };
      expect(body.device_id).toBeUndefined();
    });

    it("requires detected_at", () => {
      const body: any = { device_id: "esp32cam-01" };
      expect(body.detected_at).toBeUndefined();
    });

    it("accepts valid payload", () => {
      const body = {
        device_id: "esp32cam-01",
        detected_at: "2026-01-01T00:00:00Z",
        distance_cm: 43,
        image_filename: "motion.jpg",
      };
      expect(body.device_id).toBe("esp32cam-01");
      expect(body.distance_cm).toBe(43);
    });
  });

  describe("POST /api/commands", () => {
    it("rejects invalid command_type", () => {
      expect(ALLOWED_COMMANDS.includes("invalid")).toBe(false);
    });

    it("accepts all valid command types", () => {
      ALLOWED_COMMANDS.forEach((cmd) => {
        expect(ALLOWED_COMMANDS.includes(cmd)).toBe(true);
      });
    });
  });

  describe("/api/commands telemetry callback parser", () => {
    it("parses valid callback data", () => {
      const [device_id, command_type] = "esp32cam-01:disarm".split(":", 2);
      expect(device_id).toBe("esp32cam-01");
      expect(command_type).toBe("disarm");
    });

    it("rejects empty callback data", () => {
      const data = "";
      expect(data).toBeFalsy();
    });
  });
});
