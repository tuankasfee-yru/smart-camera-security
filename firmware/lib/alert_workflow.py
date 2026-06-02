# lib/alert_workflow.py
# Alert message builder — sends Telegram text with inline buttons.
# Falls back to ASCII if Thai/emoji message fails.

import time
from lib.logger import info, warn, error
from lib.telegram_client import send_text_message


def _build_keyboard(device_id, dashboard_url=None):
    """ Build inline keyboard buttons for the alert message. """
    rows = []

    row1 = []
    if dashboard_url:
        row1.append({'text': 'Open Dashboard', 'url': dashboard_url})

    row2 = [
        {'text': 'Disarm', 'callback_data': '%s:disarm' % device_id},
        {'text': 'Mute', 'callback_data': '%s:mute' % device_id},
    ]
    rows.append(row2)

    row3 = [
        {'text': 'Delete File', 'callback_data': '%s:delete_latest_file' % device_id},
    ]
    rows.append(row3)

    if row1:
        rows.insert(0, row1)

    return rows


def send_detection_text_alert(token, chat_id, device_id, distance_cm, filename=None, dashboard_url=None, device_ip=None):
    """
    Send a Telegram text alert with inline buttons.
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

    ip_line = ''
    if device_ip:
        ip_line = 'IP: %s\n' % device_ip

    keyboard = _build_keyboard(device_id, dashboard_url)

    # --- Attempt 1: Thai message with emoji ---
    msg = (
        '\xf0\x9f\x9a\xa8 \xe0\xb9\x81\xe0\xb8\x88\xe0\xb9\x89\xe0\xb8\x87\xe0\xb9\x80\xe0\xb8\x95\xe0\xb8\xb7\xe0\xb8\xad\xe0\xb8\x99\n'
        '\n'
        'Device: %s\n'
        '%s'
        'Time: %s\n'
        'Distance: %.1f cm\n'
        '%s'
        'Status: Armed'
    ) % (device_id, ip_line, timestamp, distance_cm, file_line)

    info('Telegram alert (Thai + buttons): %s at %.1f cm' % (device_id, distance_cm))
    r = send_text_message(token, chat_id, msg, keyboard=keyboard)

    if r['success']:
        result['success'] = True
        result['message'] = 'Sent OK (Thai + buttons)'
        return result

    warn('Thai text failed: %s' % r['message'])

    # --- Attempt 2: Simple ASCII fallback ---
    fallback = (
        'ALERT: Object detected\n'
        'Device: %s\n'
        '%s'
        'Time: %s\n'
        'Distance: %.1f cm\n'
        '%s'
        'Status: Armed'
    ) % (device_id, ip_line, timestamp, distance_cm, file_line)

    info('Telegram alert (ASCII + buttons)...')
    r2 = send_text_message(token, chat_id, fallback, keyboard=keyboard)

    if r2['success']:
        result['success'] = True
        result['message'] = 'Sent OK (ASCII + buttons)'
    else:
        result['message'] = 'Both Thai and ASCII failed: %s' % r2['message']

    return result
