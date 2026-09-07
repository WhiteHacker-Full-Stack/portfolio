'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Overlay } from '@/components/Overlay';
import { s } from '@/lib/css';
import { clearSession, readSession, saveSession, type Session } from '@/lib/session';

const INPUT =
  'background: #141C24; border: 1px solid #26323D; border-radius: 8px; padding: 11px 13px; color: #E8EDF2; font-size: 14px;';
const PRIMARY =
  "all: unset; cursor: pointer; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 7px;";
const GHOST =
  "all: unset; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 10px 16px; border-radius: 7px; color: #8B99A6;";

/**
 * Yagona kirish oynasi. Tashqaridan "admin" degan narsa ko'rinmaydi —
 * kiritilgan ma'lumot admin hisobiga mos kelsa, server o'zi admin deb qaytaradi.
 */
export function AuthPanel() {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const sync = () => setSession(readSession());
    sync();
    window.addEventListener('wh-session', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('wh-session', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(
          mode === 'register' ? { name, username, password } : { username, password },
        ),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Xatolik yuz berdi');
        return;
      }

      const next: Session = {
        role: data.role ?? 'user',
        token: data.token,
        name: data.name,
        username: data.username,
      };
      saveSession(next);
      setOpen(false);
      setPassword('');
      if (next.role === 'admin') router.push('/admin');
    } catch {
      setError('Serverga ulanib boʻlmadi');
    } finally {
      setBusy(false);
    }
  }

  if (session) {
    return (
      <div style={s('display: flex; flex-direction: column; gap: 6px;')}>
        <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF; letter-spacing: 0.04em;")}>
          {session.name}
        </span>
        <div style={s('display: flex; gap: 10px;')}>
          {session.role === 'admin' && (
            <button
              type="button"
              onClick={() => router.push('/admin')}
              className="h-dim f2"
              style={s("all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5764;")}
            >
              panel
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              clearSession();
              router.push('/');
            }}
            className="h-dim f2"
            style={s("all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5764;")}
          >
            chiqish
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setError(null);
        }}
        className="h-cyan f2"
        style={s("all: unset; cursor: pointer; text-align: center; border: 1px solid #26323D; border-radius: 8px; padding: 9px 0; font-family: 'JetBrains Mono', monospace; font-size: 12px; color: #8B99A6;")}
      >
        Kirish
      </button>

      {open && (
        <Overlay onClose={() => setOpen(false)}>
          <div style={s('width: 372px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 26px; display: flex; flex-direction: column; gap: 16px;')}>
            <div style={s('display: flex; flex-direction: column; gap: 6px;')}>
              <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 17px;")}>
                {mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
              </span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                {mode === 'login'
                  ? 'hisobingiz bilan kiring'
                  : 'hujjatlarni yuklab olish uchun hisob kerak'}
              </span>
            </div>

            {mode === 'register' && (
              <input
                placeholder="Ismingiz"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="f1"
                style={s(INPUT)}
                autoFocus
              />
            )}
            <input
              placeholder="Foydalanuvchi nomi"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="f1"
              style={s(INPUT)}
              autoFocus={mode === 'login'}
            />
            <input
              type="password"
              placeholder="Parol"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && submit()}
              className="f1"
              style={s(INPUT)}
            />

            {error && (
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #ff6b6b;")}>
                {error}
              </span>
            )}

            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError(null);
              }}
              className="h-txt f2"
              style={s("all: unset; cursor: pointer; align-self: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF;")}
            >
              {mode === 'login' ? "Hisobingiz yo'qmi? Ro'yxatdan o'ting" : 'Hisobingiz bormi? Kiring'}
            </button>

            <div style={s('display: flex; gap: 10px; justify-content: flex-end;')}>
              <button type="button" onClick={() => setOpen(false)} className="h-txt f2" style={s(GHOST)}>
                Bekor qilish
              </button>
              <button type="button" onClick={submit} disabled={busy} className="h-white f3" style={s(PRIMARY)}>
                {busy ? 'Tekshirilmoqda…' : mode === 'login' ? 'Kirish' : "Ro'yxatdan o'tish"}
              </button>
            </div>
          </div>
        </Overlay>
      )}
    </>
  );
}
