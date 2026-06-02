# Next Tasks

## Current Phase

Phase 6: Dashboard MVP — DONE. Ready for deploy.

## All Phases Complete

| Phase | Status |
|---|---|
| 1: Firmware Bring-Up | ✅ |
| 2: Sensor + Flash + Trigger | ✅ |
| 3: Telegram Alert | ✅ |
| 4: SD Card + Full Pipeline | ✅ |
| 5: Next.js API + Supabase | ✅ |
| 6: Dashboard MVP | ✅ |

## Tests

```
✓ lib/auth.test.ts      (4 tests)
✓ lib/api.test.ts       (7 tests)
✓ lib/dashboard.test.ts (5 tests)
16 passed | TypeScript: clean
```

## Dashboard Features

- System status (armed/disarmed, muted, threshold)
- Event log table with timestamp, distance, filename
- Arm / Disarm / Mute / Unmute buttons
- Manual refresh
- Loading, empty, and error states
- Dark mode support
- Responsive layout

## Active Task: Deploy

1. Set up Supabase project → run `database/migrations/001_initial_schema.sql`
2. Add `.env.local` in `web/` with real Supabase keys
3. Deploy to Vercel: `vercel --cwd web`
4. Update `firmware/lib/cloud_api.py` for ESP32→cloud communication

## Do Not Work On Yet

AVI recording, live streaming
