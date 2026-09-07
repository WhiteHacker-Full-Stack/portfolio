import fs from 'node:fs';
import { stat } from 'node:fs/promises';
import { env } from '../env.js';

const OAUTH_TOKEN_URL = 'https://oauth2.googleapis.com/token';
const UPLOAD_URL =
  'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status';

/** Videolarni yuklash uchun kerakli ruxsat. */
export const YOUTUBE_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';

export class YoutubeError extends Error {}

export type UploadOptions = {
  filePath: string;
  title: string;
  description: string;
  /** Auditdan o'tmagan loyihalarda YouTube baribir "private" qilib qo'yadi. */
  privacyStatus: 'private' | 'unlisted' | 'public';
  tags?: string[];
};

function requireCredentials() {
  const { youtubeClientId, youtubeClientSecret, youtubeRefreshToken } = env;
  if (!youtubeClientId || !youtubeClientSecret || !youtubeRefreshToken) {
    throw new YoutubeError(
      'YOUTUBE_CLIENT_ID, YOUTUBE_CLIENT_SECRET yoki YOUTUBE_REFRESH_TOKEN .env faylda toʻldirilmagan',
    );
  }
  return { youtubeClientId, youtubeClientSecret, youtubeRefreshToken };
}

/** Refresh token doimiy; access token qisqa muddatli, har yuklashda yangilanadi. */
export async function getAccessToken(): Promise<string> {
  const { youtubeClientId, youtubeClientSecret, youtubeRefreshToken } = requireCredentials();

  const res = await fetch(OAUTH_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: youtubeClientId,
      client_secret: youtubeClientSecret,
      refresh_token: youtubeRefreshToken,
      grant_type: 'refresh_token',
    }),
  });

  const body = (await res.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!res.ok || !body.access_token) {
    throw new YoutubeError(
      `Google tokenni yangilamadi: ${body.error_description ?? body.error ?? res.status}`,
    );
  }
  return body.access_token;
}

/**
 * Resumable upload: avval metadata yuboriladi, Google yuklash manzilini qaytaradi,
 * keyin fayl oqim sifatida uzatiladi — katta video xotiraga sig'masa ham ishlaydi.
 */
export async function uploadVideo(options: UploadOptions): Promise<{ videoId: string; url: string }> {
  const accessToken = await getAccessToken();
  const { size } = await stat(options.filePath);

  const startRes = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json; charset=UTF-8',
      'X-Upload-Content-Length': String(size),
      'X-Upload-Content-Type': 'video/*',
    },
    body: JSON.stringify({
      snippet: {
        title: options.title.slice(0, 100),
        description: options.description.slice(0, 5000),
        tags: options.tags?.slice(0, 30),
      },
      status: { privacyStatus: options.privacyStatus, selfDeclaredMadeForKids: false },
    }),
  });

  const sessionUrl = startRes.headers.get('location');
  if (!startRes.ok || !sessionUrl) {
    const detail = await startRes.text().catch(() => '');
    throw new YoutubeError(`Yuklash sessiyasi ochilmadi (${startRes.status}): ${detail.slice(0, 300)}`);
  }

  const uploadRes = await fetch(sessionUrl, {
    method: 'PUT',
    headers: { 'Content-Length': String(size), 'Content-Type': 'video/*' },
    body: fs.createReadStream(options.filePath),
    // Node oqimni so'rov tanasi sifatida yuborishi uchun kerak.
    duplex: 'half',
  } as unknown as RequestInit);

  const result = (await uploadRes.json().catch(() => ({}))) as {
    id?: string;
    error?: { message?: string };
  };
  if (!uploadRes.ok || !result.id) {
    throw new YoutubeError(
      `Video yuklanmadi (${uploadRes.status}): ${result.error?.message ?? 'nomaʼlum xato'}`,
    );
  }

  return { videoId: result.id, url: `https://www.youtube.com/watch?v=${result.id}` };
}
