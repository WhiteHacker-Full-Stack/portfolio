import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';

// Both `src/` (tsx dev) and `dist/` (compiled) sit one level under server/,
// so the repo root — where the single .env lives — is two levels up.
export const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');

config({ path: path.join(REPO_ROOT, '.env') });

export const env = {
  port: Number(process.env.PORT ?? 4000),
  // Behind nginx the API must not be reachable from the outside directly.
  host: process.env.HOST ?? '127.0.0.1',
  jwtSecret: process.env.JWT_SECRET ?? '',
  siteUrl: (process.env.SITE_URL ?? 'http://localhost:3000').replace(/\/$/, ''),
  corsOrigins: (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  uploadDir: path.resolve(REPO_ROOT, process.env.UPLOAD_DIR ?? 'web/public/uploads'),
  telegramBotToken: process.env.TELEGRAM_BOT_TOKEN ?? '',
  telegramChannelId: process.env.TELEGRAM_CHANNEL_ID ?? '',
  youtubeClientId: process.env.YOUTUBE_CLIENT_ID ?? '',
  youtubeClientSecret: process.env.YOUTUBE_CLIENT_SECRET ?? '',
  youtubeRefreshToken: process.env.YOUTUBE_REFRESH_TOKEN ?? '',
  /** Katta video fayllar shu yerga oqim bilan yoziladi, keyin YouTube'ga uzatiladi. */
  videoTmpDir: process.env.VIDEO_TMP_DIR ?? '/tmp/wh-video-uploads',
};

if (!env.jwtSecret) {
  throw new Error('JWT_SECRET is missing — copy .env.example to .env and fill it in.');
}
