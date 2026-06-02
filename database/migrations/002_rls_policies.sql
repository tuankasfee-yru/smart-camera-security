-- RLS policies for production
-- Run in Supabase SQL Editor after creating tables

-- Enable RLS
alter table system_config enable row level security;
alter table event_logs enable row level security;
alter table device_commands enable row level security;
alter table command_results enable row level security;

-- Service role bypasses RLS (API routes)
-- No additional policies needed — API routes use service_role key

-- Optional: restrict public anon key access
create policy "anon_read_status"
on system_config for select
using (true);

create policy "anon_read_events"
on event_logs for select
using (true);
