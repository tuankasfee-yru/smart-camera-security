# Next.js API Specification

## Platform

- Framework: Next.js App Router
- Deployment: Vercel
- Database: Supabase PostgreSQL

## Auth Header for ESP32-CAM

All device API calls must include:

```http
X-Device-Secret: <DEVICE_API_SECRET>
```

## API Routes

### POST `/api/log`

Device sends a new detection event.

Request:

```json
{
  "device_id": "esp32cam-01",
  "detected_at": "2026-05-12T18:30:22+07:00",
  "distance_cm": 43,
  "image_filename": "motion_20260512_183022.jpg",
  "video_filename": null
}
```

Response:

```json
{
  "ok": true,
  "event_id": "uuid"
}
```

### GET `/api/status`

Device or dashboard reads current status.

Response:

```json
{
  "ok": true,
  "is_armed": true,
  "is_muted": false,
  "trigger_distance_cm": 50
}
```

### POST `/api/status`

Dashboard updates system status.

Request:

```json
{
  "is_armed": false,
  "is_muted": false,
  "trigger_distance_cm": 50
}
```

### GET `/api/commands`

Device fetches pending commands.

Query:

```text
/api/commands?device_id=esp32cam-01
```

Response:

```json
{
  "ok": true,
  "commands": [
    {
      "id": "uuid",
      "command_type": "disarm",
      "payload": {}
    }
  ]
}
```

### POST `/api/commands`

Dashboard or Telegram creates a command.

Request:

```json
{
  "device_id": "esp32cam-01",
  "command_type": "disarm",
  "payload": {}
}
```

### POST `/api/commands/result`

Device reports command result.

Request:

```json
{
  "command_id": "uuid",
  "device_id": "esp32cam-01",
  "success": true,
  "message": "System disarmed"
}
```

### POST `/api/telegram/callback`

Receives Telegram inline button callbacks.

Behavior:

1. Validate Telegram callback data.
2. Convert callback into device command.
3. Store command in Supabase.
4. Respond to Telegram if needed.

### GET `/api/status`

Response now includes: `device_id`, `online`, `last_heartbeat` in addition to original fields.

### POST `/api/heartbeat`

Device sends periodic heartbeat (every 60s).

Request: `{ "device_id": "esp32cam-01" }`

### GET `/api/health`

Public health check. Returns `{ "ok": true, "status": "healthy", "database": "connected", "uptime": <sec> }`

## Validation Rules

- `device_id` is required.
- `distance_cm` must be number.
- `command_type` must be allowed enum.
- Reject requests without device secret.
- Return JSON consistently.

## Allowed Commands

```text
arm
disarm
mute
unmute
delete_latest_file
cleanup_sd
capture_snapshot
```

## Vercel Rule

Do not implement long-running MJPEG streaming in API routes.
