# lib/cloudinary_upload.py
# Cloudinary unsigned upload via multipart/form-data POST over HTTPS.
# Uses the same raw socket + SSL pattern as telegram_client.py.
# No external dependencies — works with built-in MicroPython socket/ssl only.
#
# Usage:
#   from lib.cloudinary_upload import upload_to_cloudinary
#   result = upload_to_cloudinary(jpeg_bytes, 'mycloud', 'smartcam_upload')
#   if result['success']:
#       print(result['url'])

import socket
import ssl
import gc
from lib.logger import info, warn, error


def upload_to_cloudinary(image_bytes, cloud_name, upload_preset):
    """
    Upload a JPEG image to Cloudinary via unsigned upload preset.

    POST multipart/form-data to:
      https://api.cloudinary.com/v1_1/<cloud_name>/image/upload

    Args:
        image_bytes: JPEG image as bytes/bytearray
        cloud_name: Cloudinary cloud name (string)
        upload_preset: Cloudinary unsigned upload preset name (string)

    Returns dict:
        { 'success': bool, 'url': str, 'public_id': str, 'message': str }
    """
    result = {
        'success': False,
        'url': '',
        'public_id': '',
        'message': '',
    }

    if not image_bytes:
        result['message'] = 'No image data'
        return result

    if not cloud_name or not upload_preset:
        result['message'] = 'Missing cloud_name or upload_preset'
        return result

    host = 'api.cloudinary.com'
    path = '/v1_1/%s/image/upload' % cloud_name

    boundary = '----ESP32CAMCLOUD'
    eol = '\r\n'

    # Build multipart body
    body = b''

    # file field
    body += ('--%s' % boundary + eol).encode()
    body += ('Content-Disposition: form-data; name="file"; filename="capture.jpg"' + eol).encode()
    body += ('Content-Type: image/jpeg' + eol + eol).encode()
    body += image_bytes
    body += (eol).encode()

    # upload_preset field
    body += ('--%s' % boundary + eol).encode()
    body += ('Content-Disposition: form-data; name="upload_preset"' + eol + eol).encode()
    body += (upload_preset + eol).encode()

    # End boundary
    body += ('--%s--' % boundary + eol).encode()

    content_length = len(body)
    info('Cloudinary: uploading %d bytes to %s...' % (content_length, cloud_name))

    gc.collect()
    addr = socket.getaddrinfo(host, 443)[0][-1]
    s = socket.socket()
    s.settimeout(30)

    try:
        s.connect(addr)
        s = ssl.wrap_socket(s)

        header = (
            'POST %s HTTP/1.1\r\n'
            'Host: %s\r\n'
            'Content-Type: multipart/form-data; boundary=%s\r\n'
            'Content-Length: %d\r\n'
            'Connection: close\r\n'
            '\r\n'
        ) % (path, host, boundary, content_length)
        s.write(header.encode())
        s.write(body)

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

        status_code = 0
        try:
            status_line = text.split('\r\n')[0]
            status_code = int(status_line.split(' ')[1])
        except:
            pass

        # Parse JSON body from response
        resp_body = ''
        if '\r\n\r\n' in text:
            resp_body = text.split('\r\n\r\n', 1)[1]

        if status_code == 200:
            # Parse Cloudinary JSON response for url and public_id
            try:
                # Simple JSON value extraction (avoids importing json module)
                url = _extract_json_string(resp_body, 'secure_url')
                if not url:
                    url = _extract_json_string(resp_body, 'url')
                public_id = _extract_json_string(resp_body, 'public_id')

                result['success'] = True
                result['url'] = url
                result['public_id'] = public_id
                result['message'] = 'Uploaded OK'
                info('Cloudinary: upload OK — %s' % url[:80])
            except Exception as e:
                result['message'] = 'Parse error: %s' % e
                warn('Cloudinary: response parse failed — %s' % resp_body[:100])
        else:
            result['message'] = 'HTTP %d — %s' % (status_code, resp_body[:120])
            warn('Cloudinary: upload failed — %s' % result['message'])

    except Exception as e:
        result['message'] = 'Network error: %s' % e
        error('Cloudinary: %s' % e)

    finally:
        try:
            s.close()
        except:
            pass

    return result


def _extract_json_string(text, key):
    """
    Extract a string value for a JSON key without importing json.
    Handles the pattern: "key":"value" or "key": "value"
    Returns '' if not found.
    """
    search = '"%s"' % key
    idx = text.find(search)
    if idx < 0:
        return ''

    # Find the colon after the key
    colon_idx = text.find(':', idx + len(search))
    if colon_idx < 0:
        return ''

    # Find the opening quote of the value
    q1 = text.find('"', colon_idx + 1)
    if q1 < 0:
        return ''

    # Find the closing quote
    q2 = text.find('"', q1 + 1)
    if q2 < 0:
        return ''

    return text[q1 + 1:q2]
