# main.py
# ESP32-CAM Smart Security Camera — full system.
# Auto-runs on boot: Wi-Fi → camera → flash → sensor → trigger → Telegram alert.

import gc
gc.collect()

from lib.logger import info

info('Starting Smart Cam Security...')
info('')

import test_trigger_telegram_text
