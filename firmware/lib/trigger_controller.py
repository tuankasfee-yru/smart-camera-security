# lib/trigger_controller.py
# Simple trigger logic for distance-based capture.
# Uses cooldown to prevent repeated captures from the same event.

import time


class TriggerController:

    def __init__(self, distance_cm=50, cooldown_sec=15):
        self.threshold_cm = distance_cm
        self.cooldown_ms = cooldown_sec * 1000
        self.last_trigger_ms = 0
        self.sensor_enabled = True

    def set_threshold(self, cm):
        self.threshold_cm = cm

    def set_cooldown(self, sec):
        self.cooldown_ms = sec * 1000

    def enable_sensor(self):
        """ Enable sensor: restore threshold to 50cm, set sensor_enabled. """
        self.threshold_cm = 50
        self.sensor_enabled = True

    def disable_sensor(self):
        """ Disable sensor: set threshold to 999 (effectively off), clear flag. """
        self.threshold_cm = 999
        self.sensor_enabled = False

    def set_sensor_enabled(self, enabled):
        """ Set the sensor_enabled flag directly. """
        self.sensor_enabled = bool(enabled)

    def should_trigger(self, distance_cm):
        """
        Check whether the given distance should trigger a capture.
        Returns True if:
          - distance is valid AND below threshold
          - cooldown has expired since last trigger
        Updates last_trigger_ms on True.
        """
        if distance_cm is None:
            return False

        if distance_cm > self.threshold_cm:
            return False

        now = time.ticks_ms()

        if time.ticks_diff(now, self.last_trigger_ms) < self.cooldown_ms:
            return False

        self.last_trigger_ms = now
        return True

    def cooldown_remaining_sec(self):
        """ Seconds remaining before another trigger is allowed. """
        elapsed = time.ticks_diff(time.ticks_ms(), self.last_trigger_ms)
        if elapsed >= self.cooldown_ms:
            return 0
        return round((self.cooldown_ms - elapsed) / 1000, 1)

    def reset(self):
        """ Reset cooldown so next valid distance triggers immediately. """
        self.last_trigger_ms = 0
