/**
 * YouTube uchun bir martalik avtorizatsiya — refresh token oladi.
 *
 *   npm run youtube:auth
 *
 * .env da YOUTUBE_CLIENT_ID va YOUTUBE_CLIENT_SECRET to'ldirilgan bo'lishi kerak.
 * Skript havola beradi, siz brauzerda ruxsat berasiz, Google kod qaytaradi,
 * shu kodni terminalga qo'yasiz — natijada refresh token chiqadi.
 */
import { createInterface } from 'node:readline/promises';
import { env } from '../src/env.js';
import { YOUTUBE_SCOPE } from '../src/lib/youtubeUpload.js';

const REDIRECT = 'urn:ietf:wg:oauth:2.0:oob';

if (!env.youtubeClientId || !env.youtubeClientSecret) {
  console.error('YOUTUBE_CLIENT_ID va YOUTUBE_CLIENT_SECRET .env faylda toʻldirilmagan.');
  process.exit(1);
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: env.youtubeClientId,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: YOUTUBE_SCOPE,
    // Refresh token faqat shu ikkisi bilan qaytariladi.
    access_type: 'offline',
    prompt: 'consent',
  });

console.log('\n1. Shu havolani brauzerda oching va ruxsat bering:\n');
console.log(authUrl);
console.log('\n2. Google bergan kodni shu yerga qoʻying.\n');

const rl = createInterface({ input: process.stdin, output: process.stdout });
const code = (await rl.question('Kod: ')).trim();
rl.close();

const res = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    code,
    client_id: env.youtubeClientId,
    client_secret: env.youtubeClientSecret,
    redirect_uri: REDIRECT,
    grant_type: 'authorization_code',
  }),
});

const body = (await res.json()) as { refresh_token?: string; error_description?: string; error?: string };
if (!res.ok || !body.refresh_token) {
  console.error(`\nXato: ${body.error_description ?? body.error ?? res.status}`);
  process.exit(1);
}

console.log('\nTayyor. Shu qatorni .env fayliga qoʻshing:\n');
console.log(`YOUTUBE_REFRESH_TOKEN="${body.refresh_token}"`);
console.log('\nKeyin: sudo systemctl restart whitehacker-api\n');
