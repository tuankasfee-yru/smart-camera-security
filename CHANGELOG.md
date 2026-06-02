# Changelog

## 0.6.1 - Phase 6: Dashboard MVP

### Added

- `web/app/page.tsx` — full dashboard: system status, event log table, Arm/Disarm/Mute/Unmute buttons, refresh
- `web/lib/dashboard.test.ts` — 5 dashboard logic tests
- `web/app/components/` — component directory

### Changed

- `web/lib/supabase.ts` — lazy initialization (builds without env vars)
- `web/app/api/*` — all routes handle missing Supabase gracefully

### Notes

- Dashboard works without Supabase (shows defaults + empty state)
- 16 tests passing, TypeScript clean, Next.js build successful
- Dark mode support, responsive layout

## 0.6.0 - Phase 5: Next.js API + Supabase + Tests

### Added

- `web/` — Next.js App Router project (TypeScript, Tailwind)
- `web/lib/supabase.ts` — Supabase client (public + admin)
- `web/lib/auth.ts` — X-Device-Secret header validation
- `web/app/api/log/route.ts` — POST detection events to Supabase
- `web/app/api/status/route.ts` — GET/POST system config
- `web/app/api/commands/route.ts` — GET pending / POST create
- `web/app/api/commands/result/route.ts` — POST execution results
- `web/app/api/telegram/callback/route.ts` — Telegram inline button → command
- `web/lib/auth.test.ts` — 4 tests for device secret validation
- `web/lib/api.test.ts` — 7 tests for API validation logic
- `web/.env.example` — environment template
- `web/.env.test` — test environment variables

### Notes

- All API routes validate X-Device-Secret (returns 401 if missing/wrong)
- Command types are whitelist-validated
- Telegram callback parses `device_id:command_type` format
- 11 tests passing, TypeScript typecheck clean
- Supabase schema: `system_config`, `event_logs`, `device_commands`, `command_results`

## 0.5.4 - Telegram Text Fix (POST JSON + Fallback)

### Changed

- `firmware/lib/telegram_client.py` — `send_text_message()` now uses POST with JSON body (same reliable pattern as photo)
- `firmware/lib/alert_workflow.py` — added ASCII fallback: Thai fails → retry with plain English
- `firmware/test_telegram_text.py` — tests both ASCII and Thai separately

### Notes

- GET with URL-encoded Thai/emoji was failing; POST JSON handles all Unicode natively
- `_json_escape()` and `_http_post_json()` added for clean JSON POST
- Fallback ensures alert is always sent even if Thai characters fail

## 0.5.3 - Phase 4D: Full Pipeline (Telegram Text + Photo + SD)

### Added

- `firmware/lib/telegram_client.py` — added `send_photo_message()` via multipart/form-data POST
- `firmware/lib/full_alert_workflow.py` — `run_detection_alert_cycle()`: text → capture → SD → photo
- `firmware/test_full_local_alert_sd.py` — full integration test: sensor → trigger → Telegram text → capture → save SD → Telegram photo

### Notes

- Each step independent — text failure doesn't block capture, photo failure doesn't delete SD image
- No flash LED (GPIO4/SD conflict)
- SD must mount before camera (ISR conflict)
- Photo sent via raw socket multipart POST (no urequests)

## 0.5.2 - Phase 4C: Trigger → Camera → Save to SD

### Added

- `firmware/lib/local_event_storage.py` — `save_motion_image_to_sd()` with timestamp filename `motion_sd_YYYYMMDD_HHMMSS.jpg`
- `firmware/test_trigger_save_sd.py` — sensor → trigger → camera → save JPEG to /sd

### Notes

- SD mounted BEFORE camera init (critical order: camera ISR blocks SD)
- No Wi-Fi, no flash, no Telegram — sensor + camera + SD only
- Timestamp filename per detection
- Lists SD files after each save

## 0.5.1 - Phase 4B: Camera JPEG to SD

### Added

- `firmware/lib/media_storage.py` — `save_jpeg_to_sd()` with counter/timestamp filenames, `make_timestamp_filename()`
- `firmware/test_camera_save_sd.py` — camera capture → save to SD → list SD files

### Changed

- `firmware/lib/sd_storage.py` — fixed mount order: slot=1 first (ESP32-CAM correct slot)

### Notes

- No flash LED in this test (avoids GPIO4/SD conflict)
- Timestamp filename: `cam_test_20260513_013000.jpg`
- SD API confirmed: `machine.SDCard(slot=1, width=1)`

## 0.5.0 - Phase 4A: MicroSD Card Storage

### Added

- `firmware/lib/sd_storage.py` — SD mount (1-bit & 4-bit), write_text, write_binary, read_text, list_files, free space
- `firmware/test_sd_card.py` — standalone test: mount → write → read → list

### Notes

- Tries 1-bit mode first (frees GPIO4/12/13), then 4-bit as fallback
- Updated `docs/PIN_MAPPING.md` with SD card pin table
- Updated `docs/TROUBLESHOOTING.md` with SD mount troubleshooting
- SD card must be FAT32 formatted

## 0.4.1 - Phase 3B: Trigger + Telegram Text Alert

### Added

- `firmware/lib/alert_workflow.py` — `send_detection_text_alert()` builds Thai alert message and sends via Telegram
- `firmware/test_trigger_telegram_text.py` — full pipeline: sensor → trigger → Telegram text → flash capture → save

### Notes

- Thai alert message: 🚨 ตรวจพบวัตถุใกล้กล้อง, Device, Time, Distance, File, Status
- Alert sent BEFORE capture — so Telegram arrives as capture starts
- Telegram uses raw socket+SSL (no urequests dependency)
- Cooldown prevents Telegram spam (15s)
- Flash always turns OFF (finally block in capture_workflow)

## 0.4.0 - Phase 3A: Telegram Text Message

### Added

- `firmware/lib/telegram_client.py` — `send_text_message(token, chat_id, text)` via Telegram Bot API, returns `{success, status_code, message}`
- `firmware/test_telegram_text.py` — standalone test: Wi-Fi → send text message → print result
- `firmware/config.example.py` — added `DEVICE_ID`, `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` placeholders

### Notes

- Uses `urequests.get()` — works on LeMaRiva firmware with SSL
- Minimal URL encoding for Telegram text
- Graceful fallback if `urequests` not available
- Secrets in `config.py` only — never committed
- Text-only Phase 3A — no photo, no inline buttons yet

## 0.3.3 - Phase 2E: Trigger + Flash + Capture Integration

### Added

- `firmware/lib/capture_workflow.py` — `capture_with_optional_flash()`: flash ON → warmup → capture → save → flash OFF (always, even on error)
- `firmware/test_trigger_flash_capture.py` — integrated test: sensor → trigger → flash → capture → `motion_flash_NNN.jpg`

### Notes

- Flash LED always turns OFF in `finally` block — safe even if capture fails
- `flash_enabled` parameter makes flash configurable (off when SD card in 4-bit mode)
- Returns structured dict: `{success, filename, size, error}`

## 0.3.2 - Phase 2D: Flash LED Control

### Added

- `firmware/lib/flash_led.py` — GPIO4 flash LED: `flash_on()`, `flash_off()`, `flash_pulse(ms)`, default OFF
- `firmware/test_flash_led.py` — standalone test: 3 pulses of 200ms, Ctrl+C safe cleanup

### Notes

- GPIO4 conflicts with MicroSD DAT1 in 4-bit SD mode — must use 1-bit mode or disable flash
- Updated `docs/PIN_MAPPING.md` with flash LED section and conflict warning
- Updated `docs/TROUBLESHOOTING.md` with GPIO4/SD troubleshooting

## 0.3.1 - Phase 2C: Trigger + Capture Logic

### Added

- `firmware/lib/trigger_controller.py` — TriggerController class: threshold (50cm), cooldown (15s), `should_trigger()` with `time.ticks_ms()` based timing
- `firmware/test_trigger_capture.py` — standalone test: sensor → trigger → camera → save (motion_001.jpg, motion_002.jpg, ...)

### Notes

- Cooldown prevents repeated captures from the same event
- Filename counter resets per test run
- Ctrl+C prints summary (readings + captures)
- No SD card, Telegram, or cloud integration yet

## 0.3.0 - Phase 2A: HC-SR04 Sensor Test

### Added

- `firmware/lib/sensor_hcsr04.py` — HC-SR04 driver: TRIG=GPIO12, ECHO=GPIO13, echo timeout, distance in cm
- `firmware/test_hcsr04.py` — standalone sensor test: reads every 1s, Ctrl+C to stop

### Wiring

- TRIG → GPIO 12, ECHO → voltage divider (1kΩ + 2kΩ) → GPIO 13
- CRITICAL: 5V ECHO must go through divider to 3.3V GPIO

### Notes

- Isolated test — no camera/wifi integration yet
- Uses `machine.time_pulse_us()` for echo measurement
- 30ms echo timeout, 400cm max range
- Camera init fixed: 1 positional arg only (`camera.init(framesize)`)

## 0.2.2 - Phase 1 Code (LeMaRiva API fix)

### Changed

- `firmware/lib/camera_manager.py` — fixed to single positional arg: `camera.init(framesize)`
- `firmware/lib/wifi_manager.py` — skips Wi-Fi if config.py has placeholder credentials
- `firmware/main.py` — Wi-Fi is optional (SKIP if no config); PASS/FAIL/SKIP per step

### Notes

- Camera init verified working on ESP32-D0WD-V3 with LeMaRiva `micropython_camera_feeeb5ea3_esp32_idf4_4.bin`
- Upload with Thonny (right-click → Upload to /)

## 0.2.1 - Phase 1 Camera Verification PASSED

- `import camera` PASS
- `camera.init(0, format=camera.JPEG, fb_location=camera.PSRAM)` returned True
- `camera.capture()` returned 7102 bytes
- `test.jpg` saved successfully

## 0.2.0 - Phase 1 Firmware Bring-Up

### Added

- `firmware/boot.py`, `firmware/config.example.py`
- `firmware/lib/logger.py`, `wifi_manager.py`, `camera_manager.py`
- `firmware/main.py` — Phase 1 orchestrator
- `firmware_bin/` — LeMaRiva firmware binary + README
- `tools/flash_firmware.ps1` — Windows flash script
- `docs/FLASHING_GUIDE.md` — Windows flashing guide

## 0.1.0 - Initial Documentation Pack

Documentation only. No implementation.
