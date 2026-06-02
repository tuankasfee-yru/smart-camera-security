# main.py
# ESP32-CAM Smart Security — full integrated system.
# Wi-Fi → SD → Camera → Trigger → Telegram → Cloud heartbeat + events

import gc
import time

gc.collect()
print('=== Smart Cam Security Starting ===')

# --- Load config ---
try:
    import config
except ImportError:
    print('ERROR: config.py not found. Copy config.example.py -> config.py')
    raise

from lib.logger import info, warn, error
from lib.wifi_manager import connect as wifi_connect

# --- Connect Wi-Fi ---
wlan = wifi_connect(config.WIFI_SSID, config.WIFI_PASSWORD)
if wlan is None:
    error('Wi-Fi failed. Cannot continue.')
    raise SystemExit

ip = wlan.ifconfig()[0]
info('Wi-Fi OK: %s' % ip)

# --- Cloud setup ---
device_id = getattr(config, 'DEVICE_ID', 'esp32cam-01')
cloud_url = getattr(config, 'CLOUD_BASE_URL', None)
api_secret = getattr(config, 'DEVICE_API_SECRET', None)
use_cloud = bool(cloud_url and api_secret)

if use_cloud:
    info('Cloud: %s' % cloud_url)
else:
    warn('Cloud not configured. Heartbeat + events disabled.')
    warn('Set CLOUD_BASE_URL and DEVICE_API_SECRET in config.py')

# --- SD Card (before camera) ---
from lib.sd_storage import mount_sd
sd_ok = mount_sd()
if sd_ok:
    info('SD: mounted')
else:
    warn('SD: not available — saving to internal flash')

# --- Camera ---
from lib.camera_manager import init as cam_init
from lib.camera_manager import capture as cam_capture
from lib.camera_manager import deinit as cam_deinit
from lib.camera_manager import save as cam_save

if not cam_init(framesize=5):
    error('Camera init failed.')
    raise SystemExit
info('Camera: ready')

# --- Flash ---
from lib.flash_led import init_flash, flash_off
init_flash()
info('Flash: ready')

# --- Trigger ---
from lib.trigger_controller import TriggerController
from lib.sensor_hcsr04 import read_cm
tc = TriggerController(distance_cm=50, cooldown_sec=15)
info('Trigger: ready (threshold=50cm, cooldown=15s)')

# --- Telegram ---
token = getattr(config, 'TELEGRAM_BOT_TOKEN', '')
chat_id = getattr(config, 'TELEGRAM_CHAT_ID', '')
use_telegram = bool(token and chat_id)
if use_telegram:
    info('Telegram: configured')
else:
    warn('Telegram: not configured')

# --- Cloud ---
if use_cloud:
    from lib.cloud_api import send_heartbeat, post_event, fetch_commands, report_command_result

info('')
info('System ready. Monitoring...')
info('')

capture_count = 0
last_heartbeat = 0
HEARTBEAT_INTERVAL_SEC = 60
COMMAND_POLL_INTERVAL_SEC = 15
last_command_poll = 0

try:
    while True:

        now = time.time()

        # --- Heartbeat ---
        if use_cloud and (now - last_heartbeat) >= HEARTBEAT_INTERVAL_SEC:
            send_heartbeat(cloud_url, device_id, api_secret, device_ip=ip)
            last_heartbeat = now

        # --- Command polling ---
        if use_cloud and (now - last_command_poll) >= COMMAND_POLL_INTERVAL_SEC:
            cmds = fetch_commands(cloud_url, device_id, api_secret)
            for cmd in cmds:
                cmd_type = cmd.get('command_type', '')
                cmd_id = cmd.get('id', '')
                info('Command received: %s' % cmd_type)

                if cmd_type == 'arm':
                    tc.set_threshold(50)
                    tc.reset()
                elif cmd_type == 'disarm':
                    tc.set_threshold(999)
                elif cmd_type == 'mute':
                    pass
                elif cmd_type == 'unmute':
                    pass

                report_command_result(cloud_url, device_id, api_secret, cmd_id, True, 'ok')

            last_command_poll = now

        # --- Sensor ---
        d = read_cm()

        if d is not None and d <= tc.threshold_cm and tc.should_trigger(d):
            capture_count += 1
            info('')
            info('=== DETECTION #%d (%.1f cm) ===' % (capture_count, d))

            # 1. Capture + flash
            from lib.flash_led import flash_on
            flash_on()
            time.sleep_ms(200)
            jpeg = cam_capture()
            flash_off()

            if jpeg is None:
                error('Capture failed')
                time.sleep(1)
                continue

            # 2. Save image
            from lib.local_event_storage import save_motion_image_to_sd
            filename = 'motion_%03d.jpg' % capture_count

            if sd_ok:
                result = save_motion_image_to_sd(jpeg, distance_cm=d)
                if result['success']:
                    info('SD: %s' % result['path'])
                    # Cleanup old files if space < 500 MB
                    from lib.sd_storage import get_free_space, cleanup_oldest_files
                    free_mb = get_free_space() // (1024 * 1024)
                    if free_mb < 500:
                        cleanup_oldest_files()
            else:
                cam_save(jpeg, filename)
                info('Saved: %s' % filename)

            # 3. Deinit camera → free RAM for network
            cam_deinit()
            gc.collect()

            # 4. Telegram alert
            if use_telegram:
                from lib.alert_workflow import send_detection_text_alert
                send_detection_text_alert(token, chat_id, device_id, d, filename=filename)

                from lib.telegram_client import send_photo_message
                send_photo_message(token, chat_id, jpeg, caption='%.1f cm | %s' % (d, filename))

            # 5. Cloud event
            if use_cloud:
                t = time.localtime()
                ts = '%04d-%02d-%02dT%02d:%02d:%02dZ' % (t[0], t[1], t[2], t[3], t[4], t[5])
                post_event(cloud_url, device_id, api_secret, ts, d, filename)

            # 6. Re-init camera
            cam_init(framesize=5)
            gc.collect()
            info('Cooldown %ds. Ready.' % (tc.cooldown_ms // 1000))

        time.sleep_ms(500)

except KeyboardInterrupt:
    info('')
    info('System stopped.')

except Exception as e:
    error('Fatal error: %s' % e)

flash_off()
cam_deinit()
info('Shutdown complete.')
