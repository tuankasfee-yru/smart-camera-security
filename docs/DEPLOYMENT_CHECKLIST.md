# Production Deployment Checklist

## ก่อน Deploy

- [ ] สร้าง Supabase project → รัน `001_initial_schema.sql`
- [ ] ตั้งค่า environment variables ใน Vercel
- [ ] ทดสอบ API routes ด้วย curl
- [ ] ตรวจสอบ Dashboard UI ทำงาน

## Vercel Deployment

```bash
cd web
npx vercel
```

## Environment Variables (Vercel)

```
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DEVICE_API_SECRET=<your-secret-string>
TELEGRAM_BOT_TOKEN=<optional>
NEXT_PUBLIC_SITE_URL=https://your-app.vercel.app
DASHBOARD_PASSWORD=<optional-for-auth>
```

## ESP32 Configuration

```python
# config.py
CLOUD_BASE_URL = 'https://your-app.vercel.app'
DEVICE_API_SECRET = '<same-as-vercel>'
```

## Post-Deploy Tests

- [ ] `https://your-app.vercel.app` → Dashboard loads
- [ ] `https://your-app.vercel.app/api/health` → `{"ok":true}`
- [ ] `POST /api/heartbeat` with secret → 200
- [ ] ESP32 sends heartbeat → Dashboard shows 🟢
- [ ] ESP32 posts event → Dashboard log updates

## Security

- [ ] RLS เปิดใช้งาน (รัน `002_rls_policies.sql`)
- [ ] Dashboard password ตั้งค่าแล้ว (ถ้าต้องการ)
- [ ] ไม่ expose service_role key ใน client

## Monitoring

- ตรวจสอบ Vercel Analytics
- ตรวจสอบ Supabase Dashboard → SQL Editor
- ตรวจสอบ ESP32 Serial output
