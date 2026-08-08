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
