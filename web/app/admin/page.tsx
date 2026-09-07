'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { Comment, Doc, Post, Project, Video } from '@/lib/api';
import { adminFetch, clearAdminToken, getAdminToken, setAdminToken, Unauthorized } from '@/lib/adminApi';
import { s } from '@/lib/css';
import { CATEGORY_LABEL, fileSize, STATUS_COLOR, STATUS_LABEL, uzDate } from '@/lib/format';
import {
  DeleteModal,
  LoginModal,
  PostModal,
  ProjectModal,
  TelegramModal,
  VideoModal,
  VideoUploadModal,
  type ProjectDraft,
} from './modals';

type Section = 'projects' | 'blogs' | 'docs' | 'youtube' | 'comments' | 'settings';

const SECTIONS: { id: Section; label: string; primary: string }[] = [
  { id: 'projects', label: 'Loyihalar', primary: '+ Yangi loyiha' },
  { id: 'blogs', label: 'Bloglar', primary: '+ Yangi yozuv' },
  { id: 'docs', label: 'Hujjatlar', primary: '+ Hujjat yuklash' },
  { id: 'youtube', label: 'YouTube', primary: '+ Video link' },
  { id: 'comments', label: 'Izohlar', primary: 'Yangilash' },
  { id: 'settings', label: 'Sozlamalar', primary: 'Sozlamalar' },
];

const ROW = 'min-width: 680px; display: grid; grid-template-columns: 1.5fr 1fr 1.1fr 1fr 140px; gap: 12px;';
const CARD = 'border: 1px solid #26323D; background: #141C24; border-radius: 10px;';
const LINK_BTN = "all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4FD1FF;";
const DEL_BTN = "all: unset; cursor: pointer; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;";

type Deletion = { label: string; path: string };

export default function AdminPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [section, setSection] = useState<Section>('projects');
  const [error, setError] = useState<string | null>(null);

  const [projects, setProjects] = useState<Project[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [docs, setDocs] = useState<Doc[]>([]);
  const [videos, setVideos] = useState<Video[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);

  const [projectModal, setProjectModal] = useState<{ project: Project | null } | null>(null);
  const [postModal, setPostModal] = useState(false);
  const [videoModal, setVideoModal] = useState(false);
  const [videoUpload, setVideoUpload] = useState(false);
  const [telegramPost, setTelegramPost] = useState<Post | null>(null);
  const [deletion, setDeletion] = useState<Deletion | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    try {
      const [p, b, d, v, c] = await Promise.all([
        adminFetch<Project[]>('/projects'),
        adminFetch<Post[]>('/posts'),
        fetch('/api/documents').then((r) => r.json() as Promise<Doc[]>),
        fetch('/api/youtube').then((r) => r.json() as Promise<Video[]>),
        adminFetch<Comment[]>('/comments'),
      ]);
      setProjects(p);
      setPosts(b);
      setDocs(d);
      setVideos(v);
      setComments(c);
      setError(null);
    } catch (err) {
      if (err instanceof Unauthorized) {
        setLoggedIn(false);
        return;
      }
      setError(err instanceof Error ? err.message : 'Maʼlumotlarni yuklab boʻlmadi');
    }
  }, []);

  useEffect(() => {
    if (!getAdminToken()) {
      setReady(true);
      return;
    }
    adminFetch<{ username: string }>('/me')
      .then(() => setLoggedIn(true))
      .catch(() => clearAdminToken())
      .finally(() => setReady(true));
  }, []);

  useEffect(() => {
    if (loggedIn) void load();
  }, [loggedIn, load]);

  async function login(username: string, password: string): Promise<string | null> {
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) return data.error ?? 'Kirib boʻlmadi';
      setAdminToken(data.token);
      setLoggedIn(true);
      return null;
    } catch {
      return 'Serverga ulanib boʻlmadi';
    }
  }

  function run(action: () => Promise<unknown>) {
    return async (): Promise<string | null> => {
      try {
        await action();
        await load();
        return null;
      } catch (err) {
        if (err instanceof Unauthorized) setLoggedIn(false);
        return err instanceof Error ? err.message : 'Xatolik yuz berdi';
      }
    };
  }

  async function saveProject(draft: ProjectDraft, existing: Project | null): Promise<string | null> {
    const body = new FormData();
    body.set('title', draft.title);
    body.set('category', draft.category);
    body.set('status', draft.status);
    body.set('description', draft.description);
    body.set('tech', draft.tech.split(',').map((t) => t.trim()).filter(Boolean).join(','));
    body.set('repoUrl', draft.repoUrl.trim());
    if (draft.cover) body.set('cover', draft.cover);

    const result = await run(() =>
      adminFetch(existing ? `/projects/${existing.id}` : '/projects', {
        method: existing ? 'PUT' : 'POST',
        body,
      }),
    )();
    if (!result) setProjectModal(null);
    return result;
  }

  async function uploadDocument(file: File) {
    const body = new FormData();
    body.set('title', file.name);
    body.set('file', file);
    const message = await run(() => adminFetch('/documents', { method: 'POST', body }))();
    if (message) setError(message);
  }

  if (!ready) return null;

  if (!loggedIn) {
    return (
      <LoginModal
        onClose={() => {
          window.location.href = '/';
        }}
        onSubmit={login}
      />
    );
  }

  const current = SECTIONS.find((item) => item.id === section)!;

  function primaryAction() {
    if (section === 'projects') setProjectModal({ project: null });
    else if (section === 'blogs') setPostModal(true);
    else if (section === 'youtube') setVideoModal(true);
    else if (section === 'docs') fileInput.current?.click();
    else void load();
  }

  return (
    <section style={s('display: flex; gap: 28px;')}>
      <div style={s('width: 132px; flex: 0 0 132px; display: flex; flex-direction: column; gap: 2px; border-right: 1px solid #26323D; padding-right: 14px;')}>
        <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; padding: 0 8px 10px;")}>
          ADMIN
        </span>
        {SECTIONS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setSection(item.id)}
            className="h-bg f2"
            style={s(`all: unset; cursor: pointer; font-family: 'JetBrains Mono', monospace; font-size: 13px; padding: 8px 10px; border-radius: 6px; color: ${section === item.id ? '#E8EDF2' : '#8B99A6'}; background: ${section === item.id ? '#1B2530' : 'transparent'};`)}
          >
            {item.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => {
            clearAdminToken();
            setLoggedIn(false);
          }}
          className="h-dim f2"
          style={s("all: unset; cursor: pointer; margin-top: 16px; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5764; padding: 0 10px;")}
        >
          chiqish
        </button>
      </div>

      <div style={s('flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 20px;')}>
        <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 16px;')}>
          <h1 style={s("margin: 0; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 24px;")}>
            {current.label}
          </h1>
          <button
            type="button"
            onClick={primaryAction}
            className="h-white f3"
            style={s("all: unset; cursor: pointer; background: #F5F7FA; color: #0B0F14; font-family: 'JetBrains Mono', monospace; font-weight: 700; font-size: 12px; padding: 10px 16px; border-radius: 7px;")}
          >
            {current.primary}
          </button>
        </div>

        {error && (
          <div style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #ff6b6b;")}>
            {error}
          </div>
        )}

        {section === 'projects' && (
          <div style={s('border: 1px solid #26323D; border-radius: 10px; overflow-x: auto;')}>
            <div style={s(`${ROW} padding: 12px 16px; background: #141C24; font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; letter-spacing: 0.04em;`)}>
              <span>NOMI</span>
              <span>KATEGORIYA</span>
              <span>STATUS</span>
              <span>YANGILANDI</span>
              <span>AMAL</span>
            </div>
            {projects.map((project) => (
              <div
                key={project.id}
                style={s(`${ROW} padding: 13px 16px; border-top: 1px solid #26323D; align-items: center; font-size: 13px;`)}
              >
                <span style={s('font-weight: 600;')}>{project.title}</span>
                <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; white-space: nowrap;")}>
                  {CATEGORY_LABEL[project.category]}
                </span>
                <span style={s(`font-family: 'IBM Plex Mono', monospace; font-size: 11px; white-space: nowrap; color: ${(STATUS_COLOR[project.status] ?? STATUS_COLOR.ARCHIVED).color};`)}>
                  {STATUS_LABEL[project.status]}
                </span>
                <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; white-space: nowrap;")}>
                  {uzDate(project.updatedAt)}
                </span>
                <span style={s('display: flex; gap: 12px; justify-content: flex-end;')}>
                  <button type="button" onClick={() => setProjectModal({ project })} className="h-txt f2" style={s(LINK_BTN)}>
                    Tahrir
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeletion({ label: project.title, path: `/projects/${project.id}` })}
                    className="h-danger f2"
                    style={s(`${DEL_BTN} font-size: 11px;`)}
                  >
                    O&apos;chir
                  </button>
                </span>
              </div>
            ))}
          </div>
        )}

        {section === 'blogs' && (
          <div style={s('display: flex; flex-direction: column; gap: 12px;')}>
            {posts.map((post) => (
              <div
                key={post.id}
                style={s(`${CARD} padding: 16px 18px; display: flex; align-items: center; gap: 14px; flex-wrap: wrap;`)}
              >
                <span style={s('display: flex; flex-direction: column; gap: 6px; flex: 1 1 220px; min-width: 200px;')}>
                  <span style={s('font-size: 15px; font-weight: 600;')}>{post.title}</span>
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                    {post.projectTitle} · {uzDate(post.createdAt)}
                    {post.sentToTelegram ? ' · yuborilgan' : ''}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setTelegramPost(post)}
                  className="h-tg f2"
                  style={s("all: unset; cursor: pointer; flex: 0 0 auto; white-space: nowrap; font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #4FD1FF; color: #4FD1FF; padding: 8px 13px; border-radius: 7px;")}
                >
                  Telegram&apos;ga yubor
                </button>
                <button
                  type="button"
                  onClick={() => setDeletion({ label: post.title, path: `/posts/${post.id}` })}
                  className="h-danger f2"
                  style={s(`${DEL_BTN} flex: 0 0 auto; white-space: nowrap;`)}
                >
                  O&apos;chirish
                </button>
              </div>
            ))}
          </div>
        )}

        {section === 'comments' && (
          <div style={s('display: flex; flex-direction: column; gap: 12px;')}>
            {comments.length === 0 && (
              <div style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6;")}>
                Hali izoh yo&apos;q.
              </div>
            )}
            {comments.map((comment) => (
              <div
                key={comment.id}
                style={s(`${CARD} padding: 15px 18px; display: flex; align-items: flex-start; gap: 18px;`)}
              >
                <span style={s('display: flex; flex-direction: column; gap: 6px; flex: 1;')}>
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                    {comment.username} · {uzDate(comment.createdAt)} · {comment.projectTitle}
                  </span>
                  <span style={s('font-size: 14px; line-height: 1.6;')}>{comment.text}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setDeletion({ label: `“${comment.text.slice(0, 40)}…”`, path: `/comments/${comment.id}` })}
                  className="h-danger f2"
                  style={s(DEL_BTN)}
                >
                  O&apos;chirish
                </button>
              </div>
            ))}
          </div>
        )}

        {section === 'youtube' && (
          <div style={s('display: flex; flex-direction: column; gap: 12px;')}>
            <button
              type="button"
              onClick={() => setVideoUpload(true)}
              className="h-tg f2"
              style={s("all: unset; cursor: pointer; align-self: flex-start; font-family: 'IBM Plex Mono', monospace; font-size: 12px; border: 1px solid #4FD1FF; color: #4FD1FF; padding: 9px 15px; border-radius: 7px;")}
            >
              ↑ YouTube&apos;ga video yuklash
            </button>
            {videos.map((video) => (
              <div key={video.id} style={s(`${CARD} padding: 12px 16px; display: flex; align-items: center; gap: 16px;`)}>
                <span
                  style={{
                    ...s('width: 92px; height: 52px; border-radius: 6px; border: 1px solid #26323D; background-color: #0F1720; display: block; flex: 0 0 auto;'),
                    backgroundImage: `url(${video.thumbnail})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  }}
                />
                <span style={s('flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0;')}>
                  <span style={s('font-size: 14px; font-weight: 600;')}>{video.title}</span>
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;")}>
                    {video.youtubeUrl}
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setDeletion({ label: video.title, path: `/youtube/${video.id}` })}
                  className="h-danger f2"
                  style={s(DEL_BTN)}
                >
                  O&apos;chirish
                </button>
              </div>
            ))}
          </div>
        )}

        {section === 'docs' && (
          <div style={s('display: flex; flex-direction: column; gap: 12px;')}>
            <input
              ref={fileInput}
              type="file"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadDocument(file);
                e.target.value = '';
              }}
            />
            <div
              onClick={() => fileInput.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) void uploadDocument(file);
              }}
              style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; cursor: pointer;")}
            >
              hujjatlarni bu yerga tashlang
            </div>
            {docs.map((doc) => (
              <div key={doc.id} style={s(`${CARD} padding: 12px 16px; display: flex; align-items: center; gap: 16px;`)}>
                <span style={s("width: 34px; height: 42px; border: 1px solid #26323D; border-radius: 5px; display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; font-family: 'IBM Plex Mono', monospace; font-size: 9px; color: #8B99A6; background: #0F1720; flex: 0 0 auto;")}>
                  {doc.type}
                </span>
                <span style={s('flex: 1; display: flex; flex-direction: column; gap: 5px; min-width: 0;')}>
                  <span style={s('font-size: 14px; font-weight: 600;')}>{doc.title}</span>
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #8B99A6;")}>
                    {doc.generated
                      ? `${doc.projectCount} ta loyiha · loyihalardan avtomatik yasaladi`
                      : `${fileSize(doc.sizeBytes)} · yangilangan ${uzDate(doc.updatedAt)}`}
                  </span>
                </span>
                {doc.generated ? (
                  <span style={s("font-family: 'IBM Plex Mono', monospace; font-size: 11px; color: #4a5764;")}>
                    o&apos;chirib bo&apos;lmaydi
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeletion({ label: doc.title, path: `/documents/${doc.id}` })}
                    className="h-danger f2"
                    style={s(DEL_BTN)}
                  >
                    O&apos;chirish
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {section === 'settings' && (
          <div style={s("border: 1px dashed #26323D; border-radius: 10px; padding: 40px; text-align: center; font-family: 'IBM Plex Mono', monospace; font-size: 12px; color: #8B99A6; line-height: 1.8;")}>
            kanal linklari, Telegram token, sayt sarlavhasi
            <br />
            <span style={s('color: #4a5764;')}>
              bular .env faylda saqlanadi: TELEGRAM_BOT_TOKEN, TELEGRAM_CHANNEL_ID, SITE_URL
            </span>
          </div>
        )}
      </div>

      {projectModal && (
        <ProjectModal
          project={projectModal.project}
          onClose={() => setProjectModal(null)}
          onSave={(draft) => saveProject(draft, projectModal.project)}
        />
      )}

      {postModal && (
        <PostModal
          projects={projects}
          onClose={() => setPostModal(false)}
          onSave={async (draft) => {
            const body = new FormData();
            body.set('projectId', draft.projectId);
            body.set('title', draft.title);
            body.set('content', draft.content);
            body.set('sendToTelegram', String(draft.sendToTelegram));
            if (draft.image) body.set('image', draft.image);

            try {
              const created = await adminFetch<Post & { telegramError: string | null }>('/posts', {
                method: 'POST',
                body,
              });
              await load();
              // Always close: the post exists now, so a retry would duplicate it.
              setPostModal(false);
              if (created.telegramError) {
                setError(`Yozuv saqlandi, lekin Telegramga ketmadi: ${created.telegramError}`);
              }
              return null;
            } catch (err) {
              if (err instanceof Unauthorized) setLoggedIn(false);
              return err instanceof Error ? err.message : 'Xatolik yuz berdi';
            }
          }}
        />
      )}

      {videoModal && (
        <VideoModal
          onClose={() => setVideoModal(false)}
          onSave={async (draft) => {
            const message = await run(() =>
              adminFetch('/youtube', { method: 'POST', body: JSON.stringify(draft) }),
            )();
            if (!message) setVideoModal(false);
            return message;
          }}
        />
      )}

      {telegramPost && (
        <TelegramModal
          post={telegramPost}
          onClose={() => setTelegramPost(null)}
          onSend={async () => {
            const message = await run(() =>
              adminFetch(`/posts/${telegramPost.id}/send-telegram`, { method: 'POST' }),
            )();
            if (!message) setTelegramPost(null);
            return message;
          }}
        />
      )}

      {videoUpload && (
        <VideoUploadModal
          onClose={() => setVideoUpload(false)}
          onUpload={async (draft) => {
            const body = new FormData();
            body.set('video', draft.file);
            body.set('title', draft.title);
            body.set('description', draft.description);
            body.set('privacyStatus', draft.privacyStatus);
            const message = await run(() =>
              adminFetch('/youtube/upload', { method: 'POST', body }),
            )();
            if (!message) setVideoUpload(false);
            return message;
          }}
        />
      )}

      {deletion && (
        <DeleteModal
          label={deletion.label}
          onClose={() => setDeletion(null)}
          onConfirm={async () => {
            const message = await run(() => adminFetch(deletion.path, { method: 'DELETE' }))();
            if (!message) setDeletion(null);
            return message;
          }}
        />
      )}
    </section>
  );
}
