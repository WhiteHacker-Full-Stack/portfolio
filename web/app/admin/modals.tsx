'use client';

import { useState } from 'react';
import { Overlay } from '@/components/Overlay';
import type { Post, Project } from '@/lib/api';
import { s } from '@/lib/css';
import { extractYoutubeId } from '@/lib/youtubeId';

const INPUT = 'background: #141C24; border: 1px solid #26323D; border-radius: 8px; padding: 11px 13px; color: #E8EDF2; font-size: 14px;';
const CANCEL_BTN = "all: unset; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 12px; border: 1px solid #26323D; padding: 10px 16px; border-radius: 7px; color: #8B99A6;";
const SAVE_BTN = "all: unset; cursor: pointer; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 7px;";
const FOOTER = 'display: flex; gap: 10px; justify-content: flex-end;';

function ErrorLine({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #ff6b6b;")}>
      {message}
    </span>
  );
}

export function LoginModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (username: string, password: string) => Promise<string | null>;
}) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit() {
    setBusy(true);
    setError(await onSubmit(username, password));
    setBusy(false);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 372px; border: 1px solid #4FD1FF; background: #0F1720; border-radius: 12px; padding: 26px; display: flex; flex-direction: column; gap: 18px;')}>
        <div style={s('display: flex; flex-direction: column; gap: 6px;')}>
          <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 17px;")}>
            Admin kirish
          </span>
          <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
            faqat sayt egasi uchun
          </span>
        </div>
        <input
          placeholder="Username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="f1"
          style={s(INPUT)}
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
        <ErrorLine message={error} />
        <div style={s(FOOTER)}>
          <button type="button" onClick={onClose} className="h-txt f2" style={s(CANCEL_BTN)}>
            Bekor qilish
          </button>
          <button type="button" onClick={submit} disabled={busy} className="h-white f3" style={s(SAVE_BTN)}>
            {busy ? 'Tekshirilmoqda…' : 'Kirish'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export type ProjectDraft = {
  title: string;
  category: string;
  status: string;
  description: string;
  tech: string;
  repoUrl: string;
  cover: File | null;
};

export function ProjectModal({
  project,
  onClose,
  onSave,
}: {
  project: Project | null;
  onClose: () => void;
  onSave: (draft: ProjectDraft) => Promise<string | null>;
}) {
  const [title, setTitle] = useState(project?.title ?? '');
  const [category, setCategory] = useState(project?.category ?? 'MANUAL');
  const [status, setStatus] = useState(project?.status ?? 'LIVE');
  const [description, setDescription] = useState(project?.description ?? '');
  const [tech, setTech] = useState(project?.tech.join(', ') ?? '');
  const [repoUrl, setRepoUrl] = useState(project?.repoUrl ?? '');
  const [cover, setCover] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    setError(await onSave({ title, category, status, description, tech, repoUrl, cover }));
    setBusy(false);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 540px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 26px; display: flex; flex-direction: column; gap: 16px;')}>
        <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 17px;")}>
          {project ? 'Loyihani tahrirlash' : "Yangi loyiha qo'shish"}
        </span>
        <input
          placeholder="Loyiha nomi"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="f1"
          style={s(INPUT)}
        />
        <div style={s('display: grid; grid-template-columns: 1fr 1fr; gap: 12px;')}>
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="f1" style={s(INPUT)}>
            <option value="MANUAL">Qo&apos;lda qilingan</option>
            <option value="AI">AI bilan</option>
            <option value="STARTUP">Startap</option>
          </select>
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="f1" style={s(INPUT)}>
            <option value="LIVE">Live</option>
            <option value="IN_PROGRESS">Ishlab chiqilmoqda</option>
            <option value="ARCHIVED">Arxiv</option>
          </select>
        </div>
        <textarea
          placeholder="Qisqa tavsif"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="f1"
          style={s(`${INPUT} min-height: 88px; resize: vertical;`)}
        />
        <input
          placeholder="Texnologiyalar — vergul bilan (Next.js, Prisma)"
          value={tech}
          onChange={(e) => setTech(e.target.value)}
          className="f1"
          style={s(INPUT)}
        />
        <input
          placeholder="GitHub havolasi (ixtiyoriy)"
          value={repoUrl}
          onChange={(e) => setRepoUrl(e.target.value)}
          className="f1"
          style={s(`${INPUT} font-family: 'IBM Plex Mono', monospace;`)}
        />
        <label style={s("border: 1px dashed #26323D; border-radius: 8px; padding: 22px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; cursor: pointer; display: block;")}>
          {cover ? cover.name : 'cover rasmni bu yerga tashlang — 1200×630'}
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
          />
        </label>
        <ErrorLine message={error} />
        <div style={s(`${FOOTER} padding-top: 4px;`)}>
          <button type="button" onClick={onClose} className="h-txt f2" style={s(CANCEL_BTN)}>
            Bekor qilish
          </button>
          <button type="button" onClick={save} disabled={busy} className="h-white f3" style={s(SAVE_BTN)}>
            {busy ? 'Saqlanmoqda…' : 'Saqlash'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function PostModal({
  projects,
  onClose,
  onSave,
}: {
  projects: Project[];
  onClose: () => void;
  onSave: (draft: {
    projectId: string;
    title: string;
    content: string;
    image: File | null;
    sendToTelegram: boolean;
  }) => Promise<string | null>;
}) {
  const [projectId, setProjectId] = useState(projects[0]?.id ?? '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(sendToTelegram: boolean) {
    setBusy(true);
    setError(await onSave({ projectId, title, content, image, sendToTelegram }));
    setBusy(false);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 580px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 26px; display: flex; flex-direction: column; gap: 16px;')}>
        <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 17px;")}>
          Yangi blog-yozuv
        </span>
        <select value={projectId} onChange={(e) => setProjectId(e.target.value)} className="f1" style={s(INPUT)}>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.title}
            </option>
          ))}
        </select>
        <input
          placeholder="Sarlavha"
          autoFocus
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="f1"
          style={s(INPUT)}
        />
        <div style={s('border: 1px solid #26323D; border-radius: 8px; overflow: hidden;')}>
          <label style={s("display: flex; gap: 8px; align-items: center; padding: 7px 9px; background: #141C24; border-bottom: 1px solid #26323D; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; cursor: pointer;")}>
            {image ? image.name : 'rasm biriktirish'}
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => setImage(e.target.files?.[0] ?? null)}
            />
          </label>
          <textarea
            placeholder="Yozuv matni…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="fin"
            style={s('width: 100%; background: #141C24; border: 0; padding: 13px; color: #E8EDF2; font-size: 14px; min-height: 132px; resize: vertical;')}
          />
        </div>
        <ErrorLine message={error} />
        <div style={s(FOOTER)}>
          <button type="button" onClick={() => save(false)} disabled={busy} className="h-txt f2" style={s(CANCEL_BTN)}>
            Faqat saqlash
          </button>
          <button type="button" onClick={() => save(true)} disabled={busy} className="h-white f3" style={s(SAVE_BTN)}>
            {busy ? 'Saqlanmoqda…' : "Saqlash va Telegram'ga yubor"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function TelegramModal({
  post,
  onClose,
  onSend,
}: {
  post: Post;
  onClose: () => void;
  onSend: () => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function send() {
    setBusy(true);
    const result = await onSend();
    setBusy(false);
    setError(result);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 440px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px;')}>
        <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px;")}>
          Telegram kanalga yuborishni tasdiqlang
        </span>
        <div style={s('border: 1px solid #26323D; border-radius: 10px; background: #141C24; overflow: hidden;')}>
          <div
            style={{
              ...s("height: 118px; background-color: #0F1720; background-image: repeating-linear-gradient(135deg, rgba(79,209,255,0.10) 0 6px, transparent 6px 14px); display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8B99A6;"),
              ...(post.image
                ? {
                    backgroundImage: `url(${post.image})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }
                : {}),
            }}
          >
            {post.image ? '' : 'post rasmi yo‘q'}
          </div>
          <div style={s('padding: 14px 16px 16px; display: flex; flex-direction: column; gap: 8px;')}>
            <span style={s('font-weight: 600; font-size: 14px;')}>{post.title}</span>
            <span style={s('font-size: 13px; line-height: 1.6; color: #8B99A6;')}>
              {post.content.length > 300 ? `${post.content.slice(0, 300)}…` : post.content}
            </span>
            <span style={s("align-self: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 11px; border: 1px solid #4FD1FF; color: #4FD1FF; padding: 6px 12px; border-radius: 6px;")}>
              Batafsil
            </span>
          </div>
        </div>
        <ErrorLine message={error} />
        <div style={s(FOOTER)}>
          <button type="button" onClick={onClose} className="h-txt f2" style={s(CANCEL_BTN)}>
            Bekor qilish
          </button>
          <button type="button" onClick={send} disabled={busy} className="h-white f3" style={s(SAVE_BTN)}>
            {busy ? 'Yuborilmoqda…' : 'Yuborish'}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function VideoModal({
  onClose,
  onSave,
}: {
  onClose: () => void;
  onSave: (draft: { youtubeUrl: string; title: string }) => Promise<string | null>;
}) {
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const videoId = extractYoutubeId(youtubeUrl);

  async function save() {
    setBusy(true);
    setError(await onSave({ youtubeUrl, title }));
    setBusy(false);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 440px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 16px;')}>
        <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px;")}>
          YouTube video qo&apos;shish
        </span>
        <input
          placeholder="https://youtube.com/watch?v=…"
          autoFocus
          value={youtubeUrl}
          onChange={(e) => setYoutubeUrl(e.target.value)}
          className="f1"
          style={s(`${INPUT} font-family: 'IBM Plex Mono', monospace;`)}
        />
        <input
          placeholder="Video sarlavhasi"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="f1"
          style={s(INPUT)}
        />
        <div
          style={{
            ...s("aspect-ratio: 16/9; border-radius: 10px; border: 1px solid #26323D; background-color: #0F1720; background-image: repeating-linear-gradient(135deg, rgba(79,209,255,0.10) 0 6px, transparent 6px 14px); display: flex; align-items: center; justify-content: center; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #8B99A6;"),
            ...(videoId
              ? {
                  backgroundImage: `url(https://i.ytimg.com/vi/${videoId}/hqdefault.jpg)`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : {}),
          }}
        >
          {videoId ? '' : 'thumbnail preview link kiritilgach chiqadi'}
        </div>
        <ErrorLine message={error} />
        <div style={s(FOOTER)}>
          <button type="button" onClick={onClose} className="h-txt f2" style={s(CANCEL_BTN)}>
            Bekor qilish
          </button>
          <button type="button" onClick={save} disabled={busy} className="h-white f3" style={s(SAVE_BTN)}>
            {busy ? 'Qo‘shilmoqda…' : "Qo'shish"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}

export function DeleteModal({
  label,
  onClose,
  onConfirm,
}: {
  label: string;
  onClose: () => void;
  onConfirm: () => Promise<string | null>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function confirm() {
    setBusy(true);
    setError(await onConfirm());
    setBusy(false);
  }

  return (
    <Overlay onClose={onClose}>
      <div style={s('width: 380px; border: 1px solid #26323D; background: #0F1720; border-radius: 12px; padding: 24px; display: flex; flex-direction: column; gap: 14px;')}>
        <span style={s("font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 16px;")}>
          O&apos;chirishni tasdiqlang
        </span>
        <span style={s('font-size: 13px; line-height: 1.6; color: #8B99A6;')}>
          {label} — bu amalni bekor qilib bo&apos;lmaydi.
        </span>
        <ErrorLine message={error} />
        <div style={s(FOOTER)}>
          <button type="button" onClick={onClose} className="h-txt f2" style={s(CANCEL_BTN)}>
            Bekor qilish
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={busy}
            className="h-danger-btn f3"
            style={s("all: unset; cursor: pointer; background: #ff6b6b; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 18px; border-radius: 7px;")}
          >
            {busy ? 'O‘chirilmoqda…' : "O'chirish"}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
