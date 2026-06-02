interface DeviceState {
  is_armed: boolean;
  is_muted: boolean;
  trigger_distance_cm: number;
  last_heartbeat: string | null;
  device_ip: string | null;
  free_mem: number;
  event_count: number;
  events: Array<{ id: string; device_id: string; detected_at: string; distance_cm: number | null; image_filename: string | null }>;
}

const defaults: DeviceState = {
  is_armed: true, is_muted: false, trigger_distance_cm: 50,
  last_heartbeat: null, device_ip: null, free_mem: 0, event_count: 0, events: [],
};

const store: Record<string, DeviceState> = {};

function ensure(deviceId: string): DeviceState {
  if (!store[deviceId]) store[deviceId] = { ...defaults };
  return store[deviceId];
}

export function getDevice(deviceId: string): DeviceState { return ensure(deviceId); }

export function updateHeartbeat(deviceId: string, deviceIp?: string): void {
  const d = ensure(deviceId);
  d.last_heartbeat = new Date().toISOString();
  if (deviceIp) d.device_ip = deviceIp;
}

export function updateConfig(deviceId: string, config: Partial<DeviceState>): void {
  Object.assign(ensure(deviceId), config);
}

export function addEvent(deviceId: string, event: { detected_at: string; distance_cm: number | null; image_filename: string | null }): string {
  const d = ensure(deviceId);
  const id = Date.now().toString(36);
  d.events.unshift({ id, device_id: deviceId, ...event });
  d.event_count = d.events.length;
  return id;
}

let _commands: any[] = [];
export function addCommand(deviceId: string, command_type: string): string {
  const id = Date.now().toString(36);
  _commands.push({ id, device_id: deviceId, command_type, status: 'pending', created_at: new Date().toISOString() });
  return id;
}
export function getCommands(deviceId: string): any[] {
  return _commands.filter(c => c.device_id === deviceId && c.status === 'pending');
}
export function completeCommand(id: string): void {
  const c = _commands.find(c => c.id === id);
  if (c) c.status = 'done';
}
