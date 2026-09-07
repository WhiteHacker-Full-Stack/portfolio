const USER_KEY = 'wh.user';
const ADMIN_KEY = 'wh.adminToken';

export type Session = { role: 'admin' | 'user'; token: string; name: string; username: string };

export function readSession(): Session | null {
  if (typeof window === 'undefined') return null;
  // Admin tokeni alohida kalitda — admin paneli o'sha bilan ishlaydi.
  const adminToken = localStorage.getItem(ADMIN_KEY);
  if (adminToken) {
    return { role: 'admin', token: adminToken, name: 'admin', username: 'admin' };
  }
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

export function saveSession(session: Session) {
  if (session.role === 'admin') {
    localStorage.setItem(ADMIN_KEY, session.token);
    localStorage.removeItem(USER_KEY);
  } else {
    localStorage.setItem(USER_KEY, JSON.stringify(session));
    localStorage.removeItem(ADMIN_KEY);
  }
  window.dispatchEvent(new Event('wh-session'));
}

export function clearSession() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(ADMIN_KEY);
  window.dispatchEvent(new Event('wh-session'));
}
