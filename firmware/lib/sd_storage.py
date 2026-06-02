# lib/sd_storage.py
# MicroSD card storage for ESP32-CAM MicroPython.
#
# ESP32-CAM pin usage for SD card:
#   4-bit mode uses: GPIO2,4,12,13,14,15
#   1-bit mode uses: GPIO2,14,15 (frees GPIO4,12,13 for flash/sensor)
#
# WARNING: GPIO4 conflict — flash LED vs SD_MMC_DATA1 in 4-bit mode.
#          Use 1-bit SD mode to use both flash and sensor simultaneously.
#
# SD card must be FAT32 formatted. 16GB or smaller recommended.

import os
import machine
from lib.logger import info, warn, error

MOUNT_POINT = '/sd'
_mounted = False


def mount_sd():
    """
    Mount the MicroSD card at /sd.
    Tries 1-bit mode first, then 4-bit as fallback.
    Returns True on success.
    """
    global _mounted

    if _mounted:
        info('SD already mounted at %s' % MOUNT_POINT)
        return True

    # Ensure mount point directory exists.
    try:
        os.stat(MOUNT_POINT)
    except OSError:
        pass

    # Try mounting with different slot/width combinations.
    # ESP32-CAM uses slot=1 for SD_MMC.
    configs = [
        (1, 1, '1-bit slot1'),   # Works on ESP32-CAM — frees GPIO4/12/13
        (1, 4, '4-bit slot1'),   # Faster, conflicts with flash/sensor
        (2, 1, '1-bit slot2'),   # Fallback
    ]

    for slot, width, label in configs:
        try:
            info('SD: trying slot=%d width=%d (%s)...' % (slot, width, label))
            sd = machine.SDCard(slot=slot, width=width)
            os.mount(sd, MOUNT_POINT)
            _mounted = True
            info('SD mounted at %s (%s mode)' % (MOUNT_POINT, label))
            return True
        except Exception as e:
            warn('SD: %s failed — %s' % (label, e))
            continue

    error('SD mount failed — all modes tried.')
    error('Possible causes:')
    error('  - No SD card inserted (push it in firmly)')
    error('  - SD card not FAT32 (format on PC first)')
    error('  - SD card too large or incompatible')
    error('  - Power-cycle board after inserting SD')
    return False


def is_mounted():
    return _mounted


def list_files(path=MOUNT_POINT):
    """ List files in a directory. Returns list of filenames. """
    try:
        return os.listdir(path)
    except OSError as e:
        error('Cannot list %s: %s' % (path, e))
        return []


def write_text_file(filename, text):
    """
    Write text to a file on SD.
    `filename` should be relative to mount (e.g., 'test.txt')
    will be saved as /sd/test.txt.
    """
    if not _mounted:
        error('SD not mounted — cannot write')
        return False

    full = MOUNT_POINT + '/' + filename.lstrip('/')
    try:
        with open(full, 'w') as f:
            f.write(text)
        info('Wrote: %s (%d bytes)' % (full, len(text)))
        return True
    except OSError as e:
        error('Write error: %s' % e)
        return False


def read_text_file(filename):
    """
    Read text from a file on SD.
    Returns file content as string, or None on error.
    """
    if not _mounted:
        error('SD not mounted — cannot read')
        return None

    full = MOUNT_POINT + '/' + filename.lstrip('/')
    try:
        with open(full, 'r') as f:
            content = f.read()
        info('Read: %s (%d bytes)' % (full, len(content)))
        return content
    except OSError as e:
        error('Read error: %s' % e)
        return None


def write_binary(filename, data):
    """ Write binary data to SD. Returns True on success. """
    if not _mounted:
        error('SD not mounted — cannot write')
        return False

    full = MOUNT_POINT + '/' + filename.lstrip('/')
    try:
        with open(full, 'wb') as f:
            f.write(data)
        info('Wrote: %s (%d bytes)' % (full, len(data)))
        return True
    except OSError as e:
        error('Write error: %s' % e)
        return False


def get_free_space():
    """ Return free space in bytes at mount point. Approximate. """
    if not _mounted:
        return 0
    try:
        stat = os.statvfs(MOUNT_POINT)
        return stat[0] * stat[3]
    except:
        return 0


def get_sorted_media_files():
    """
    List JPEG files sorted by name (which includes timestamp).
    Returns list of filenames, oldest first.
    """
    if not _mounted:
        return []
    try:
        files = [f for f in os.listdir(MOUNT_POINT) if f.endswith('.jpg')]
        files.sort()
        return files
    except:
        return []


def _get_file_path(filename):
    return MOUNT_POINT + '/' + filename.lstrip('/')


def cleanup_oldest_files(min_free_bytes=500 * 1024 * 1024):
    """
    Delete oldest JPEG files until free space >= min_free_bytes.
    Default threshold: 500 MB.
    Returns number of files deleted.
    """
    if not _mounted:
        return 0

    deleted = 0
    while True:
        free = get_free_space()
        if free >= min_free_bytes or free == 0:
            break

        files = get_sorted_media_files()
        if len(files) == 0:
            break

        # Delete the oldest file.
        oldest = files[0]
        path = _get_file_path(oldest)
        try:
            os.remove(path)
            deleted += 1
            info('SD cleanup: removed %s (free: %d MB)' % (oldest, free // (1024 * 1024)))
        except OSError as e:
            warn('SD cleanup: cannot delete %s: %s' % (oldest, e))
            break

    return deleted
