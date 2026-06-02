# Troubleshooting

## `import camera` Fails

### Symptoms

- `ImportError: no module named camera`

### Likely Causes

- Wrong MicroPython firmware
- Camera driver missing
- Board not supported by current firmware

### Fix

Flash camera-enabled MicroPython firmware for ESP32-CAM.

---

## Camera Init Fails

### Symptoms

- camera init error
- reboot after init
- black image

### Likely Causes

- Weak power supply
- Wrong camera pin config
- PSRAM issue
- Camera ribbon not seated

### Fix

- Use 5V 2A power supply.
- Reseat camera ribbon.
- Try lower resolution.
- Verify board type.

---

## LeMaRiva Camera API Note

The LeMaRiva firmware (`micropython_camera_feeeb5ea3_esp32_idf4_4.bin`) v1.18 i2s driver:

```python
import camera
camera.init(framesize)  # exactly 1 positional arg. e.g. 5 = QVGA (320x240)
img = camera.capture()  # returns bytes
```

Do NOT pass keyword args (`format=`, `fb_location=`) — only 1 positional arg accepted.
If init fails after repeated attempts, power-cycle the board (unplug USB, wait, replug).
Verified working on ESP32-D0WD-V3 (2026-05-12).

---

## HC-SR04 Always Reads Wrong Distance

### Symptoms

- distance always 0
- distance always very high
- timeout every time

### Likely Causes

- Wrong Trig/Echo pins (TRIG=GPIO12, ECHO=GPIO13)
- No shared ground between sensor and ESP32-CAM
- ECHO connected directly to GPIO (no voltage divider!)
- Sensor VCC not connected to 5V
- GPIO conflict with SD card or camera

### Fix

- Check pin mapping: `docs/PIN_MAPPING.md`
- Check ground: VCC 5V, GND shared, TRIG=12, ECHO=13
- Confirm voltage divider: 1kΩ + 2kΩ on ECHO
- Test with isolated script: `import test_hcsr04`
- If using SD card, switch to 1-bit mode to free GPIO12/13

---

## ESP32-CAM Reboots Randomly

### Symptoms

- brownout
- restart during Wi-Fi
- restart during camera capture

### Likely Causes

- Weak power
- USB cable poor quality
- High camera resolution
- Memory pressure

### Fix

- Use 5V 2A supply.
- Use short cable.
- Lower image resolution.
- Reduce simultaneous tasks.

---

## SD Card Mount Fails

### Symptoms

- `SD mount failed — all modes tried`
- `OSError: [Errno 19] ENODEV`
- `OSError: No SD card`

### Likely Causes

- No SD card inserted or not FAT32 formatted
- SD > 32GB or poor quality / fake card
- GPIO conflict with flash LED or sensor

### Fix

- Insert reliable MicroSD (16GB), format as FAT32
- Use 1-bit SD mode: frees GPIO4/12/13
- Power-cycle board after inserting SD
- Run `import test_sd_card` to isolate the issue

---

## Flash LED / SD Card Conflict (GPIO4)

### Symptoms

- Flash LED works but SD card fails to mount/read/write
- Or SD card works but flash LED doesn't light

### Cause

GPIO4 is shared: built-in flash LED vs SD_MMC_DATA1 (4-bit SD mode).

### Fix

- Use 1-bit SD mode to free GPIO4
- Call `flash_off()` before any SD operation
- See `docs/PIN_MAPPING.md` for details

---

## Telegram Message Fails

### Symptoms

- timeout
- 401 unauthorized
- no message in chat
- ENOMEM (out of memory)

### Likely Causes

- Wrong bot token or chat ID (must be numeric, not @username)
- GET with long URL-encoded text fails on some firmware (use POST JSON instead)
- SSL memory pressure after camera init

### Fix

- Test token: `https://api.telegram.org/bot<TOKEN>/getMe`
- Find chat ID: send /start to bot, then `https://api.telegram.org/bot<TOKEN>/getUpdates`
- Use `send_text_message()` which now uses POST JSON (reliable Unicode handling)
- Fallback: Thai fails → ASCII retry automatically
- Deinit camera before sending Telegram to free RAM
- See `alert_workflow.py` for fallback logic
- If `urequests` not found: the firmware build lacks network support

---

## API Returns 401

### Symptoms

- `/api/log` returns unauthorized

### Likely Causes

- Missing `X-Device-Secret`
- Wrong secret
- Environment variable missing

### Fix

- Check `.env.local`.
- Check Vercel env.
- Confirm ESP32 request header.

---

## Supabase Insert Fails

### Symptoms

- API route returns database error

### Likely Causes

- Wrong schema
- Missing env vars
- RLS blocking write
- Invalid payload

### Fix

- Re-run schema SQL.
- Check service role key on server.
- Validate payload.
- Review RLS settings.

---

## Vercel Stream Proxy Times Out

### Symptoms

- stream stops
- function times out
- dashboard hangs

### Likely Cause

Using Vercel for long-running camera stream.

### Fix

Do not proxy camera stream through Vercel. Use home gateway and tunnel.

---

## mpremote Commands Fail in Thonny REPL

### Symptoms

Running `py -m mpremote` or `pip install mpremote` inside Thonny REPL produces `SyntaxError` or unrecognized command.

### Cause

The MicroPython REPL (`>>>` prompt) only accepts MicroPython code. Shell commands like `py`, `pip`, `mpremote` must be run in **PowerShell** or **CMD** on your PC, not inside the Thonny REPL.

### Fix

- Close the REPL connection in Thonny (or switch to the Shell tab).
- Open a separate **PowerShell** or **CMD** window.
- Run `mpremote` commands from the PowerShell terminal, not from Thonny's REPL.
- Example: `mpremote connect COM13 fs cp firmware/main.py :main.py`

### Quick Reference

| Where | What |
|---|---|
| Thonny REPL (`>>>`) | MicroPython code only: `import camera`, `print("hi")` |
| PowerShell / CMD | Shell commands: `mpremote`, `esptool`, `pip`, `py` |
