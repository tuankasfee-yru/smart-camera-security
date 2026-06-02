# lib/cloud_api.py
# ESP32-CAM cloud communication — heartbeat, events, commands.
# Supports both HTTP (dev) and HTTPS (production).

import socket
import ssl
import gc
import json
from lib.logger import info, warn, error


def _parse_url(base_url):
    """
    Parse base_url into (host, port, use_ssl).
    Examples: 'https://app.vercel.app' → ('app.vercel.app', 443, True)
              'http://192.168.1.100:3000' → ('192.168.1.100', 3000, False)
              '192.168.1.100:3000' → ('192.168.1.100', 3000, False)
    """
    use_ssl = False
    url = base_url.strip()
    if url.startswith('https://'):
        use_ssl = True
        url = url[8:]
    elif url.startswith('http://'):
        url = url[7:]

    if ':' in url:
        host, port_str = url.rsplit(':', 1)
        try:
            port = int(port_str)
        except:
            port = 443 if use_ssl else 80
    else:
        host = url.rstrip('/')
        port = 443 if use_ssl else 80

    return host, port, use_ssl


def _json_ok(code, body):
    if code != 200:
        return False
    try:
        return json.loads(body).get('ok', False)
    except:
        return '"ok":true' in body


def _http_post_json(host, port, use_ssl, path, json_body, headers_extra=None, timeout=15):
    """ HTTPS/HTTP POST with JSON body. Returns (status_code, body_text). """
    gc.collect()
    content_length = len(json_body)

    addr = socket.getaddrinfo(host, port)[0][-1]
    s = socket.socket()
    s.settimeout(timeout)

    try:
        s.connect(addr)
        if use_ssl:
            s = ssl.wrap_socket(s)

        hdr = 'POST %s HTTP/1.1\r\nHost: %s\r\nContent-Type: application/json; charset=utf-8\r\nContent-Length: %d\r\nConnection: close\r\n' % (path, host, content_length)
        if headers_extra:
            for k, v in headers_extra.items():
                hdr += '%s: %s\r\n' % (k, v)
        hdr += '\r\n'

        s.write(hdr.encode())
        s.write(json_body)

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


def send_heartbeat(base_url, device_id, api_secret, device_ip=None):
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/heartbeat'

    if device_ip:
        payload = '{"device_id":"%s","device_ip":"%s"}' % (device_id, device_ip)
    else:
        payload = '{"device_id":"%s"}' % device_id
    headers = {'X-Device-Secret': api_secret}

    try:
        code, body = _http_post_json(host, port, use_ssl, path, payload, headers_extra=headers)
        ok = _json_ok(code, body)
        if ok:
            info('Heartbeat OK')
        else:
            warn('Heartbeat failed: HTTP %d' % code)
        return ok
    except Exception as e:
        warn('Heartbeat error: %s' % e)
        return False


def post_event(base_url, device_id, api_secret, detected_at, distance_cm, image_filename=None):
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/log'
    payload = '{"device_id":"%s","detected_at":"%s","distance_cm":%.1f,"image_filename":%s}' % (
        device_id, detected_at, distance_cm,
        '"%s"' % image_filename if image_filename else 'null'
    )
    headers = {'X-Device-Secret': api_secret}

    try:
        code, body = _http_post_json(host, port, use_ssl, path, payload, headers_extra=headers)
        ok = _json_ok(code, body)
        if ok:
            info('Event posted OK')
        else:
            warn('Event post failed: HTTP %d %s' % (code, body[:80]))
        return ok
    except Exception as e:
        warn('Event post error: %s' % e)
        return False


def fetch_commands(base_url, device_id, api_secret):
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/commands?device_id=%s' % device_id
    s = None

    try:
        addr = socket.getaddrinfo(host, port)[0][-1]
        s = socket.socket()
        s.settimeout(10)
        s.connect(addr)
        if use_ssl:
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
        if s:
            try:
                s.close()
            except:
                pass


def report_command_result(base_url, device_id, api_secret, command_id, success, message=''):
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/commands/result'
    payload = '{"command_id":"%s","device_id":"%s","success":%s,"message":"%s"}' % (
        command_id, device_id, 'true' if success else 'false', message
    )
    headers = {'X-Device-Secret': api_secret}

    try:
        code, _ = _http_post_json(host, port, use_ssl, path, payload, headers_extra=headers)
        return code == 200
    except Exception as e:
        warn('Report result error: %s' % e)
        return False


def register_cloud_url(base_url, device_id, api_secret, detected_at, distance_cm, filename, cloudinary_url):
    """
    POST /api/cloud-capture with Cloudinary URL reference.
    Returns True on success.
    """
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/cloud-capture'

    payload = '{"device_id":"%s","detected_at":"%s","distance_cm":%.1f,"filename":"%s","cloudinary_url":"%s"}' % (
        device_id, detected_at, distance_cm, filename, cloudinary_url
    )
    headers = {'X-Device-Secret': api_secret}

    try:
        code, body = _http_post_json(host, port, use_ssl, path, payload, headers_extra=headers)
        ok = _json_ok(code, body)
        if ok:
            info('Cloud URL registered')
        else:
            warn('Cloud URL register failed: HTTP %d' % code)
        return ok
    except Exception as e:
        warn('Cloud URL register error: %s' % e)
        return False


def upload_capture(base_url, device_id, api_secret, image_bytes, detected_at, distance_cm, filename):
    """
    Upload JPEG capture to cloud /api/captures.
    Uses raw socket POST with multipart.
    Returns dict with { 'success': bool, 'id': str, 'url': str }
    """
    import time as _time
    host, port, use_ssl = _parse_url(base_url)
    path = '/api/captures'
    gc.collect()

    boundary = '----ESP32UPLOAD'
    eol = '\r\n'
    body = b''
    body += ('--%s' % boundary + eol).encode()
    body += ('Content-Disposition: form-data; name="image"; filename="%s"' % filename + eol).encode()
    body += ('Content-Type: image/jpeg' + eol + eol).encode()
    body += image_bytes
    body += (eol).encode()
    body += ('--%s--' % boundary + eol).encode()

    content_length = len(body)

    addr = socket.getaddrinfo(host, port)[0][-1]
    s = socket.socket()
    s.settimeout(30)

    try:
        s.connect(addr)
        if use_ssl:
            s = ssl.wrap_socket(s)

        hdr = (
            'POST %s HTTP/1.1\r\n'
            'Host: %s\r\n'
            'X-Device-Secret: %s\r\n'
            'X-Device-Id: %s\r\n'
            'X-Detected-At: %s\r\n'
            'X-Distance-Cm: %.1f\r\n'
            'X-Filename: %s\r\n'
            'Content-Type: multipart/form-data; boundary=%s\r\n'
            'Content-Length: %d\r\n'
            'Connection: close\r\n'
            '\r\n'
        ) % (path, host, api_secret, device_id, detected_at, distance_cm, filename, boundary, content_length)
        s.write(hdr.encode())
        s.write(body)

        buf = b''
        while True:
            try:
                chunk = s.read(512)
                if not chunk: break
                buf += chunk
            except: break

        text = buf.decode('utf-8', 'ignore')
        body_text = text.split('\r\n\r\n', 1)[1] if '\r\n\r\n' in text else '{}'
        try:
            data = json.loads(body_text)
            return {'success': data.get('ok', False), 'id': data.get('id', ''), 'url': '/api/captures/view/'}
        except:
            return {'success': '"ok":true' in text, 'id': '', 'url': ''}
    except Exception as e:
        warn('Upload error: %s' % e)
        return {'success': False, 'id': '', 'url': ''}
    finally:
        try: s.close()
        except: pass
