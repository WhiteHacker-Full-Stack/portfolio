'use client';

import { useEffect, useState } from 'react';
import { s } from '@/lib/css';
import { readSession } from '@/lib/session';

const VIEW =
  "cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 8px 14px; border-radius: 7px; color: #E8EDF2;";
const DOWNLOAD =
  "cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; background: #F5F7FA; color: #0B0F14; padding: 8px 14px; border-radius: 7px;";

/** Yuklab olish faqat kirgan foydalanuvchilar uchun; ko'rish hammaga ochiq. */
export function DocActions({ fileUrl }: { fileUrl: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    const sync = () => setSignedIn(Boolean(readSession()));
    sync();
    window.addEventListener('wh-session', sync);
    return () => window.removeEventListener('wh-session', sync);
  }, []);

  return (
    <span style={s('display: flex; gap: 10px; align-items: center;')}>
      <a href={fileUrl} target="_blank" rel="noreferrer" className="h-cyan f2" style={s(VIEW)}>
        Ko&apos;rish
      </a>

      {signedIn === false ? (
        <span
          title="Yuklab olish uchun chapdagi 'Kirish' tugmasi orqali hisobingizga kiring"
          style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px dashed #26323D; padding: 8px 14px; border-radius: 7px; color: #4a5764; cursor: not-allowed;")}
        >
          Yuklab olish — kirish kerak
        </span>
      ) : (
        <a
          href={fileUrl}
          download
          className="h-white f2"
          style={{ ...s(DOWNLOAD), ...(signedIn === null ? { opacity: 0.5 } : {}) }}
        >
          Yuklab olish
        </a>
      )}
    </span>
  );
}
