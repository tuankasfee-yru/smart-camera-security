# test_telegram_text.py
# Standalone test: Wi-Fi + Telegram text message.
# Tests both ASCII and Thai messages.
#
# Run via REPL:  import test_telegram_text
#
# Requires config.py with real TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID.

from lib.logger import info, warn, error
from lib.wifi_manager import connect as wifi_connect
from lib.telegram_client import send_text_message


def _load_config():
    try:
        import config
        return config
    except ImportError:
        return None


def test():
    info('================================')
    info('  Telegram Text Message Test')
    info('================================')
    info('')

    cfg = _load_config()
    if cfg is None:
        error('config.py not found.')
        return

    if not cfg.WIFI_SSID or cfg.WIFI_SSID == 'YOUR_SSID':
        error('Wi-Fi not configured.')
        return

    wlan = wifi_connect(cfg.WIFI_SSID, cfg.WIFI_PASSWORD)
    if wlan is None:
        error('Wi-Fi failed.')
        return
    info('PASS: Wi-Fi')

    token = getattr(cfg, 'TELEGRAM_BOT_TOKEN', '')
    chat_id = getattr(cfg, 'TELEGRAM_CHAT_ID', '')
    device = getattr(cfg, 'DEVICE_ID', 'esp32cam-01')

    if not token or not chat_id:
        error('Telegram not configured.')
        return

    # ---- Test 1: ASCII ----
    info('')
    info('--- Test 1: ASCII message ---')
    info('Sending: ESP32-CAM test from %s' % device)
    r = send_text_message(token, chat_id, 'ESP32-CAM test from %s' % device)
    if r['success']:
        info('PASS: ASCII message sent!')
    else:
        error('FAIL: %s (code %d)' % (r['message'], r['status_code']))
        error('Response: %s' % r.get('response', ''))

    # ---- Test 2: Thai + emoji ----
    info('')
    info('--- Test 2: Thai message ---')
    thai = '\xf0\x9f\x9a\xa8 \xe0\xb8\x97\xe0\xb8\x94\xe0\xb8\xaa\xe0\xb8\xad\xe0\xb8\x9a\xe0\xb8\xa0\xe0\xb8\xb2\xe0\xb8\xa9\xe0\xb8\xb2\xe0\xb9\x84\xe0\xb8\x97\xe0\xb8\xa2'
    info('Sending: %s' % thai)
    r2 = send_text_message(token, chat_id, thai)
    if r2['success']:
        info('PASS: Thai message sent!')
    else:
        error('FAIL: %s (code %d)' % (r2['message'], r2['status_code']))
        error('Response: %s' % r2.get('response', ''))

    info('')
    info('Done.')


test()
