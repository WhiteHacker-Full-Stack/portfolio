/**
 * YouTube uchun bir martalik avtorizatsiya — refresh token oladi.
 *
 *   npm run youtube:auth
 *
 * Buni **brauzer bor kompyuterda** (ya'ni o'z Mac'ingizda) ishga tushiring, serverda emas.
 * Olingan refresh token istalgan mashinada ishlaydi — u OAuth mijoziga bog'langan.
 *
 * Google 2023-yildan "OOB" (kodni qo'lda ko'chirish) usulini bloklagan, shuning uchun
 * bu yerda tavsiya etilgan loopback oqimi ishlatiladi: skript localhost'da kichik
 * server ko'taradi va Google kodni to'g'ridan-to'g'ri o'shanga qaytaradi.
 */
import { createServer } from 'node:http';
import { env } from '../src/env.js';
import { YOUTUBE_SCOPE } from '../src/lib/youtubeUpload.js';

const PORT = 4599;
const REDIRECT = `http://localhost:${PORT}`;

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

console.log('\nBrauzerda shu havolani oching va ruxsat bering:\n');
console.log(authUrl);
console.log('\nRuxsat berganingizdan keyin bu oyna oʻzi davom etadi…\n');

const code: string = await new Promise((resolve, reject) => {
  const server = createServer((req, res) => {
    const url = new URL(req.url ?? '/', REDIRECT);
    const received = url.searchParams.get('code');
    const error = url.searchParams.get('error');

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(
      `<body style="background:#0B0F14;color:#E8EDF2;font-family:monospace;padding:60px;text-align:center">
         <h2>${received ? 'Tayyor — terminalga qayting.' : `Xato: ${error ?? 'kod kelmadi'}`}</h2>
       </body>`,
    );

    server.close();
    received ? resolve(received) : reject(new Error(error ?? 'kod kelmadi'));
  });

  server.listen(PORT);
  // Brauzerda akkaunt tanlash va ogohlantirishdan o'tish vaqt oladi — shoshiltirmaymiz.
  setTimeout(() => {
    server.close();
    reject(new Error('vaqt tugadi (30 daqiqa)'));
  }, 30 * 60 * 1000);
});

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

console.log('\nTayyor. Shu qatorni serverdagi .env fayliga qoʻshing:\n');
console.log(`YOUTUBE_REFRESH_TOKEN="${body.refresh_token}"`);
console.log('\nKeyin: sudo systemctl restart whitehacker-api\n');
process.exit(0);
