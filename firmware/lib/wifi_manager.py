# lib/wifi_manager.py
# Connect ESP32-CAM to Wi-Fi with timeout and retries.

import network
import time
from lib.logger import info, warn


def connect(ssid, password, timeout=15, retries=3):

    if not ssid or ssid == 'YOUR_SSID':
        info('Wi-Fi: SKIPPED (no credentials in config.py)')
        return None

    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)

    if wlan.isconnected():
        info('Wi-Fi already connected: %s' % wlan.ifconfig()[0])
        return wlan

    info('Connecting to: %s' % ssid)

    for attempt in range(1, retries + 1):
        try:
            wlan.connect(ssid, password)
        except Exception as e:
            warn('Wi-Fi connect error: %s' % e)
            time.sleep(2)
            continue

        deadline = time.time() + timeout
        while not wlan.isconnected():
            if time.time() > deadline:
                warn('Timed out (attempt %d/%d)' % (attempt, retries))
                break
            time.sleep_ms(500)

        if wlan.isconnected():
            ip = wlan.ifconfig()[0]
            info('Connected! IP: %s' % ip)
            return wlan

        warn('Retrying in 2 seconds...')
        time.sleep(2)

    info('Failed to connect after %d attempts' % retries)
    return None
