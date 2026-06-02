-- Add device_ip column for ESP32 IP tracking
alter table system_config add column if not exists device_ip text;
