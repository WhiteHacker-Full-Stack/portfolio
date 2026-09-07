import { readFile } from 'node:fs/promises';
import type { BlogPost, Project } from '@prisma/client';
import { env } from '../env.js';

const API = 'https://api.telegram.org';
const EXCERPT_LIMIT = 300;

export class TelegramError extends Error {}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function excerpt(content: string): string {
  const flat = content.replace(/\s+/g, ' ').trim();
  return flat.length > EXCERPT_LIMIT ? `${flat.slice(0, EXCERPT_LIMIT).trimEnd()}…` : flat;
}

export function hasTelegram(): boolean {
  return Boolean(env.telegramBotToken);
}

/** Zaxira arxivini shaxsiy suhbatga fayl sifatida yuboradi. */
export async function sendBackupDocument(
  chatId: string,
  filePath: string,
  fileName: string,
  caption: string,
): Promise<void> {
  const file = await readFile(filePath);
  const form = new FormData();
  form.set('chat_id', chatId);
  form.set('caption', caption);
  form.set('document', new Blob([new Uint8Array(file)]), fileName);

  const res = await fetch(`${API}/bot${env.telegramBotToken}/sendDocument`, {
    method: 'POST',
    body: form,
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  if (!body.ok) throw new TelegramError(body.description ?? 'sendDocument muvaffaqiyatsiz');
}

/** Bot suhbatidagi xabarni o'chiradi — parol chat tarixida qolmasligi uchun. */
export async function deleteMessage(chatId: string, messageId: number): Promise<void> {
  await fetch(`${API}/bot${env.telegramBotToken}/deleteMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, message_id: messageId }),
  }).catch(() => undefined);
}

export async function sendChatMessage(chatId: string, text: string): Promise<void> {
  await callTelegram('sendMessage', { chat_id: chatId, text, parse_mode: 'HTML' });
}

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number; type: string; username?: string; first_name?: string };
    text?: string;
  };
};

/** Long polling — webhook uchun ochiq domen shart emas. */
export async function getUpdates(offset: number, timeoutSec = 30): Promise<TelegramUpdate[]> {
  const res = await fetch(
    `${API}/bot${env.telegramBotToken}/getUpdates?offset=${offset}&timeout=${timeoutSec}&allowed_updates=["message"]`,
    { signal: AbortSignal.timeout((timeoutSec + 10) * 1000) },
  );
  const body = (await res.json()) as { ok: boolean; result?: TelegramUpdate[]; description?: string };
  if (!body.ok) throw new TelegramError(body.description ?? 'getUpdates muvaffaqiyatsiz');
  return body.result ?? [];
}

async function callTelegram(method: string, payload: unknown): Promise<void> {
  const res = await fetch(`${API}/bot${env.telegramBotToken}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const body = (await res.json()) as { ok: boolean; description?: string };
  if (!body.ok) throw new TelegramError(body.description ?? `Telegram ${method} muvaffaqiyatsiz`);
}

/**
 * Posts a project update to the configured channel: bold title, project name,
 * a trimmed excerpt, and a [Batafsil] button pointing at the project page.
 */
export async function sendProjectUpdateToChannel(post: BlogPost, project: Project): Promise<void> {
  if (!env.telegramBotToken || !env.telegramChannelId) {
    throw new TelegramError(
      'TELEGRAM_BOT_TOKEN yoki TELEGRAM_CHANNEL_ID .env faylda toʻldirilmagan',
    );
  }

  const text = [
    `<b>${escapeHtml(post.title)}</b>`,
    `<i>${escapeHtml(project.title)}</i>`,
    '',
    escapeHtml(excerpt(post.content)),
  ].join('\n');

  const reply_markup = {
    inline_keyboard: [[{ text: 'Batafsil', url: `${env.siteUrl}/projects/${project.slug}` }]],
  };

  const imagePath = post.image ?? project.coverImage;
  if (imagePath) {
    try {
      await callTelegram('sendPhoto', {
        chat_id: env.telegramChannelId,
        photo: imagePath.startsWith('http') ? imagePath : `${env.siteUrl}${imagePath}`,
        caption: text,
        parse_mode: 'HTML',
        reply_markup,
      });
      return;
    } catch {
      // Telegram fetches photos itself, so a local/unreachable URL fails —
      // the update still matters, so fall through to a plain text post.
    }
  }

  await callTelegram('sendMessage', {
    chat_id: env.telegramChannelId,
    text,
    parse_mode: 'HTML',
    link_preview_options: { is_disabled: true },
    reply_markup,
  });
}
