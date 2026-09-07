import bcrypt from 'bcryptjs';
import { prisma } from '../prisma.js';
import { createBackup, getSettings } from './backup.js';
import {
  deleteMessage,
  getUpdates,
  hasTelegram,
  sendBackupDocument,
  sendChatMessage,
} from './telegram.js';
import fs from 'node:fs/promises';

const HELP = [
  'Zaxira nusxa boti.',
  '',
  '/login <username> <parol> — tasdiqlash',
  '/backup — hoziroq zaxira nusxa olish',
  '/status — sozlama va holat',
  '/stop — obunani bekor qilish',
].join('\n');

/** Ketma-ket muvaffaqiyatsiz urinishlarni cheklaydi. */
const attempts = new Map<string, { count: number; until: number }>();
const MAX_ATTEMPTS = 5;
const LOCK_MS = 15 * 60 * 1000;

function locked(chatId: string): number {
  const a = attempts.get(chatId);
  if (!a || a.until < Date.now()) return 0;
  return a.count >= MAX_ATTEMPTS ? Math.ceil((a.until - Date.now()) / 60000) : 0;
}

function recordFailure(chatId: string) {
  const a = attempts.get(chatId);
  const count = a && a.until > Date.now() ? a.count + 1 : 1;
  attempts.set(chatId, { count, until: Date.now() + LOCK_MS });
}

async function isSubscribed(chatId: string) {
  return prisma.backupSubscriber.findUnique({ where: { chatId } });
}

async function handleLogin(chatId: string, args: string[], messageId: number, from: {
  username?: string;
  first_name?: string;
}) {
  // Parol chat tarixida qolmasligi uchun xabar darhol o'chiriladi.
  await deleteMessage(chatId, messageId);

  const wait = locked(chatId);
  if (wait) {
    await sendChatMessage(chatId, `Juda koʻp urinish. ${wait} daqiqadan keyin qayta urining.`);
    return;
  }

  const [username, ...rest] = args;
  const password = rest.join(' ');
  if (!username || !password) {
    await sendChatMessage(chatId, 'Format: <code>/login username parol</code>');
    return;
  }

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  const ok = admin && (await bcrypt.compare(password, admin.passwordHash));
  if (!ok) {
    recordFailure(chatId);
    await sendChatMessage(chatId, 'Login yoki parol notoʻgʻri.');
    return;
  }

  attempts.delete(chatId);
  await prisma.backupSubscriber.upsert({
    where: { chatId },
    update: { username: admin.username },
    create: {
      chatId,
      username: admin.username,
      firstName: from.first_name ?? from.username ?? null,
    },
  });

  const s = await getSettings();
  await sendChatMessage(
    chatId,
    `Tasdiqlandi. Endi zaxira nusxalar shu yerga keladi.\n\n` +
      `Holat: ${s.enabled ? `yoqilgan, har ${s.intervalHours} soatda` : 'oʻchirilgan'}\n` +
      `Buni admin panelda oʻzgartirasiz.\n\n${HELP}`,
  );
}

async function handleBackup(chatId: string) {
  await sendChatMessage(chatId, 'Zaxira nusxa tayyorlanmoqda…');
  const backup = await createBackup();
  try {
    await sendBackupDocument(
      chatId,
      backup.filePath,
      backup.fileName,
      `Qoʻlda soʻralgan zaxira nusxa\nHajmi: ${(backup.sizeBytes / 1024).toFixed(0)} KB`,
    );
    await prisma.backupSubscriber.update({
      where: { chatId },
      data: { lastSentAt: new Date() },
    });
  } finally {
    await fs.rm(backup.filePath, { force: true });
  }
}

async function handleStatus(chatId: string) {
  const [s, count] = await Promise.all([getSettings(), prisma.backupSubscriber.count()]);
  const sub = await isSubscribed(chatId);
  await sendChatMessage(
    chatId,
    `Avtomatik zaxira: ${s.enabled ? 'yoqilgan' : 'oʻchirilgan'}\n` +
      `Oraliq: har ${s.intervalHours} soatda\n` +
      `Oxirgi yuborilgan: ${s.lastRunAt ? s.lastRunAt.toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }) : 'hali yoʻq'}\n` +
      `Obunachilar: ${count}\n` +
      `Siz: ${sub ? 'tasdiqlangansiz' : 'tasdiqlanmagansiz'}`,
  );
}

async function handleMessage(msg: NonNullable<import('./telegram.js').TelegramUpdate['message']>) {
  const chatId = String(msg.chat.id);
  if (msg.chat.type !== 'private') return;      // faqat shaxsiy suhbat
  const text = (msg.text ?? '').trim();
  if (!text.startsWith('/')) return;

  const [cmdRaw, ...args] = text.split(/\s+/);
  const cmd = cmdRaw.split('@')[0].toLowerCase();

  if (cmd === '/login') return handleLogin(chatId, args, msg.message_id, msg.chat);
  if (cmd === '/start' || cmd === '/help') return sendChatMessage(chatId, HELP);

  const sub = await isSubscribed(chatId);
  if (!sub) {
    await sendChatMessage(chatId, 'Avval tasdiqlang: <code>/login username parol</code>');
    return;
  }

  if (cmd === '/backup') return handleBackup(chatId);
  if (cmd === '/status') return handleStatus(chatId);
  if (cmd === '/stop') {
    await prisma.backupSubscriber.delete({ where: { chatId } });
    await sendChatMessage(chatId, 'Obuna bekor qilindi. Zaxira nusxalar endi kelmaydi.');
    return;
  }
  await sendChatMessage(chatId, HELP);
}

/** Long polling sikli — webhook va ochiq port kerak emas. */
export function startBackupBot() {
  if (!hasTelegram()) {
    console.log('Zaxira boti ishga tushmadi: TELEGRAM_BOT_TOKEN yoʻq');
    return;
  }

  let offset = 0;
  let backoff = 1000;

  const loop = async () => {
    for (;;) {
      try {
        const updates = await getUpdates(offset);
        backoff = 1000;
        for (const u of updates) {
          offset = u.update_id + 1;
          if (u.message) await handleMessage(u.message).catch((e) => console.error('Bot:', e));
        }
      } catch (err) {
        // Tarmoq uzilishi yoki Telegram xatosi — asta-sekin sekinlashib qayta urinamiz.
        console.error('Bot polling:', err instanceof Error ? err.message : err);
        await new Promise((r) => setTimeout(r, backoff));
        backoff = Math.min(backoff * 2, 60_000);
      }
    }
  };

  void loop();
  console.log('Zaxira boti ishga tushdi (long polling)');
}
