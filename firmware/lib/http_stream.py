# lib/http_stream.py
# Simple HTTP server on ESP32-CAM — serves JPEG snapshots.
#
# Usage:
#   from lib.http_stream import start_server, stop_server
#   start_server(port=8080)
#
# Then access: http://<ESP32-IP>:8080/snapshot
#
# For remote access, run ngrok on a PC on the same network:
#   ngrok http http://<ESP32-IP>:8080

import socket
import gc
from lib.logger import info, warn, error

_running = False
_server_socket = None


def _read_request(client):
    """ Read HTTP request line. Returns (method, path). """
    try:
        client.settimeout(2)
        data = b''
        while b'\r\n\r\n' not in data:
            chunk = client.recv(256)
            if not chunk:
                break
            data += chunk
            if len(data) > 1024:
                break
        line = data.split(b'\r\n')[0].decode('utf-8', 'ignore')
        parts = line.split(' ')
        if len(parts) >= 2:
            return parts[0], parts[1]
    except:
        pass
    return 'GET', '/'


def _send_response(client, status, content_type, body):
    """ Send HTTP response. """
    header = (
        'HTTP/1.0 %s\r\n'
        'Content-Type: %s\r\n'
        'Content-Length: %d\r\n'
        'Connection: close\r\n'
        'Access-Control-Allow-Origin: *\r\n'
        '\r\n'
    ) % (status, content_type, len(body))
    try:
        client.send(header.encode())
        client.send(body)
    except:
        pass


def _send_html(client, html):
    _send_response(client, '200 OK', 'text/html; charset=utf-8', html.encode('utf-8'))


def _send_jpeg(client, jpeg_bytes):
    _send_response(client, '200 OK', 'image/jpeg', jpeg_bytes)


def _build_index_page():
    """ Build simple HTML page with auto-refreshing snapshot. """
    return '''<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>ESP32-CAM Live</title>
<style>
body{margin:0;background:#000;display:flex;justify-content:center;align-items:center;min-height:100vh}
img{max-width:100%;max-height:100vh}
</style>
</head><body>
<img id="cam" src="/snapshot" onload="setTimeout(function(){this.src='/snapshot?'+Date.now()},200)" alt="ESP32-CAM">
</body></html>'''


def start_server(port=8080):
    """ Start HTTP server on given port. Runs in foreground (blocking). """
    global _running, _server_socket

    addr = socket.getaddrinfo('0.0.0.0', port)[0][-1]
    s = socket.socket()
    s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
    s.bind(addr)
    s.listen(1)
    s.settimeout(None)
    _server_socket = s
    _running = True

    from lib.camera_manager import capture as cam_capture

    info('Stream server started on port %d' % port)
    info('Local: http://ESP-IP:%d/' % port)

    while _running:
        try:
            client, addr = s.accept()
            method, path = _read_request(client)

            if path.startswith('/snapshot'):
                gc.collect()
                jpeg = cam_capture()
                if jpeg:
                    _send_jpeg(client, jpeg)
                else:
                    _send_response(client, '500 OK', 'text/plain', b'Capture failed')
            else:
                html = _build_index_page()
                _send_html(client, html)

        except OSError as e:
            if _running:
                warn('Stream server error: %s' % e)
        except Exception as e:
            if _running:
                warn('Stream connection error: %s' % e)
        finally:
            try:
                client.close()
            except:
                pass

    info('Stream server stopped.')


def stop_server():
    """ Stop the HTTP server. """
    global _running
    _running = False
    if _server_socket:
        try:
            _server_socket.close()
        except:
            pass
