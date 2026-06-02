# test_stream.py
# Standalone HTTP stream test — serves JPEG snapshots on port 8080.
#
# Run via REPL:  import test_stream
# Stop:         Ctrl+C
#
# Then open browser: http://<ESP32-IP>:8080/

from lib.logger import info
from lib.wifi_manager import connect as wifi_connect
from lib.camera_manager import init as cam_init
from lib.camera_manager import deinit as cam_deinit
from lib.http_stream import start_server

try:
    import config
    wlan = wifi_connect(config.WIFI_SSID, config.WIFI_PASSWORD)
    if wlan is None:
        print('Wi-Fi failed')
    else:
        ip = wlan.ifconfig()[0]
        info('Wi-Fi: %s' % ip)

        if cam_init(framesize=8):
            info('Camera ready. Starting stream server...')
            info('')
            info('Open in browser: http://%s:8080/' % ip)
            info('')
            start_server(port=8080)
        else:
            print('Camera init failed')

except KeyboardInterrupt:
    info('Stopped')

cam_deinit()
info('Done.')
