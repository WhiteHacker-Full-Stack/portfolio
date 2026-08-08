const KEY = 'wh.deviceToken';

/** Stable per-browser id used to tie comments to a visitor without any login. */
export function getDeviceToken(): string {
  const existing = localStorage.getItem(KEY);
  if (existing) return existing;
  const token = crypto.randomUUID();
  localStorage.setItem(KEY, token);
  return token;
}
