# คู่มือการตั้งค่าระบบ Smart Cam Security

## ภาพรวม

```
ESP32-CAM ←→ Wi-Fi ←→ Next.js/Vercel ←→ Supabase
                ↓
           Telegram Bot
```

## 1. DEVICE_API_SECRET คืออะไร?

เป็นรหัสผ่านที่คุณ**ตั้งเอง** ใช้สำหรับ ESP32-CAM ยืนยันตัวตนกับ API

**วิธีตั้งค่า:**

1. คิดรหัสผ่านขึ้นมา เช่น `cam-secret-abc123`
2. ใส่ใน ESP32 `config.py`:
```python
DEVICE_API_SECRET = 'cam-secret-abc123'
```
3. ใส่ใน Vercel Environment Variables (หรือ `.env.local` ตอน dev):
```
DEVICE_API_SECRET=cam-secret-abc123
```

> ถ้ายังไม่ deploy จริง ให้ใช้ `your-secret` ไปก่อน — API จะเช็คแค่ dev mode แต่ ESP32 ยังส่งไม่ได้

---

## 2. Supabase ตั้งค่าอย่างไร?

### ขั้นตอน

1. ไปที่ https://supabase.com → Sign up (ฟรี)
2. สร้างโปรเจคใหม่
3. ไปที่ **SQL Editor** → วางโค้ดจาก `database/migrations/001_initial_schema.sql`
4. กด Run

### เอา API Keys

ไปที่ **Settings → API**:
- `Project URL` → ใส่ใน `NEXT_PUBLIC_SUPABASE_URL`
- `anon public key` → ใส่ใน `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role key` → ใส่ใน `SUPABASE_SERVICE_ROLE_KEY` (ห้ามเปิดเผย!)

### ใส่ใน Vercel (หรือ `.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
DEVICE_API_SECRET=cam-secret-abc123
```

### โค้ดฐานข้อมูล

อยู่ที่ `database/migrations/001_initial_schema.sql` — 4 ตาราง:
- `system_config` — ตั้งค่าระบบ + heartbeat
- `event_logs` — บันทึกการตรวจจับ
- `device_commands` — คิวคำสั่ง
- `command_results` — ผลลัพธ์คำสั่ง

---

## 3. CLOUD_BASE_URL ตอนกำลังพัฒนาคืออะไร?

| สถานะ | URL |
|---|---|
| **Dev ในเครื่อง** | `http://<IP เครื่องคุณ>:3000` เช่น `http://192.168.1.100:3000` |
| **Vercel Preview** | `https://xxxxx.vercel.app` (ได้หลัง deploy) |
| **Vercel Production** | `https://your-domain.vercel.app` |

### วิธีหา IP เครื่อง

```powershell
ipconfig
```

หาบรรทัด `IPv4 Address` ของ Wi-Fi adapter → ใช้เป็น URL

### ตั้งค่า ESP32 ตอน dev

```python
# config.py (บน ESP32)
CLOUD_BASE_URL = 'http://192.168.1.100:3000'
DEVICE_API_SECRET = 'your-secret'  # ตั้งอะไรก็ได้ตอน dev
```

> **สำคัญ:** ESP32 ใช้ `http://` ไม่ใช่ `https://` ถ้าคุณรัน Next.js แบบ dev server (ไม่มี SSL)

---

## 4. ลำดับการตั้งค่าทั้งหมด

1. ✅ ESP32-CAM firmware พร้อม (Phase 1-4)
2. ⬜ สร้าง Supabase project → รัน SQL → เอา keys
3. ⬜ ใส่ `.env.local` ใน `web/`:
   ```
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_ANON_KEY=
   SUPABASE_SERVICE_ROLE_KEY=
   DEVICE_API_SECRET=
   ```
4. ⬜ Deploy ไป Vercel:
   ```bash
   cd web
   npx vercel
   ```
5. ⬜ เอา Vercel URL → ใส่ใน ESP32 `config.py` เป็น `CLOUD_BASE_URL`
6. ⬜ ESP32 เริ่มส่ง heartbeat + event ไป cloud

---

## 5. คำถามที่พบบ่อย

**Q: ยังไม่มี Supabase ใช้ได้ไหม?**
A: ได้ — Dashboard ทำงานได้โดยไม่ต้องมี Supabase (แสดงค่าดีฟอลต์)

**Q: ESP32 ไม่ส่งข้อมูลไป cloud?**
A: ต้องตั้งค่า `CLOUD_BASE_URL` และ `DEVICE_API_SECRET` ใน `config.py` ก่อน

**Q: ESP32 ใช้ `https://` ไม่ได้?**
A: ESP32 firmware นี้ใช้ SSL ได้ (เห็นจาก Telegram) — แต่ dev server เป็น HTTP ต้องใช้ `http://`
