# Test Plan

## Phase 1: Firmware Bring-Up

### Camera Verification — PASSED (2026-05-12)

ESP32-D0WD-V3 + LeMaRiva `micropython_camera_feeeb5ea3_esp32_idf4_4.bin`

| # | Test | Actual | Status |
|---|---|---|---|
| 1 | `print("hello")` | OK | PASS |
| 2 | `import camera` | No error | PASS |
| 3 | `camera.init(5)` | True | PASS |
| 4 | `camera.capture()` | Returns bytes | PASS |
| 5 | Save JPEG | File saved | PASS |

### Full Phase 1 Sequence

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import main` | Full sequence runs | PASS |
| 2 | Wi-Fi connect | `Connected! IP: 192.168.x.x` | PASS |
| 3 | Camera init | `Camera ready` | PASS |
| 4 | Capture | `Captured N bytes` | PASS |
| 5 | Save test.jpg | `Saved: test.jpg` | PASS |

## Phase 2A: HC-SR04 Sensor Test

### Wiring

```
HC-SR04 VCC  -> ESP32-CAM 5V
HC-SR04 GND  -> ESP32-CAM GND
HC-SR04 TRIG -> GPIO 12
HC-SR04 ECHO -> voltage divider (1kΩ + 2kΩ) -> GPIO 13
```

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.sensor_hcsr04` | No error | PASS |
| 2 | `import test_hcsr04` | Test starts | PASS |
| 3 | No object near | `OUT OF RANGE` | PASS |
| 4 | Object at ~30 cm | `~30 cm` | PASS |
| 5 | Ct rl+C | `Test stopped` | PASS |

## Phase 2C: Trigger + Capture

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.trigger_controller` | No error | PENDING |
| 2 | `import test_trigger_capture` | Test starts | PENDING |
| 3 | Object far (> 50 cm) | No trigger, prints `armed` | PENDING |
| 4 | Object near (< 50 cm) | `TRIGGER!` → capture → `motion_001.jpg` | PENDING |
| 5 | Object stays near | `cooldown Xs remaining` — no duplicate | PENDING |
| 6 | Wait cooldown, object near again | Second trigger → `motion_002.jpg` | PENDING |
| 7 | Ctrl+C | Summary: N readings, M captures | PENDING |

## Phase 2D: Flash LED (GPIO4)

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.flash_led` | No error | PENDING |
| 2 | `import test_flash_led` | Test starts | PENDING |
| 3 | Flash blinks 3 times | 3 brief pulses visible (200ms each) | PENDING |
| 4 | LED OFF after test | LED stays off | PENDING |
| 5 | Ctrl+C during test | LED turns OFF cleanly | PENDING |

GPIO4 conflict note: remove MicroSD or use 1-bit SD mode.

## Phase 2E: Trigger + Flash + Capture

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.capture_workflow` | No error | PENDING |
| 2 | `import test_trigger_flash_capture` | Test starts | PENDING |
| 3 | Object near (< 50cm) | Flash ON → capture → Flash OFF → `motion_flash_001.jpg` | PENDING |
| 4 | Object stays near | Cooldown prevents spam, flash stays OFF | PENDING |
| 5 | Ctrl+C during test | Flash OFF + camera released | PENDING |
| 6 | Image brighter with flash | JPEG shows flash illumination | PENDING |

## Phase 3A: Telegram Text Message

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.telegram_client` | No error (or clear urequests warning) | PENDING |
| 2 | `import test_telegram_text` | Test starts, connects Wi-Fi | PENDING |
| 3 | Send text message | Message appears in Telegram chat | PENDING |
| 4 | Missing token | Error: "TELEGRAM_BOT_TOKEN is empty" | PENDING |
| 5 | Wrong token | Error: HTTP 401 or 404 | PENDING |
| 6 | No Wi-Fi | Error: Wi-Fi connection failed | PASS |

## Phase 3B: Trigger + Telegram Text Alert

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.alert_workflow` | No error | PENDING |
| 2 | `import test_trigger_telegram_text` | Wi-Fi → Camera → Flash → Trigger ready | PENDING |
| 3 | Object near (< 50cm) | Telegram text sent → flash capture → `alert_001.jpg` | PENDING |
| 4 | Telegram message format | Thai text: device ID, distance, filename, Armed | PENDING |
| 5 | Object stays near | Cooldown prevents Telegram spam | PENDING |
| 6 | Ctrl+C | Flash OFF, Camera released, summary | PENDING |

## Phase 4A: MicroSD Card

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.sd_storage` | No error | PENDING |
| 2 | `import test_sd_card` | Test starts | PENDING |
| 3 | SD mount | Mounts in 1-bit or 4-bit mode | PENDING |
| 4 | Write `/sd/test_sd.txt` | File written | PENDING |
| 5 | Read back | Content matches | PENDING |
| 6 | List files | `test_sd.txt` in list | PENDING |
| 7 | No SD card inserted | Clear error + troubleshooting tips | PENDING |

## Phase 4B: JPEG to SD

| Test | Expected |
|---|---|
| SD mount | Mount succeeds |
| Write text file | File on SD |
| Save JPEG to SD | JPEG with timestamp filename |

## Phase 4B: JPEG to SD

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.media_storage` | No error | PENDING |
| 2 | `import test_camera_save_sd` | Test starts | PENDING |
| 3 | SD mount | Mounts (slot=1) | PENDING |
| 4 | Camera init + capture | Captured N bytes | PENDING |
| 5 | Save JPEG to SD | `cam_test_YYYYMMDD_HHMMSS.jpg` saved | PENDING |
| 6 | File in SD listing | File visible in list | PENDING |
| 7 | Transfer file to PC (Thonny) | Valid JPEG image | PENDING |

## Phase 4C: Trigger + Save to SD

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.local_event_storage` | No error | PENDING |
| 2 | `import test_trigger_save_sd` | SD mounts → camera ready → trigger ready | PENDING |
| 3 | Object near (< 50cm) | Capture → `motion_sd_YYYYMMDD_HHMMSS.jpg` on /sd | PENDING |
| 4 | Object stays near | Cooldown prevents repeated capture | PENDING |
| 5 | Wait cooldown, trigger again | Second capture → new filename | PENDING |
| 6 | Ctrl+C | Summary + camera released | PENDING |
| 7 | SD files after test | Multiple motion_sd_*.jpg on SD | PENDING |

## Phase 4D: Full Pipeline (Telegram + SD)

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import lib.full_alert_workflow` | No error | PENDING |
| 2 | `import test_full_local_alert_sd` | Wi-Fi → SD → Camera → Sensor ready | PENDING |
| 3 | Object near (< 50cm) | Telegram text → capture → SD save → Telegram photo | PENDING |
| 4 | Telegram text fails | Still capture + save to SD | PENDING |
| 5 | Telegram photo fails | SD image still saved, cycle continues | PENDING |
| 6 | Cooldown | Prevents Telegram spam | PENDING |
| 7 | Ctrl+C | Camera released, summary | PENDING |

## Phase 4D Telegram Fix

| # | Test | Expected | Status |
|---|---|---|---|
| 1 | `import test_telegram_text` → ASCII | PASS | PENDING |
| 2 | `import test_telegram_text` → Thai | PASS (POST JSON handles Unicode) | PENDING |
| 3 | Thai fails | Auto-retry with ASCII fallback | PENDING |

## Phase 5: API + Dashboard (Future)

| Test | Expected |
|---|---|
| POST `/api/log` | 200 |
| GET `/api/status` | JSON |
| Dashboard loads | No crash |

## Final Acceptance

1. Detect < 50cm → capture JPEG → save to SD
2. Telegram alert (text + photo)
3. Event in dashboard
4. Dashboard disarm respected
