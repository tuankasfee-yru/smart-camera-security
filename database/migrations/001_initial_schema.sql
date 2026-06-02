create table if not exists system_config (
  id uuid primary key default gen_random_uuid(),
  device_id text not null unique,
  is_armed boolean not null default true,
  is_muted boolean not null default false,
  trigger_distance_cm integer not null default 50,
  last_heartbeat_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists event_logs (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  detected_at timestamptz not null,
  distance_cm numeric,
  image_filename text,
  video_filename text,
  telegram_message_id text,
  created_at timestamptz not null default now()
);

create table if not exists device_commands (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  command_type text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  executed_at timestamptz
);

create table if not exists command_results (
  id uuid primary key default gen_random_uuid(),
  command_id uuid references device_commands(id) on delete cascade,
  device_id text not null,
  success boolean not null,
  message text,
  created_at timestamptz not null default now()
);

create index if not exists idx_event_logs_device_time
on event_logs(device_id, detected_at desc);

create index if not exists idx_device_commands_status
on device_commands(device_id, status, created_at asc);

insert into system_config (device_id, is_armed, is_muted, trigger_distance_cm)
values ('esp32cam-01', true, false, 50)
on conflict (device_id) do nothing;
