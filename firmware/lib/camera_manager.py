# lib/camera_manager.py
# Camera control for ESP32-CAM using LeMaRiva firmware v1.18 i2s driver.
# camera.init() takes exactly 1 positional arg: framesize constant.
# Power cycle the board if init fails after repeated attempts.

import gc
import time
from lib.logger import info, warn, error

# LeMaRiva i2s driver frame sizes:
#   0 = 96x96       5 = QVGA (320x240)
#   1 = QQVGA       8 = VGA  (640x480)
#   2 = QCIF       10 = SVGA
#   3 = HQVGA      ...etc

camera_ok = False

try:
    import camera
    camera_ok = True
    info('Camera module loaded')
except ImportError:
    camera = None
    error('Camera module missing!')
    error('Flash LeMaRiva firmware: micropython_camera_feeeb5ea3_esp32_idf4_4.bin')


def init(framesize=5):
    """ framesize=5 is QVGA (320x240). Pass an integer constant. """
    if not camera_ok:
        return False

    try:
        camera.deinit()
    except:
        pass

    try:
        result = camera.init(framesize)
        if result:
            info('Camera ready (framesize=%d)' % framesize)
            return True
        else:
            error('Camera init returned False (framesize=%d)' % framesize)
            return False
    except Exception as e:
        error('Camera init error: %s' % e)
        error('Try power-cycling the board (unplug USB, wait, replug)')
        return False


def capture():
    if not camera_ok:
        return None
    try:
        gc.collect()
        buf = camera.capture()
        if not buf or len(buf) == 0:
            warn('Capture returned empty buffer')
            return None
        info('Captured %d bytes' % len(buf))
        return buf
    except Exception as e:
        error('Capture error: %s' % e)
        return None


def save(buf, filename='test.jpg'):
    try:
        with open(filename, 'wb') as f:
            f.write(buf)
        info('Saved: %s (%d bytes)' % (filename, len(buf)))
        return True
    except OSError as e:
        error('Save error: %s' % e)
        return False


def deinit():
    if camera_ok and camera is not None:
        try:
            camera.deinit()
            info('Camera deinitialized')
        except Exception as e:
            warn('Deinit warning: %s' % e)


def capture_with_retry(framesize=5, max_retries=2):
    """
    Capture with automatic retry on failure.
    When capture returns None: deinit, wait 500ms, reinit, retry.
    Retries up to max_retries times before giving up.
    Returns image bytes (bytearray) or None.
    """
    for attempt in range(max_retries + 1):
        buf = capture()
        if buf is not None:
            return buf

        if attempt < max_retries:
            warn('Capture attempt %d of %d failed, retrying...' % (attempt + 1, max_retries + 1))
            deinit()
            time.sleep_ms(500)
            gc.collect()
            if not init(framesize):
                error('Camera reinit failed during retry %d' % (attempt + 1))
                return None

    error('Capture failed after %d attempts' % (max_retries + 1))
    return None
