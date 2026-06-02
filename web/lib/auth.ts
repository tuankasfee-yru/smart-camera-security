export function validateDeviceSecret(request: Request): boolean {
  const secret = request.headers.get("X-Device-Secret");
  const expected = process.env.DEVICE_API_SECRET;
  if (!expected) return false;
  return secret === expected;
}
