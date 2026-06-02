# lib/cloud_api.py
# ESP32-CAM cloud communication — heartbeat and event posting.
# Uses raw socket+SSL (same pattern as telegram_client).

import socket
import ssl
import gc
import json
from lib.logger import info, warn, error


def _http_post_json(host, path, json_body, headers_extra=None, timeout=15):
    """ HTTPS POST with JSON body. Returns (status_code, body_text). """
    gc.collect()
    body_bytes = json_body.encode('utf-8')
    content_length = len(body_bytes)

    addr = socket.getaddrinfo(host, 443)[0][-1]
    s = socket.socket()
    s.settimeout(timeout)

    try:
        s.connect(addr)
        s = ssl.wrap_socket(s)

        hdr = 'POST %s HTTP/1.1\r\nHost: %s\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: %d\r\nConnection: close\r\n' % (path, host, content_length)
        if headers_extra:
            for k, v in headers_extra.items():
                hdr += '%s: %s\r\n' % (k, v)
        hdr += '\r\n'

        s.write(hdr.encode())
        s.write(body_bytes)

        buf = b''
        while True:
            try:
                chunk = s.read(1024)
                if not chunk:
                    break
                buf += chunk
            except:
                break

        text = buf.decode('utf-8', 'ignore')
        code = 0
        try:
            code = int(text.split('\r\n')[0].split(' ')[1])
        except:
            pass
        body = text.split('\r\n\r\n', 1)[1] if '\r\n\r\n' in text else ''
        return code, body
    finally:
        try:
            s.close()
        except:
            pass


def send_heartbeat(base_url, device_id, api_secret):
    """
    POST /api/heartbeat with device_id.
    Returns True on success.
    """
    host = base_url.replace('https://', '').replace('http://', '').rstrip('/')
    path = '/api/heartbeat'

    payload = '{"device_id":"%s"}' % device_id
    headers = {'X-Device-Secret': api_secret}

    try:
        code, body = _http_post_json(host, path, payload, headers_extra=headers)
        ok = code == 200 and '"ok":true' in body
        if ok:
            info('Heartbeat OK')
        else:
            warn('Heartbeat failed: HTTP %d' % code)
        return ok
    except Exception as e:
        warn('Heartbeat error: %s' % e)
        return False


def post_event(base_url, device_id, api_secret, detected_at, distance_cm, image_filename=None):
    """
    POST /api/log with detection event.
    Returns True on success.
    """
    host = base_url.replace('https://', '').replace('http://', '').rstrip('/')
    path = '/api/log'

    payload = '{"device_id":"%s","detected_at":"%s","distance_cm":%.1f,"image_filename":%s}' % (
        device_id, detected_at, distance_cm,
        '"%s"' % image_filename if image_filename else 'null'
    )
    headers = {'X-Device-Secret': api_secret}

    try:
        code, body = _http_post_json(host, path, payload, headers_extra=headers)
        ok = code == 200 and '"ok":true' in body
        if ok:
            info('Event posted OK')
        else:
            warn('Event post failed: HTTP %d %s' % (code, body[:80]))
        return ok
    except Exception as e:
        warn('Event post error: %s' % e)
        return False


def fetch_commands(base_url, device_id, api_secret):
    """
    GET /api/commands?device_id=<id>. Returns list of commands or [].
    """
    host = base_url.replace('https://', '').replace('http://', '').rstrip('/')
    path = '/api/commands?device_id=%s' % device_id

    try:
        addr = socket.getaddrinfo(host, 443)[0][-1]
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)
        s = ssl.wrap_socket(s)

        hdr = 'GET %s HTTP/1.1\r\nHost: %s\r\nX-Device-Secret: %s\r\nConnection: close\r\n\r\n' % (path, host, api_secret)
        s.write(hdr.encode())

        buf = b''
        while True:
            try:
                chunk = s.read(1024)
                if not chunk:
                    break
                buf += chunk
            except:
                break

        text = buf.decode('utf-8', 'ignore')
        body = text.split('\r\n\r\n', 1)[1] if '\r\n\r\n' in text else '{}'

        try:
            data = json.loads(body)
            return data.get('commands', [])
        except:
            return []

    except Exception as e:
        warn('Fetch commands error: %s' % e)
        return []
    finally:
        try:
            s.close()
        except:
            pass


def report_command_result(base_url, device_id, api_secret, command_id, success, message=''):
    """
    POST /api/commands/result. Returns True on success.
    """
    host = base_url.replace('https://', '').replace('http://', '').rstrip('/')
    path = '/api/commands/result'

    payload = '{"command_id":"%s","device_id":"%s","success":%s,"message":"%s"}' % (
        command_id, device_id, 'true' if success else 'false', message
    )
    headers = {'X-Device-Secret': api_secret}

    try:
        code, _ = _http_post_json(host, path, payload, headers_extra=headers)
        return code == 200
    except Exception as e:
        warn('Report result error: %s' % e)
        return False
