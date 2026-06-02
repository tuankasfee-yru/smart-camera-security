# lib/alert_workflow.py
# Alert message builder — sends Telegram text when detection occurs.
# Uses telegram_client for the actual HTTP request.
# Falls back to ASCII if Thai/emoji message fails.

import time
from lib.logger import info, warn, error
from lib.telegram_client import send_text_message


def send_detection_text_alert(token, chat_id, device_id, distance_cm, filename=None):
    """
    Send a Telegram text alert for a detection event.
    Tries Thai message first, then ASCII fallback.

    Returns dict: { 'success': bool, 'message': str }
    """
    result = {
        'success': False,
        'message': '',
    }

    if not token or not chat_id:
        result['message'] = 'Missing token or chat_id'
        return result

    t = time.localtime()
    timestamp = '%04d-%02d-%02d %02d:%02d:%02d' % (
        t[0], t[1], t[2], t[3], t[4], t[5]
    )

    file_line = ''
    if filename:
        file_line = 'File: %s\n' % filename

    # --- Attempt 1: Thai message with emoji ---
    msg = (
        '\xf0\x9f\x9a\xa8 \xe0\xb8\x95\xe0\xb8\xa3\xe0\xb8\xa7\xe0\xb8\x88\xe0\xb8\x9e\xe0\xb8\x9a\xe0\xb8\xa7\xe0\xb8\xb1\xe0\xb8\x95\xe0\xb8\x96\xe0\xb8\xb8\xe0\xb9\x83\xe0\xb8\x81\xe0\xb8\xa5\xe0\xb9\x89\xe0\xb8\x81\xe0\xb8\xa5\xe0\xb9\x89\xe0\xb8\xad\xe0\xb8\x87\n'
        '\n'
        'Device: %s\n'
        'Time: %s\n'
        'Distance: %.1f cm\n'
        '%s'
        'Status: Armed\n'
    ) % (device_id, timestamp, distance_cm, file_line)

    info('Telegram alert (Thai): %s at %.1f cm' % (device_id, distance_cm))
    r = send_text_message(token, chat_id, msg)

    if r['success']:
        result['success'] = True
        result['message'] = 'Sent OK (Thai)'
        return result

    warn('Thai text failed: %s' % r['message'])

    # --- Attempt 2: Simple ASCII fallback ---
    fallback = (
        'ALERT: Object detected\n'
        'Device: %s\n'
        'Time: %s\n'
        'Distance: %.1f cm\n'
        '%s'
        'Status: Armed'
    ) % (device_id, timestamp, distance_cm, file_line)

    info('Telegram alert (ASCII fallback)...')
    r2 = send_text_message(token, chat_id, fallback)

    if r2['success']:
        result['success'] = True
        result['message'] = 'Sent OK (ASCII fallback)'
    else:
        result['message'] = 'Both Thai and ASCII failed: %s' % r2['message']

    return result
