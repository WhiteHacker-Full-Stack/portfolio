import fs from 'node:fs/promises';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { env } from '../src/env.js';
import { prisma } from '../src/prisma.js';
import { extractYoutubeId } from '../src/lib/youtube.js';

type SeedProject = {
  slug: string;
  title: string;
  category: string;
  status: string;
  description: string;
  tech: string;
  posts: { title: string; content: string; daysAgo: number }[];
};

const PROJECTS: SeedProject[] = [
  {
    slug: 'portsense',
    title: 'PortSense',
    category: 'MANUAL',
    status: 'LIVE',
    description:
      "Uy tarmog'i uchun port skaner va monitoring paneli. Uy serverimda ochiq portlarni kuzatib turadigan kichik xizmat: skanerlash navbati Node ichida, natijalar SQLite'da, panel esa oddiy server-render sahifa — ortiqcha frontend yo'q.",
    tech: 'Node.js,Express,SQLite,Tailscale',
    posts: [
      {
        title: "Skanerlash navbatini qayta yozdim",
        content:
          "Avval har bir port uchun alohida so'rov ketardi va tarmoq bo'g'ilib qolardi. Endi navbat bir vaqtda 20 ta portni tekshiradi, natija to'planib bitta tranzaksiyada yoziladi. Skanerlash vaqti 40 soniyadan 6 soniyaga tushdi.",
        daysAgo: 22,
      },
    ],
  },
  {
    slug: 'markflow',
    title: 'MarkFlow',
    category: 'MANUAL',
    status: 'LIVE',
    description:
      "Markdown muharriri — to'liq klaviatura bilan boshqariladi. Yozuvlarimni saqlash uchun o'zimga qilgan muharrir: barcha amal klaviaturadan bajariladi, fayllar mahalliy saqlanadi va keyin sinxronlanadi.",
    tech: 'Next.js,Prisma,Postgres',
    posts: [
      {
        title: 'Klaviatura buyruqlari palitrasi',
        content:
          "Cmd+K palitrasini qo'shdim: barcha amallar bitta joydan topiladi va sichqoncha umuman kerak emas. Buyruqlar ro'yxati konfiguratsiya faylidan o'qiladi, shuning uchun yangi amal qo'shish uchun UI'ga tegish shart emas.",
        daysAgo: 36,
      },
    ],
  },
  {
    slug: 'dotkit',
    title: 'dotkit',
    category: 'MANUAL',
    status: 'ARCHIVED',
    description:
      "Dotfayllarni bir buyruq bilan ko'chiruvchi CLI. Yangi mashinada ish muhitini bir buyruqda tiklash uchun yozgan edim. Endi ishlatmayman, lekin kodi ochiq qoldi.",
    tech: 'Node.js,Bash',
    posts: [
      {
        title: 'Nega bu loyihani arxivga oldim',
        content:
          "Ish muhitimni endi butunlay boshqa vosita bilan boshqaraman, shuning uchun dotkit'ni qo'llab-quvvatlashda ma'no qolmadi. Kod ochiq qoladi — kimdir foydalansa xursand bo'laman.",
        daysAgo: 92,
      },
    ],
  },
  {
    slug: 'geminotes',
    title: 'GemiNotes',
    category: 'AI',
    status: 'LIVE',
    description:
      "Uzun matnni konspektga aylantiruvchi ilova. Maqola yoki transkriptni tashlaysiz — struktura bilan konspekt qaytaradi. Model chaqiruvlari navbat orqali ketadi, natija keshlanadi.",
    tech: 'Next.js,Gemini API,Prisma',
    posts: [
      {
        title: 'Model javoblarini keshlash',
        content:
          "Bir xil matn uchun qayta-qayta model chaqirish pul va vaqt yeyapti edi. Endi matnning hash'i bo'yicha kesh qidiriladi va mos kelsa javob darhol qaytadi. Chaqiruvlar soni uchdan biriga tushdi.",
        daysAgo: 15,
      },
      {
        title: "Uzun matnni bo'laklarga bo'lish",
        content:
          "Model kontekstiga sig'maydigan matnlar endi paragraf chegaralari bo'yicha bo'linadi, har bir bo'lak alohida konspektlanadi va oxirida birlashtiriladi. Sarlavhalar takrorlanib ketmasligi uchun oxirgi bosqichda yana bir marta tozalash bor.",
        daysAgo: 29,
      },
    ],
  },
  {
    slug: 'autodoc',
    title: 'AutoDoc',
    category: 'AI',
    status: 'IN_PROGRESS',
    description:
      "Repozitoriy uchun hujjat qoralamasini yozadi. Repodagi fayllarni o'qib, README va API hujjat qoralamasini tayyorlaydi. Hozir monorepo qo'llab-quvvatlashini qo'shmoqdaman.",
    tech: 'Node.js,Gemini API,Express',
    posts: [
      {
        title: 'Monorepo uchun hujjat generatori',
        content:
          "Bitta repoda bir nechta paket bo'lsa, har biriga alohida README kerak. Endi generator workspace ro'yxatini o'qiydi va har bir paket uchun alohida qoralama chiqaradi, umumiy README esa ularga havola beradi.",
        daysAgo: 27,
      },
    ],
  },
  {
    slug: 'promptlab',
    title: 'PromptLab',
    category: 'AI',
    status: 'IN_PROGRESS',
    description:
      "Promptlarni versiyalash va solishtirish paneli. Bitta vazifa uchun bir necha prompt variantini yonma-yon sinab ko'rish uchun panel — har bir versiya natijasi saqlanadi.",
    tech: 'Next.js,SQLite',
    posts: [
      {
        title: 'Yonma-yon taqqoslash ekrani',
        content:
          "Ikki prompt natijasini yonma-yon qo'yib, farqlarni belgilab ko'rsatadigan ekran qo'shdim. Qaysi versiya qaysi natijani bergani saqlanadi, shuning uchun bir hafta oldingi tajribaga qaytish oson.",
        daysAgo: 42,
      },
    ],
  },
  {
    slug: 'edutrack',
    title: 'EduTrack',
    category: 'STARTUP',
    status: 'LIVE',
    description:
      "O'quv markazlari uchun davomat va to'lov tizimi. Davomat, to'lov va ota-onaga xabar yuborishni bitta joyga yig'adi. Web va Android bitta kodbazadan chiqadi.",
    tech: 'Next.js,Capacitor,Prisma,Express',
    posts: [
      {
        title: 'Offline navbat va konflikt yechimi',
        content:
          "Internet yo'q paytda yozilgan amallar navbatga tushadi, ulanish tiklanganda serverdagi versiya bilan solishtiriladi. Konflikt bo'lsa foydalanuvchiga tanlov beriladi — bu yerda avtomatik qaror qabul qilmaslikka harakat qildim, chunki davomat ma'lumotini noto'g'ri birlashtirish jiddiy muammo.",
        daysAgo: 4,
      },
      {
        title: 'Prisma sxemasini ikkinchi marta qayta yozdim',
        content:
          "Birinchi sxema hisobotlarga mos kelmadi — har bir hisobot uchun murakkab join yozishga to'g'ri kelardi. Tranzaksiyalarni alohida jadvalga chiqarib, hisobot so'rovlarini soddalashtirdim.",
        daysAgo: 16,
      },
      {
        title: 'Capacitor build quvuri',
        content:
          "Bitta buyruq bilan web build va Android APK chiqadigan qilib sozladim. Sinov qurilmasiga o'rnatish ham shu skript ichida — endi yangi versiyani sinashga 2 daqiqa ketadi.",
        daysAgo: 32,
      },
    ],
  },
  {
    slug: 'mahallapay',
    title: 'MahallaPay',
    category: 'STARTUP',
    status: 'IN_PROGRESS',
    description:
      "Mahalliy xizmatlar uchun to'lov yig'ish vositasi. Kichik xizmat ko'rsatuvchilar uchun to'lov havolasi yaratish va hisobot olish. Hozir pilot rejimida ishlaydi.",
    tech: 'Next.js,Express,Postgres',
    posts: [
      {
        title: "To'lov havolasi oqimini qisqartirdim",
        content:
          "Avval havola yaratish uchun to'rtta ekrandan o'tish kerak edi. Endi summa va izoh bitta formada, qolgan hamma narsa standart qiymat bilan to'ladi. Pilot foydalanuvchilar orasida tugatish darajasi sezilarli oshdi.",
        daysAgo: 9,
      },
    ],
  },
  {
    slug: 'statik',
    title: 'Statik',
    category: 'STARTUP',
    status: 'IN_PROGRESS',
    description:
      "Kichik biznes uchun sayt konstruktori. Bir sahifali biznes saytini 10 daqiqada chiqarish uchun. Shablonlar atayin cheklangan — tanlov ko'p bo'lsa ish tugamaydi.",
    tech: 'Next.js,Prisma,SQLite',
    posts: [
      {
        title: 'Shablonlar sonini uchtaga tushirdim',
        content:
          "O'n ikkita shablon bor edi va foydalanuvchilar tanlash bosqichida qotib qolardi. Uchtasini qoldirdim, qolganini o'chirdim. Sayt chiqarish o'rtacha vaqti ikki barobar qisqardi.",
        daysAgo: 20,
      },
    ],
  },
];

const VIDEOS = [
  { title: 'Next.js + Capacitor: bitta kodbaza, ikkita platforma', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' },
  { title: 'Prisma migratsiyalari: xatolarim va yechimlarim', url: 'https://www.youtube.com/watch?v=9bZkp7q19f0' },
  { title: "Uy serverini Tailscale bilan ochmasdan ulash", url: 'https://youtu.be/kJQP7kiw5Fk' },
  { title: 'Gemini API bilan real ish oqimi', url: 'https://www.youtube.com/watch?v=3JZ_D3ELwOQ' },
  { title: "Express'da navbat: oddiy va ishlaydigan usul", url: 'https://www.youtube.com/watch?v=L_jWHffIx5E' },
  { title: 'Startapni ochiq olib borish — 6 oylik natija', url: 'https://www.youtube.com/watch?v=fJ9rUzIMcZQ' },
];

// Hujjatlar seed qilinmaydi: CV kabi fayllar admin paneldan yuklanadi, "Loyihalar
// portfoliosi" esa loyihalardan avtomatik yasaladi (server/src/lib/portfolioPdf.ts).
const DOCUMENTS: { title: string; type: string }[] = [];

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

/** Builds a valid one-page PDF so the seeded documents are really downloadable. */
function samplePdf(title: string): Buffer {
  const text = title.replace(/[\\()]/g, '');
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>',
    null,
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
  ];
  const stream = `BT /F1 20 Tf 60 760 Td (${text}) Tj ET`;
  objects[3] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;

  let pdf = '%PDF-1.4\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
    offsets.push(pdf.length);
    pdf += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xrefStart = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) pdf += `${String(offset).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, 'latin1');
}

async function main() {
  await prisma.comment.deleteMany();
  await prisma.visitor.deleteMany();
  await prisma.blogPost.deleteMany();
  await prisma.project.deleteMany();
  await prisma.document.deleteMany();
  await prisma.youtubeVideo.deleteMany();
  await prisma.adminUser.deleteMany();

  const username = process.env.ADMIN_USERNAME ?? 'whitehacker';
  const password = process.env.ADMIN_PASSWORD ?? 'whitehacker';
  await prisma.adminUser.create({
    data: { username, passwordHash: await bcrypt.hash(password, 10) },
  });

  for (const p of PROJECTS) {
    const newest = Math.min(...p.posts.map((post) => post.daysAgo));
    await prisma.project.create({
      data: {
        slug: p.slug,
        title: p.title,
        category: p.category,
        status: p.status,
        description: p.description,
        tech: p.tech,
        createdAt: daysAgo(120),
        updatedAt: daysAgo(newest),
        posts: {
          create: p.posts.map((post) => ({
            title: post.title,
            content: post.content,
            createdAt: daysAgo(post.daysAgo),
          })),
        },
      },
    });
  }

  await fs.mkdir(env.uploadDir, { recursive: true });
  for (const doc of DOCUMENTS) {
    const bytes = samplePdf(doc.title.replace('.pdf', ''));
    const fileName = `seed-${doc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
    await fs.writeFile(path.join(env.uploadDir, fileName), bytes);
    await prisma.document.create({
      data: {
        title: doc.title,
        type: doc.type,
        fileUrl: `/uploads/${fileName}`,
        sizeBytes: bytes.byteLength,
      },
    });
  }

  for (const [i, video] of VIDEOS.entries()) {
    const youtubeId = extractYoutubeId(video.url);
    if (!youtubeId) continue;
    await prisma.youtubeVideo.create({
      data: { title: video.title, youtubeUrl: video.url, youtubeId, addedAt: daysAgo(i * 12 + 3) },
    });
  }

  const visitor = await prisma.visitor.create({
    data: { deviceToken: 'seed-device-token-aziz', username: 'Aziz' },
  });
  const edutrackPost = await prisma.blogPost.findFirst({
    where: { project: { slug: 'edutrack' } },
    orderBy: { createdAt: 'desc' },
  });
  if (edutrackPost) {
    await prisma.comment.create({
      data: {
        blogPostId: edutrackPost.id,
        visitorId: visitor.id,
        text: "Offline navbat qismi juda foydali bo'ldi, o'zimda ham shunga o'xshash muammo bor edi.",
        createdAt: daysAgo(3),
      },
    });
  }

  console.log(`Seed tayyor. Admin: ${username} / ${password}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
