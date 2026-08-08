'use client';

import { useCallback, useEffect, useState } from 'react';
import { Overlay } from '@/components/Overlay';
import type { Comment } from '@/lib/api';
import { s } from '@/lib/css';
import { getDeviceToken } from '@/lib/device';
import { uzDate } from '@/lib/format';

export function Comments({
  slug,
  targetPostId,
  initialComments,
}: {
  slug: string;
  targetPostId: string | null;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState(initialComments);
  const [username, setUsername] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [nameModal, setNameModal] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const token = getDeviceToken();
    fetch(`/api/visitors/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data && setUsername(data.username))
      .catch(() => undefined);
  }, []);

  const refresh = useCallback(async () => {
    const res = await fetch(`/api/projects/${slug}/comments`);
    if (res.ok) setComments(await res.json());
  }, [slug]);

  async function submit() {
    if (!targetPostId || !draft.trim()) return;
    if (!username) {
      setNameModal(true);
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/posts/${targetPostId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceToken: getDeviceToken(), username, text: draft.trim() }),
    });
    setBusy(false);
    if (!res.ok) {
      setError((await res.json().catch(() => ({}))).error ?? 'Izohni yuborib boʻlmadi');
      return;
    }
    setDraft('');
    await refresh();
  }

  async function saveName() {
    const name = nameDraft.trim() || 'Mehmon';
    const res = await fetch(`/api/visitors/${getDeviceToken()}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: name }),
    });
    if (!res.ok) {
      setError('Ismni saqlab boʻlmadi');
      return;
    }
    setUsername(name);
    setNameModal(false);
    setNameDraft('');
    // Past comments point at the same visitor, so they now show the new name.
    await refresh();
  }

  return (
    <div style={s('border-top: 1px solid #26323D; padding-top: 28px; display: flex; flex-direction: column; gap: 18px;')}>
      <h2 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 18px;")}>
        Izohlar
      </h2>

      {targetPostId ? (
        <div style={s('border: 1px solid #26323D; background: #141C24; border-radius: 10px; padding: 18px; display: flex; flex-direction: column; gap: 12px;')}>
          <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px;')}>
            <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}>
              {username ? `siz: ${username}` : 'izoh yozish uchun ismingizni kiritasiz'}
            </span>
            <button
              type="button"
              onClick={() => {
                setNameDraft(username ?? '');
                setNameModal(true);
              }}
              className="h-txt f2"
              style={s("all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF;")}
            >
              Ismni o&apos;zgartirish
            </button>
          </div>
          <textarea
            placeholder="Fikringizni yozing…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            className="f1-border"
            style={s('background: #0F1720; border: 1px solid #26323D; border-radius: 8px; color: #E8EDF2; font-size: 14px; line-height: 1.6; padding: 12px; min-height: 84px; resize: vertical;')}
          />
          {error && (
            <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #ff6b6b;")}>
              {error}
            </span>
          )}
          <button
            type="button"
            onClick={submit}
            disabled={busy}
            className="h-white f3"
            style={s("all: unset; cursor: pointer; align-self: flex-start; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 7px;")}
          >
            {busy ? 'Yuborilmoqda…' : 'Izohni yuborish'}
          </button>
        </div>
      ) : (
        <div style={s('font-size: 14px; color: #8B99A6; padding: 8px 0;')}>
          Bu loyihada hali jurnal yozuvi yo&apos;q — izoh qoldirish uchun avval yozuv kerak.
        </div>
      )}

      {comments.length === 0 && (
        <div style={s('font-size: 14px; color: #8B99A6; padding: 8px 0;')}>
          Hali izoh yo&apos;q — birinchi bo&apos;lib fikringizni yozing.
        </div>
      )}

      <div style={s('display: flex; flex-direction: column; gap: 12px;')}>
        {comments.map((comment) => (
          <div
            key={comment.id}
            style={s('border: 1px solid #26323D; border-radius: 10px; padding: 15px 16px; display: flex; flex-direction: column; gap: 7px; background: #0F1720;')}
          >
            <span style={s('display: flex; gap: 10px; align-items: baseline;')}>
              <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 13px; color: #4FD1FF;")}>
                {comment.username}
              </span>
              <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5764;")}>
                {uzDate(comment.createdAt)}
              </span>
            </span>
            <span style={s('font-size: 14px; line-height: 1.6; color: #E8EDF2;')}>{comment.text}</span>
          </div>
        ))}
      </div>

      {nameModal && (
        <Overlay onClose={() => setNameModal(false)}>
          <div style={s('width: 366px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 14px;')}>
            <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px;")}>
              Ismingizni kiriting
            </span>
            <span style={s('font-size: 13px; line-height: 1.6; color: #8B99A6;')}>
              Izohlaringiz shu nom ostida ko&apos;rinadi. Keyinroq o&apos;zgartirsangiz bo&apos;ladi.
            </span>
            <input
              placeholder="Ismingiz?"
              value={nameDraft}
              autoFocus
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveName()}
              className="f1"
              style={s('background: #141C24; border: 1px solid #26323D; border-radius: 8px; padding: 11px 13px; color: #E8EDF2; font-size: 14px;')}
            />
            <button
              type="button"
              onClick={saveName}
              className="h-white f3"
              style={s("all: unset; cursor: pointer; align-self: flex-end; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 7px;")}
            >
              Davom etish
            </button>
          </div>
        </Overlay>
      )}
    </div>
  );
}
