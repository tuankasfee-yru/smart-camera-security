# Firmware MicroPython Specification

## Platform

- Board: AI-Thinker ESP32-CAM
- Language: MicroPython only
- Camera: OV2640
- Sensor: HC-SR04
- Storage: MicroSD FAT32
- Network: Wi-Fi
- Alert: Telegram Bot API
- Cloud API: Next.js API routes

## Firmware Requirement

Use a MicroPython build that includes camera support.

A normal MicroPython firmware may not include `camera`.

The first hardware validation task is:

```python
import camera
```

If this fails, stop and fix firmware before building other features.

## Main Behavior

1. Boot device.
2. Connect to Wi-Fi.
3. Initialize camera.
4. Initialize HC-SR04 pins.
5. Mount SD card.
6. Fetch system status from cloud.
7. Enter main loop.
8. If armed, measure distance.
9. If distance is below threshold:
   - capture JPEG (with automatic retry: deinit → wait 500ms → reinit → recapture, up to 2 retries)
   - save JPEG to SD
   - send Telegram alert
   - post event log to cloud
10. Poll cloud commands periodically.
11. Execute commands and report result.
    Supported commands: arm, disarm, enable_sensor, disable_sensor, mute, unmute, capture_snapshot.
    capture_snapshot: immediately captures, saves, alerts, and reports without waiting for trigger.

## Suggested Main Loop State

```python
is_armed = True
is_muted = False
sensor_enabled = True
trigger_distance_cm = 50
last_trigger_ms = 0
trigger_cooldown_ms = 15000
```

## Required Functions

Recommended function names:

```python
connect_wifi()
init_camera()
init_sensor()
mount_sd()
read_distance_cm()
capture_jpeg()
save_jpeg_to_sd(image_bytes, filename)
send_telegram_message(text)
send_telegram_photo(image_bytes, caption)
post_event_log(event)
fetch_status()
fetch_commands()
execute_command(command)
report_command_result(command_id, success, message)
cleanup_sd_if_needed()
```

## Network Rules

- Use timeouts.
- Use retries with maximum attempts.
- Do not block forever.
- Log errors to console.
- If Telegram fails, still save the image and post event log if possible.
- If cloud API fails, continue local operation.

## Camera Rules

- Start with low or medium resolution.
- Confirm camera capture before integrating Telegram.
- Avoid high resolution until stable.
- Release image buffers when possible.
- On capture failure: deinit, wait 500ms, reinit, retry up to 2 times.

## Sensor Rules

- Use echo timeout.
- Filter bad readings.
- Ignore invalid distances.
- Use cooldown after trigger.

## Storage Rules

- Use timestamp filename.
- Create folder by date if possible.
- Check free space before saving.
- Delete oldest files when low space.

## MVP Exclusions

Do not implement in MVP:

- AVI recording
- live video streaming
- MJPEG cloud proxy
- large Telegram video upload
