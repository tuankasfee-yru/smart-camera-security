# Remote Live Stream Guide

## วิธีดูกล้องสดผ่านเน็ต

### Step 1: เปิด Stream Server บน ESP32

ใน Thonny REPL:
```python
import test_stream
```

หรือรันโดยตรง:
```python
import config
from lib.wifi_manager import connect
from lib.camera_manager import init
from lib.http_stream import start_server

wlan = connect(config.WIFI_SSID, config.WIFI_PASSWORD)
ip = wlan.ifconfig()[0]
init(framesize=8)
start_server(port=8080)
```

เปิด browser → `http://<ESP_IP>:8080/` → เห็นภาพสด

### Step 2: ติดตั้ง ngrok บน PC

1. โหลด ngrok จาก https://ngrok.com/download
2. สมัครฟรี → เอา authtoken
3. ติดตั้ง:
```powershell
ngrok config add-authtoken <your-token>
```

### Step 3: สร้าง Tunnel

```powershell
ngrok http http://<ESP_IP>:8080
```

จะได้ URL เช่น `https://xxxx.ngrok-free.app`

### Step 4: ดูจากนอกบ้าน

เปิด browser → `https://xxxx.ngrok-free.app` → เห็นภาพสดจาก ESP32-CAM

### Step 5: ใน Dashboard

ไปที่ `/stream` → ใส่ ngrok URL → ดูสดใน Dashboard

### Architecture

```
ESP32-CAM (192.168.x.x:8080)  →  HTTP snapshot server
    ↑                                  ↓
  Wi-Fi                           ngrok tunnel
                                   ↓
                         https://xxxx.ngrok-free.app
                                   ↓
                          Dashboard /stream page
```

### ข้อควรระวัง

- ใช้ framesize ต่ำ (8 = VGA max) เพื่อลด lag
- ngrok free tier มี limit bandwidth
- ESP32 ต้องอยู่บน Wi-Fi เดียวกับ PC
