# test_trigger_telegram_text.py
# Full detection pipeline test:
#   sensor -> trigger -> Telegram text -> flash + capture -> save
#
# Run via REPL:  import test_trigger_telegram_text
# Stop with:    Ctrl+C

import time
import gc

from lib.logger import info, warn, error
from lib.wifi_manager import connect as wifi_connect
from lib.camera_manager import init as cam_init
from lib.camera_manager import deinit as cam_deinit
from lib.sensor_hcsr04 import read_cm
from lib.trigger_controller import TriggerController
from lib.flash_led import init_flash, flash_off
from lib.capture_workflow import capture_with_optional_flash
from lib.alert_workflow import send_detection_text_alert


def _load_config():
    try:
        import config
        return config
    except ImportError:
        return None


def test():
    info('================================')
    info('  Trigger + Telegram Text Alert')
    info('================================')
    info('Threshold : 50 cm')
    info('Cooldown  : 15 seconds')
    info('Flash     : ON  (GPIO4)')
    info('')

    # --- Config ---
    cfg = _load_config()
    if cfg is None:
        error('config.py not found.')
        return

    # --- Wi-Fi ---
    if not cfg.WIFI_SSID or cfg.WIFI_SSID == 'YOUR_SSID':
        error('Wi-Fi not configured.')
        return

    wlan = wifi_connect(cfg.WIFI_SSID, cfg.WIFI_PASSWORD)
    if wlan is None:
        error('Wi-Fi failed.')
        return
    info('PASS: Wi-Fi connected')

    # --- Telegram ---
    token = getattr(cfg, 'TELEGRAM_BOT_TOKEN', '')
    chat_id = getattr(cfg, 'TELEGRAM_CHAT_ID', '')
    device = getattr(cfg, 'DEVICE_ID', 'esp32cam-01')

    if not token or not chat_id:
        error('Telegram token or chat_id missing in config.py')
        return
    info('Telegram: configured (device=%s)' % device)

    # --- Camera ---
    if not cam_init(framesize=5):
        error('Camera init failed.')
        return
    info('Camera ready')

    # --- Flash ---
    init_flash()
    info('Flash ready')

    # --- Trigger ---
    tc = TriggerController(distance_cm=50, cooldown_sec=15)
    info('Trigger ready')
    info('')

    info('Reading sensor every 1s.  Press Ctrl+C to stop.')
    info('')

    capture_count = 0
    read_count = 0

    try:
        while True:

            read_count += 1
            d = read_cm()

            # --- Status line ---
            if d is None:
                print(' [%d] --- out of range' % read_count)
            else:
                cd = tc.cooldown_remaining_sec()
                if cd > 0:
                    print(' [%d] %.1f cm  (cooldown %ds)' % (read_count, d, int(cd)))
                else:
                    print(' [%d] %.1f cm  (armed)' % (read_count, d))

            # --- Trigger ---
            if tc.should_trigger(d):
                capture_count += 1
                info('')
                info('=== DETECTION #%d ===' % capture_count)
                info('Distance: %.1f cm' % d)

                # 1. Flash + capture + save.
                name = 'alert_%03d.jpg' % capture_count
                info('Capturing with flash...')
                cap = capture_with_optional_flash(
                    flash_enabled=True,
                    flash_warmup_ms=200,
                    filename=name,
                )
                if cap['success']:
                    info('Saved: %s (%d bytes)' % (name, cap['size']))
                else:
                    error('Capture failed: %s' % cap['error'])

                # 2. Deinit camera to free RAM for Telegram.
                cam_deinit()
                flash_off()
                gc.collect()
                info('Camera released. Free mem: %d' % gc.mem_free())

                # 3. Telegram text alert (camera released).
                alert = send_detection_text_alert(
                    token, chat_id, device, d, filename=name
                )
                if alert['success']:
                    info('Telegram: SENT')
                else:
                    warn('Telegram: %s' % alert['message'])

                # 4. Re-init camera for next cycle.
                cam_init(framesize=5)
                init_flash()
                gc.collect()

                info('Cooldown %ds. Free mem: %d' % (
                    tc.cooldown_ms // 1000, gc.mem_free()))
                info('')

            time.sleep(1)

    except KeyboardInterrupt:
        info('')
        info('Stopped.  %d readings, %d alerts.' % (read_count, capture_count))

    flash_off()
    cam_deinit()
    info('Flash OFF. Camera released.')
    info('Done.')


test()
