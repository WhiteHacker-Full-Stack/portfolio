# WhiteHacker Portfolio

Terminal-uslubidagi shaxsiy portfolio: Next.js frontend + Express/Prisma/SQLite backend,
admin panel va Telegram kanalga avtomatik e'lon.

```
design/     zip'dan chiqqan original dizayn fayllari (o'zgartirilmagan, faqat manba sifatida)
server/     Express + Prisma + SQLite API (port 4000)
web/        Next.js App Router frontend (port 3000)
```

## Ishga tushirish

```bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev
```

- Sayt: http://localhost:3000
- API: http://localhost:4000
- Admin: http://localhost:3000/admin — `whitehacker` / `whitehacker` (`.env`dagi `ADMIN_*` dan olinadi)

Next.js `/api/*` va `/uploads/*` so'rovlarini Express'ga proxy qiladi, shuning uchun brauzer
faqat 3000-portni ko'radi.

## Skriptlar

| Buyruq | Vazifasi |
| --- | --- |
| `npm run dev` | server + web birga |
| `npm run build` | ikkalasini production uchun yig'ish |
| `npm run db:migrate` | Prisma migratsiya |
| `npm run db:seed` | namunaviy ma'lumot (bazani tozalab qayta to'ldiradi) |
| `npm run db:studio` | Prisma Studio |

## Telegram

`.env`ga `TELEGRAM_BOT_TOKEN` va `TELEGRAM_CHANNEL_ID` yozilgach ikkala trigger ishlaydi:

1. **Avtomatik** — admin panelda yozuv yaratishda "Saqlash va Telegram'ga yubor".
2. **Qo'lda** — Bloglar ro'yxatidagi "Telegram'ga yubor" tugmasi (istalgan vaqtda qayta yuborsa bo'ladi).

Xabar formati: qalin sarlavha, loyiha nomi, 300 belgigacha qisqartirilgan matn va
`[Batafsil]` inline tugmasi (`SITE_URL/projects/<slug>`). Rasm bo'lsa `sendPhoto`, aks holda
`sendMessage`; Telegram rasmni yuklab ololmasa avtomatik `sendMessage`ga tushadi (localhost'da
rasm URL'i tashqaridan ko'rinmaydi — bu normal).

Bot kanalga **admin** qilib qo'shilgan bo'lishi kerak.

## API

**Public**

```
GET    /api/projects?category=MANUAL|AI|STARTUP
GET    /api/projects/:slug              → loyiha + barcha yozuvlar (yangi tepada)
GET    /api/projects/:slug/comments
GET    /api/posts?limit=3
GET    /api/posts/:id/comments
POST   /api/posts/:id/comments          { deviceToken, username?, text }
GET    /api/visitors/:deviceToken
PATCH  /api/visitors/:deviceToken       { username }
GET    /api/documents                   → avtomatik portfolio + yuklangan fayllar
GET    /api/documents/portfolio.pdf     → loyihalardan yasaladigan PDF (saqlanmaydi)
GET    /api/youtube
GET    /api/stats
```

**Admin** — `POST /api/admin/login` JWT qaytaradi, qolganlari `Authorization: Bearer <token>` talab qiladi:

```
GET/POST/PUT/DELETE  /api/admin/projects[/:id]     (cover rasm — multipart `cover`)
GET/POST/PUT/DELETE  /api/admin/posts[/:id]        (rasm — multipart `image`)
POST                 /api/admin/posts/:id/send-telegram
POST/DELETE          /api/admin/documents[/:id]    (fayl — multipart `file`)
POST/DELETE          /api/admin/youtube[/:id]      (youtubeId linkdan regex bilan olinadi)
GET/DELETE           /api/admin/comments[/:id]
```

## Loyihalar portfoliosi (avtomatik PDF)

`Hujjatlar` bo'limidagi **"Loyihalar portfoliosi.pdf"** — yuklangan fayl emas. Har safar
so'ralganda [`server/src/lib/portfolioPdf.ts`](server/src/lib/portfolioPdf.ts) uni bazadagi
joriy loyihalardan yasaydi: kategoriyalar bo'yicha guruhlangan, har bir loyihada status,
texnologiyalar, tavsif, loyiha jurnalining oxirgi 5 ta yozuvi va sahifasiga havola.

Ya'ni loyiha qo'shsangiz yoki yangi yozuv yozsangiz, PDF avtomatik yangilanadi — hech narsa
qilish shart emas. Shu sababli uni admin paneldan o'chirib bo'lmaydi.

PDF ichidagi havolalar `SITE_URL` dan olinadi, shuning uchun deploydan oldin uni haqiqiy
domeningizga sozlang.

## Izohlar tizimi

Brauzer `localStorage`da `crypto.randomUUID()` bilan `deviceToken` saqlaydi. Birinchi izohda
ism so'raladi va `Visitor` yaratiladi. Izohlar `visitorId` orqali bog'langani uchun ismni
o'zgartirsa **barcha eski izohlar ham yangi ismni ko'rsatadi** — denormalizatsiya yo'q.

Dizaynda izohlar loyiha sahifasining pastida bitta ro'yxat bo'lgani uchun: ko'rsatilganda
loyihaning barcha yozuvlaridagi izohlar birlashtiriladi, yangi izoh esa eng so'nggi yozuvga
biriktiriladi (`commentTargetId`).

## Mobil (Capacitor) uchun

API alohida Express qatlamida va CORS `CORS_ORIGINS` orqali sozlanadi (`capacitor://localhost`
allaqachon ro'yxatda). Yuklangan fayllar `${API}/uploads/...` orqali ham ochiladi, shuning uchun
mobil ilova ham shu backend'ga to'g'ridan-to'g'ri ulanaveradi.

## Dizayndan farqlar

Dizayn 1:1 ko'chirildi (inline CSS matni `lib/css.ts` orqali o'zgarmagan holda ishlatiladi;
`style-hover`/`style-focus` atributlari `globals.css`dagi mos klasslarga aylandi). Uch joyda
ma'lumot manbai bo'lmagani uchun kichik qo'shimchalar:

- **`Project.tech`** — dizayndagi texnologiya chiplari uchun sxemaga qo'shildi (vergul bilan saqlanadi).
- **Admin "Yangi loyiha" modali** — o'sha uslubdagi bitta `tech` inputi qo'shildi.
- **Home ijtimoiy kartalari** — obunachi sonlari o'rniga real ma'lumot (yuborilgan yozuvlar soni,
  video soni, oxirgi yozuv/video sarlavhasi), chunki bu raqamlar uchun YouTube/Telegram API kerak
  bo'lardi. YouTube ko'rishlar soni shu sababdan olib tashlandi, thumbnail esa `i.ytimg.com`dan
  API'siz olinadi.

Prisma'ning SQLite konnektori `enum`ni qo'llab-quvvatlamaydi, shuning uchun `category` va `status`
`String` sifatida saqlanib, `server/src/lib/enums.ts`da zod bilan tekshiriladi.
