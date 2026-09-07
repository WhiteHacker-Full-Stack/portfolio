import { exec } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { env, REPO_ROOT } from '../env.js';
import { prisma } from '../prisma.js';
import { sendBackupDocument } from './telegram.js';

const run = promisify(exec);
const SETTING_ID = 'default';

export type BackupFile = { filePath: string; fileName: string; sizeBytes: number };

/**
 * Bazani va yuklangan fayllarni bitta arxivga yig'adi.
 * SQLite `.backup` buyrug'i bilan nusxalanadi — yozuv o'rtasida ushlanib qolmaslik uchun.
 */
export async function createBackup(): Promise<BackupFile> {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 16);
  const workDir = path.join(env.videoTmpDir, `backup-${randomUUID()}`);
  const dbCopy = path.join(workDir, 'dev.db');
  const fileName = `whitehacker-backup-${stamp}.tar.gz`;
  const filePath = path.join(env.videoTmpDir, fileName);

  await fs.mkdir(workDir, { recursive: true });
  try {
    const dbPath = path.join(REPO_ROOT, 'server/prisma/dev.db');
    // Prisma ochiq ushlab turgan bazani to'g'ridan-to'g'ri ko'chirish xavfli.
    await run(`sqlite3 "${dbPath}" ".backup '${dbCopy}'"`).catch(async () => {
      await fs.copyFile(dbPath, dbCopy);
    });

    const uploads = env.uploadDir;
    await run(
      `tar czf "${filePath}" -C "${workDir}" dev.db -C "${path.dirname(uploads)}" "${path.basename(uploads)}"`,
    );

    const { size } = await fs.stat(filePath);
    return { filePath, fileName, sizeBytes: size };
  } finally {
    await fs.rm(workDir, { recursive: true, force: true });
  }
}

/** Zaxira nusxani barcha tasdiqlangan obunachilarga yuboradi. */
export async function sendBackupToSubscribers(reason: string): Promise<{
  sent: number;
  failed: number;
  sizeBytes: number;
}> {
  const subscribers = await prisma.backupSubscriber.findMany();
  if (subscribers.length === 0) return { sent: 0, failed: 0, sizeBytes: 0 };

  const backup = await createBackup();
  let sent = 0;
  let failed = 0;

  try {
    const caption =
      `Zaxira nusxa — ${reason}\n` +
      `${new Date().toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' })}\n` +
      `Hajmi: ${(backup.sizeBytes / 1024).toFixed(0)} KB`;

    for (const sub of subscribers) {
      try {
        await sendBackupDocument(sub.chatId, backup.filePath, backup.fileName, caption);
        await prisma.backupSubscriber.update({
          where: { id: sub.id },
          data: { lastSentAt: new Date() },
        });
        sent++;
      } catch (err) {
        console.error(`Zaxira yuborilmadi (${sub.chatId}):`, err);
        failed++;
      }
    }
  } finally {
    await fs.rm(backup.filePath, { force: true });
  }

  return { sent, failed, sizeBytes: backup.sizeBytes };
}

export async function getSettings() {
  return prisma.backupSetting.upsert({
    where: { id: SETTING_ID },
    update: {},
    create: { id: SETTING_ID },
  });
}

/**
 * Har 5 daqiqada tekshiradi: sozlamadagi oraliq o'tgan bo'lsa zaxira yuboradi.
 * Cron o'rniga shu usul — server qayta ishga tushsa ham holat bazada saqlanadi.
 */
export function startBackupScheduler() {
  const CHECK_MS = 5 * 60 * 1000;

  const tick = async () => {
    try {
      const s = await getSettings();
      if (!s.enabled) return;

      const dueAt = s.lastRunAt
        ? new Date(s.lastRunAt.getTime() + s.intervalHours * 3600_000)
        : new Date(0);
      if (dueAt > new Date()) return;

      const result = await sendBackupToSubscribers(`avtomatik (har ${s.intervalHours} soatda)`);
      await prisma.backupSetting.update({
        where: { id: SETTING_ID },
        data: { lastRunAt: new Date() },
      });
      if (result.sent || result.failed) {
        console.log(`Zaxira: ${result.sent} yuborildi, ${result.failed} muvaffaqiyatsiz`);
      }
    } catch (err) {
      console.error('Zaxira rejalashtiruvchisi xatosi:', err);
    }
  };

  setTimeout(tick, 30_000).unref();
  setInterval(tick, CHECK_MS).unref();
}
