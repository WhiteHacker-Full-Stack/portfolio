const TOKEN_KEY = 'wh.adminToken';

export class Unauthorized extends Error {}

export function getAdminToken(): string | null {
  return typeof window === 'undefined' ? null : localStorage.getItem(TOKEN_KEY);
}

export function setAdminToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(TOKEN_KEY);
}

export async function adminFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  const token = getAdminToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);
  // FormData bodies need the browser to set the multipart boundary itself.
  if (init.body && typeof init.body === 'string') headers.set('Content-Type', 'application/json');

  const res = await fetch(`/api/admin${path}`, { ...init, headers });
  if (res.status === 401) {
    clearAdminToken();
    throw new Unauthorized('Sessiya tugadi — qaytadan kiring');
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error ?? 'Xatolik yuz berdi');
  return data as T;
}
