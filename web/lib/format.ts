const MONTHS = [
  'yanvar', 'fevral', 'mart', 'aprel', 'may', 'iyun',
  'iyul', 'avgust', 'sentabr', 'oktabr', 'noyabr', 'dekabr',
];

export const STATUS_LABEL: Record<string, string> = {
  LIVE: 'Live',
  IN_PROGRESS: 'Ishlab chiqilmoqda',
  ARCHIVED: 'Arxiv',
};

export const STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  LIVE: { color: '#39FF88', bg: 'rgba(57,255,136,0.10)' },
  IN_PROGRESS: { color: '#FFB454', bg: 'rgba(255,180,84,0.10)' },
  ARCHIVED: { color: '#8B99A6', bg: 'rgba(139,153,166,0.10)' },
};

export const CATEGORY_LABEL: Record<string, string> = {
  MANUAL: "Qo'lda qilingan",
  AI: 'AI bilan',
  STARTUP: 'Startap',
};

/** "30-iyul 2026", matching the dates written into the design. */
export function uzDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()}-${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fileSize(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.max(1, Math.round(bytes / 1024))} KB`;
}
